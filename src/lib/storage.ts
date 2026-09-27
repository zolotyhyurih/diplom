import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_TYPES } from "@/lib/schemas";

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./storage/uploads");
}

export function absolutePath(storagePath: string) {
  const root = uploadRoot();
  const full = path.resolve(/*turbopackIgnore: true*/ root, storagePath);
  if (!full.startsWith(root + path.sep)) throw new Error("Недопустимый путь к файлу");
  return full;
}

// Файл хранится под случайным именем, оригинальное имя — только в БД.
export async function saveFile(contractId: string, file: File) {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Недопустимый тип файла");

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const storagePath = path.join(/*turbopackIgnore: true*/ contractId,`${randomUUID()}${ext}`);
  const full = absolutePath(storagePath);

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return { storagePath, sha256, size: buffer.length };
}

export async function removeFile(storagePath: string) {
  try {
    await unlink(absolutePath(storagePath));
  } catch {
    // файла уже нет — не критично
  }
}
