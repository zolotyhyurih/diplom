import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { absolutePath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const { versionId } = await params;
  const version = await prisma.contractVersion.findUnique({ where: { id: versionId } });
  if (!version) return new Response(null, { status: 404 });

  const file = absolutePath(version.storagePath);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response(null, { status: 404 });
  }

  const download = new URL(req.url).searchParams.has("download");
  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(version.fileName)}`;

  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Length": String(size),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
