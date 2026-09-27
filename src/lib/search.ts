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

  // Ищем по метаданным договора, названию контрагента и распознанному тексту всех версий.
  const extra = conditions.length ? Prisma.join(conditions, " ") : Prisma.empty;

  return prisma.$queryRaw<ContractRow[]>`
    WITH query AS (SELECT websearch_to_tsquery('russian', ${q}) AS tsq),
    found AS (
    SELECT DISTINCT ON (c.id)
      c.id,
      c.number,
      c.title,
      c.status,
      c.expires_at AS "expiresAt",
      cp.name AS counterparty,
      cat.name AS category,
      CASE
        WHEN v.extracted_text IS NOT NULL
         AND to_tsvector('russian', coalesce(v.extracted_text, '')) @@ query.tsq
        THEN ts_headline('russian', v.extracted_text, query.tsq,
             ${`StartSel=${MARK_START}, StopSel=${MARK_END}, MaxFragments=2, MinWords=6, MaxWords=22, FragmentDelimiter= … `})
        ELSE NULL
      END AS snippet,
      ts_rank(to_tsvector('russian', coalesce(v.extracted_text, '')), query.tsq) AS rank
    FROM contracts c
    JOIN counterparties cp ON cp.id = c.counterparty_id
    LEFT JOIN categories cat ON cat.id = c.category_id
    LEFT JOIN contract_versions v ON v.contract_id = c.id
    CROSS JOIN query
    WHERE (
      to_tsvector('russian', coalesce(c.title, '') || ' ' || coalesce(c.number, '') || ' ' || coalesce(c.description, '')) @@ query.tsq
      OR to_tsvector('russian', cp.name) @@ query.tsq
      OR to_tsvector('russian', coalesce(v.extracted_text, '')) @@ query.tsq
    )
    ${extra}
    ORDER BY c.id, (to_tsvector('russian', coalesce(v.extracted_text, '')) @@ query.tsq) DESC, v.version_number DESC
    )
    SELECT id, number, title, status, "expiresAt", counterparty, category, snippet
    FROM found
    ORDER BY rank DESC, title
    LIMIT 100
  `;
}
