import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface MediaItem {
  name: string;
  url: string;
  folder: "screenshots" | "uploads";
  size: number;
  updatedAt: string;
}

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function listFolder(
  folder: "screenshots" | "uploads"
): Promise<MediaItem[]> {
  const dir = path.join(process.cwd(), "public", folder);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const items: MediaItem[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) continue;
      const stat = await fs.stat(path.join(dir, entry.name));
      items.push({
        name: entry.name,
        url: `/${folder}/${entry.name}`,
        folder,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    }
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [uploads, screenshots] = await Promise.all([
    listFolder("uploads"),
    listFolder("screenshots"),
  ]);
  return NextResponse.json({
    items: [...uploads, ...screenshots],
  });
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { url?: string };
    const url = body.url || "";
    if (!url.startsWith("/uploads/")) {
      return NextResponse.json(
        { error: "Hanya gambar hasil upload di /uploads/ yang dapat dihapus." },
        { status: 400 }
      );
    }
    const fileName = path.basename(url);
    const targetPath = path.join(process.cwd(), "public", "uploads", fileName);
    await fs.unlink(targetPath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus gambar." },
      { status: 400 }
    );
  }
}
