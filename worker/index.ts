import "dotenv/config";
import { PgBoss } from "pg-boss";
import { OCR_QUEUE } from "@/lib/queue";
import { processVersion } from "@/lib/ocr/pipeline";

// Отдельный процесс: берёт задачи из очереди и запускает конвейер распознавания.
async function main() {
  const boss = new PgBoss(process.env.DATABASE_URL!);
  boss.on("error", (e) => console.error("[pg-boss]", e));
  await boss.start();
  await boss.createQueue(OCR_QUEUE);

  await boss.work<{ versionId: string }>(OCR_QUEUE, async (jobs) => {
    for (const job of jobs) {
      console.log(`[worker] обработка версии ${job.data.versionId}`);
      await processVersion(job.data.versionId);
      console.log(`[worker] готово ${job.data.versionId}`);
    }
  });

  console.log(`[worker] запущен, очередь «${OCR_QUEUE}»`);

  const stop = async () => {
    await boss.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
