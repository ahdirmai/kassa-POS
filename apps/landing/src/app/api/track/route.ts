import { NextResponse } from "next/server";
import { appendAnalyticsEvent } from "@/lib/storage";
import type { AnalyticsEventType, DeviceType } from "@/lib/types";

function detectDevice(ua: string): DeviceType {
  const lower = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(lower)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(lower)) {
    return "Mobile";
  }
  return "Desktop";
}

function normalizeSource(referrer: string, utmSource?: string): string {
  if (utmSource && utmSource.trim()) {
    return utmSource.trim().toLowerCase();
  }
  if (!referrer) return "Direct";
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace(/^www\./, "");
    if (host.includes("google.")) return "Google";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("tiktok.")) return "TikTok";
    if (host.includes("youtube.") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("whatsapp.") || host.includes("wa.me")) return "WhatsApp";
    if (host.includes("t.co") || host.includes("x.com") || host.includes("twitter."))
      return "X / Twitter";
    return host || "Direct";
  } catch {
    return "Direct";
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      type?: AnalyticsEventType;
      visitorId?: string;
      path?: string;
      referrer?: string;
      label?: string;
      target?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };

    const type: AnalyticsEventType =
      body.type === "click" ? "click" : "pageview";
    const ua = req.headers.get("user-agent") || "";
    const referrer = (body.referrer || "").slice(0, 300);
    const source = normalizeSource(referrer, body.utmSource);

    await appendAnalyticsEvent({
      type,
      visitorId: (body.visitorId || "anon").slice(0, 64),
      path: (body.path || "/").slice(0, 200),
      referrer,
      source,
      device: detectDevice(ua),
      label: body.label?.slice(0, 120),
      target: body.target?.slice(0, 250),
      utmSource: body.utmSource?.slice(0, 80),
      utmMedium: body.utmMedium?.slice(0, 80),
      utmCampaign: body.utmCampaign?.slice(0, 80),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
