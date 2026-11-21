import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DEFAULT_LANDING_CONTENT } from "./default-content";
import type {
  AnalyticsEvent,
  AnalyticsStore,
  LandingContent,
  Lead,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");

const ADMIN_API_URL =
  process.env.ADMIN_API_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  "http://localhost:4001/api/v1";

const MAX_ANALYTICS_EVENTS = 20000;

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureDataDir();
  const tmpPath = `${filePath}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// --- LANDING CONTENT ---

export async function getLandingContent(): Promise<LandingContent> {
  let stored: Partial<LandingContent> | null = null;

  // Prioritas 1: Ambil dari admin-api (MySQL Single Source of Truth)
  try {
    const res = await fetch(`${ADMIN_API_URL}/public/landing/content`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Partial<LandingContent> | null };
      if (json?.data) {
        stored = json.data;
      }
    }
  } catch {
    // Fallback ke file JSON lokal jika admin-api sedang tidak aktif
  }

  if (!stored) {
    stored = await readJsonSafe<Partial<LandingContent> | null>(
      CONTENT_FILE,
      null
    );
  }
  if (!stored) {
    const seeded = {
      ...DEFAULT_LANDING_CONTENT,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeJsonAtomic(CONTENT_FILE, seeded);
    } catch {
      // Ignore write error on read-only environments
    }
    return seeded;
  }

  // Deep-merge top-level sections with defaults so missing keys never crash UI
  return {
    ...DEFAULT_LANDING_CONTENT,
    ...stored,
    general: { ...DEFAULT_LANDING_CONTENT.general, ...(stored.general ?? {}) },
    hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(stored.hero ?? {}) },
    mobileCard: {
      ...DEFAULT_LANDING_CONTENT.mobileCard,
      ...(stored.mobileCard ?? {}),
    },
    footerCta: {
      ...DEFAULT_LANDING_CONTENT.footerCta,
      ...(stored.footerCta ?? {}),
    },
    metrics:
      Array.isArray(stored.metrics) && stored.metrics.length > 0
        ? stored.metrics
        : DEFAULT_LANDING_CONTENT.metrics,
    showcaseTabs:
      Array.isArray(stored.showcaseTabs) && stored.showcaseTabs.length > 0
        ? stored.showcaseTabs
        : DEFAULT_LANDING_CONTENT.showcaseTabs,
    pricing:
      Array.isArray(stored.pricing) && stored.pricing.length > 0
        ? stored.pricing
        : DEFAULT_LANDING_CONTENT.pricing,
    faqs:
      Array.isArray(stored.faqs)
        ? stored.faqs
        : DEFAULT_LANDING_CONTENT.faqs,
    updatedAt: stored.updatedAt || new Date().toISOString(),
  };
}

export async function saveLandingContent(
  content: LandingContent
): Promise<LandingContent> {
  const next: LandingContent = {
    ...content,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(CONTENT_FILE, next);
  return next;
}

export async function resetLandingContent(): Promise<LandingContent> {
  const fresh: LandingContent = {
    ...DEFAULT_LANDING_CONTENT,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(CONTENT_FILE, fresh);
  return fresh;
}

// --- LEADS ---

export async function getLeads(): Promise<Lead[]> {
  const leads = await readJsonSafe<Lead[]>(LEADS_FILE, []);
  return Array.isArray(leads)
    ? leads.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];
}

export async function createLead(
  input: Omit<Lead, "id" | "status" | "notes" | "createdAt" | "updatedAt"> & {
    status?: Lead["status"];
    notes?: string;
  }
): Promise<Lead> {
  const leads = await getLeads();
  const now = new Date().toISOString();
  const lead: Lead = {
    id: `lead_${crypto.randomBytes(6).toString("hex")}`,
    name: input.name.trim(),
    businessName: input.businessName.trim(),
    whatsapp: input.whatsapp.trim(),
    email: input.email?.trim() || "",
    outletCount: input.outletCount || "1 outlet",
    planInterest: input.planInterest || "Pro",
    message: input.message?.trim() || "",
    status: input.status || "new",
    notes: input.notes?.trim() || "",
    source: input.source || "landing-form",
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    createdAt: now,
    updatedAt: now,
  };
  leads.unshift(lead);
  await writeJsonAtomic(LEADS_FILE, leads);

  // Sinkronkan ke admin-api (MySQL) agar langsung tampil di Back Office Leads CRM
  try {
    await fetch(`${ADMIN_API_URL}/public/landing/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        businessName: lead.businessName,
        whatsapp: lead.whatsapp,
        email: lead.email || undefined,
        outletCount: lead.outletCount,
        planInterest: lead.planInterest,
        message: lead.message || undefined,
        source: lead.source,
        utmSource: lead.utmSource || undefined,
        utmMedium: lead.utmMedium || undefined,
        utmCampaign: lead.utmCampaign || undefined,
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Tetap aman karena sudah tersimpan lokal sebagai fallback
  }

  return lead;
}

export async function updateLead(
  id: string,
  patch: Partial<
    Pick<
      Lead,
      | "name"
      | "businessName"
      | "whatsapp"
      | "email"
      | "outletCount"
      | "planInterest"
      | "message"
      | "status"
      | "notes"
    >
  >
): Promise<Lead | null> {
  const leads = await getLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = {
    ...leads[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(LEADS_FILE, leads);
  return leads[idx];
}

export async function deleteLead(id: string): Promise<boolean> {
  const leads = await getLeads();
  const next = leads.filter((l) => l.id !== id);
  if (next.length === leads.length) return false;
  await writeJsonAtomic(LEADS_FILE, next);
  return true;
}

// --- ANALYTICS ---

export async function getAnalyticsStore(): Promise<AnalyticsStore> {
  const store = await readJsonSafe<AnalyticsStore>(ANALYTICS_FILE, {
    events: [],
  });
  return {
    events: Array.isArray(store.events) ? store.events : [],
  };
}

export async function appendAnalyticsEvent(
  event: Omit<AnalyticsEvent, "id" | "createdAt">
): Promise<AnalyticsEvent> {
  const store = await getAnalyticsStore();
  const fullEvent: AnalyticsEvent = {
    ...event,
    id: `ev_${crypto.randomBytes(6).toString("hex")}`,
    createdAt: new Date().toISOString(),
  };
  store.events.push(fullEvent);
  if (store.events.length > MAX_ANALYTICS_EVENTS) {
    store.events = store.events.slice(-MAX_ANALYTICS_EVENTS);
  }
  await writeJsonAtomic(ANALYTICS_FILE, store);

  // Forward event analytics ke admin-api (MySQL)
  try {
    await fetch(`${ADMIN_API_URL}/public/landing/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: fullEvent.type,
        visitorId: fullEvent.visitorId,
        path: fullEvent.path,
        referrer: fullEvent.referrer || undefined,
        source: fullEvent.source,
        device: fullEvent.device,
        label: fullEvent.label || undefined,
        target: fullEvent.target || undefined,
        utmSource: fullEvent.utmSource || undefined,
        utmMedium: fullEvent.utmMedium || undefined,
        utmCampaign: fullEvent.utmCampaign || undefined,
      }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Non-blocking
  }

  return fullEvent;
}

export async function clearAnalyticsEvents(): Promise<void> {
  await writeJsonAtomic(ANALYTICS_FILE, { events: [] });
}
