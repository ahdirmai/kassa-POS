import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  clearAnalyticsEvents,
  getAnalyticsStore,
  getLeads,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ events }, leads] = await Promise.all([
    getAnalyticsStore(),
    getLeads(),
  ]);

  const pageviews = events.filter((e) => e.type === "pageview");
  const clicks = events.filter((e) => e.type === "click");

  const uniqueVisitorSet = new Set(pageviews.map((e) => e.visitorId));
  const todayKey = toDayKey(new Date());
  const todayViews = pageviews.filter(
    (e) => e.createdAt.slice(0, 10) === todayKey
  ).length;
  const todayUnique = new Set(
    pageviews
      .filter((e) => e.createdAt.slice(0, 10) === todayKey)
      .map((e) => e.visitorId)
  ).size;

  // 14-day series
  const dailyMap = new Map<
    string,
    { date: string; views: number; visitors: Set<string>; clicks: number; leads: number }
  >();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDayKey(d);
    dailyMap.set(key, {
      date: key,
      views: 0,
      visitors: new Set(),
      clicks: 0,
      leads: 0,
    });
  }

  for (const ev of events) {
    const key = ev.createdAt.slice(0, 10);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    if (ev.type === "pageview") {
      bucket.views += 1;
      bucket.visitors.add(ev.visitorId);
    } else {
      bucket.clicks += 1;
    }
  }

  for (const lead of leads) {
    const key = lead.createdAt.slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) bucket.leads += 1;
  }

  const daily = Array.from(dailyMap.values()).map((b) => ({
    date: b.date,
    views: b.views,
    uniqueVisitors: b.visitors.size,
    clicks: b.clicks,
    leads: b.leads,
  }));

  // Device breakdown (based on pageviews)
  const deviceCounts: Record<string, number> = {
    Desktop: 0,
    Mobile: 0,
    Tablet: 0,
  };
  for (const ev of pageviews) {
    deviceCounts[ev.device] = (deviceCounts[ev.device] || 0) + 1;
  }

  // Top sources / referrers
  const sourceCounts = new Map<string, number>();
  for (const ev of pageviews) {
    const src = ev.source || "Direct";
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  }
  const topSources = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Top clicked CTAs
  const ctaCounts = new Map<string, number>();
  for (const ev of clicks) {
    const label = ev.label || ev.target || "CTA";
    ctaCounts.set(label, (ctaCounts.get(label) || 0) + 1);
  }
  const topCtas = Array.from(ctaCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalUnique = uniqueVisitorSet.size;
  const conversionRate =
    totalUnique > 0
      ? Number(((leads.length / totalUnique) * 100).toFixed(2))
      : 0;

  const recentEvents = [...events].reverse().slice(0, 30);

  return NextResponse.json({
    summary: {
      totalViews: pageviews.length,
      uniqueVisitors: totalUnique,
      todayViews,
      todayUnique,
      totalClicks: clicks.length,
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      conversionRate,
    },
    daily,
    devices: Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
    })),
    topSources,
    topCtas,
    recentEvents,
  });
}

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await clearAnalyticsEvents();
  return NextResponse.json({ ok: true });
}
