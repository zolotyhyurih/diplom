import { PgBoss } from "pg-boss";

export const OCR_QUEUE = "process-contract-version";

const g = globalThis as unknown as { boss?: Promise<PgBoss> };

// Одно подключение к очереди на весь процесс (в dev переживает горячую перезагрузку).
export function getBoss() {
  g.boss ??= (async () => {
    const boss = new PgBoss(process.env.DATABASE_URL!);
    boss.on("error", (e) => console.error("[pg-boss]", e));
    await boss.start();
    await boss.createQueue(OCR_QUEUE);
    return boss;
  })();
  return g.boss;
}

export async function enqueueOcr(versionId: string) {
  const boss = await getBoss();
  await boss.send(OCR_QUEUE, { versionId });
}
