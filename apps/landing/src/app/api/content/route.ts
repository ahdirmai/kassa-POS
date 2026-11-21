import { NextResponse } from "next/server";
import { getLandingContent } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getLandingContent();
  return NextResponse.json(content);
}
