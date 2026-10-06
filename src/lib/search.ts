import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ContractFilters = {
  q?: string;
  status?: string;
  categoryId?: string;
};

export type ContractRow = {
  id: string;
  number: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  expiresAt: Date | null;
  counterparty: string;
  category: string | null;
  snippet: string | null;
};

const STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"];

// Маркеры подсветки вместо HTML: текст договора приходит от пользователя, HTML из него не собираем.
export const MARK_START = "⟦";
export const MARK_END = "⟧";

export async function findContracts(filters: ContractFilters): Promise<ContractRow[]> {
  const q = filters.q?.trim().slice(0, 200);
  const status = filters.status && STATUSES.includes(filters.status) ? filters.status : undefined;
  const categoryId = filters.categoryId || undefined;

  if (!q) {
    const rows = await prisma.contract.findMany({
      where: {
        ...(status ? { status: status as ContractRow["status"] } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { counterparty: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      status: c.status,
      expiresAt: c.expiresAt,
      counterparty: c.counterparty.name,
      category: c.category?.name ?? null,
      snippet: null,
    }));
  }

  const conditions: Prisma.Sql[] = [];
  if (status) conditions.push(Prisma.sql`AND c.status = ${status}::"ContractStatus"`);
  if (categoryId) conditions.push(Prisma.sql`AND c.category_id = ${categoryId}`);
  const extra = conditions.length ? Prisma.join(conditions, " ") : Prisma.empty;

  // Каждое условие поиска вынесено в отдельный подзапрос, чтобы PostgreSQL мог использовать GIN-индексы
  // (условие «или» через разные таблицы сваливало запрос в полный перебор). Выражение по договору должно
  // совпадать с индексом contracts_fts_idx, а текст версий ищется по готовому вектору search_vector.
  // Фрагменты ts_headline считаются только для отобранных ста договоров.
  return prisma.$queryRaw<ContractRow[]>`
    WITH query AS (SELECT websearch_to_tsquery('russian', ${q}) AS tsq),
    meta AS (
      SELECT c.id AS contract_id
      FROM contracts c, query
      WHERE to_tsvector('russian', coalesce(c.title, '') || ' ' || coalesce(c.number, '') || ' ' || coalesce(c.description, '')) @@ query.tsq
      UNION
      SELECT c.id
      FROM contracts c
      JOIN counterparties cp ON cp.id = c.counterparty_id, query
      WHERE to_tsvector('russian', cp.name) @@ query.tsq
      UNION
      SELECT ct."A"
      FROM "_ContractToTag" ct
      JOIN tags t ON t.id = ct."B", query
      WHERE to_tsvector('russian', t.name) @@ query.tsq
    ),
    text_hits AS (
      SELECT DISTINCT ON (v.contract_id) v.contract_id, v.id AS version_id, ts_rank(v.search_vector, query.tsq) AS rank
      FROM contract_versions v, query
      WHERE v.search_vector @@ query.tsq
      ORDER BY v.contract_id, rank DESC, v.version_number DESC
    ),
    top AS (
      SELECT c.id, c.title, th.version_id,
        coalesce(th.rank, 0) + CASE WHEN m.contract_id IS NOT NULL THEN 1 ELSE 0 END AS score
      FROM contracts c
      LEFT JOIN text_hits th ON th.contract_id = c.id
      LEFT JOIN meta m ON m.contract_id = c.id
      WHERE (th.contract_id IS NOT NULL OR m.contract_id IS NOT NULL)
      ${extra}
      ORDER BY score DESC, c.title
      LIMIT 100
    )
    SELECT
      c.id,
      c.number,
      c.title,
      c.status,
      c.expires_at AS "expiresAt",
      cp.name AS counterparty,
      cat.name AS category,
      CASE WHEN t.version_id IS NOT NULL
        THEN ts_headline('russian', v.extracted_text, query.tsq,
             ${`StartSel=${MARK_START}, StopSel=${MARK_END}, MaxFragments=2, MinWords=6, MaxWords=22, FragmentDelimiter= … `})
        ELSE NULL
      END AS snippet
    FROM top t
    JOIN contracts c ON c.id = t.id
    JOIN counterparties cp ON cp.id = c.counterparty_id
    LEFT JOIN categories cat ON cat.id = c.category_id
    LEFT JOIN contract_versions v ON v.id = t.version_id
    CROSS JOIN query
    ORDER BY t.score DESC, t.title
  `;
}
