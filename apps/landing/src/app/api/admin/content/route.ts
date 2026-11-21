import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  getLandingContent,
  resetLandingContent,
  saveLandingContent,
} from "@/lib/storage";
import type { LandingContent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const content = await getLandingContent();
  return NextResponse.json(content);
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as LandingContent;
    const saved = await saveLandingContent(body);
    return NextResponse.json({ ok: true, content: saved });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan konten." },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { action?: string };
    if (body.action === "reset") {
      const reset = await resetLandingContent();
      return NextResponse.json({ ok: true, content: reset });
    }
    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
}
