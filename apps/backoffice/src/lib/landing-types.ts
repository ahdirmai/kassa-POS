export interface ShowcaseTabItem {
  id: string;
  label: string;
  route: string;
  tag: string;
  title: string;
  img: string;
}

export interface MetricItem {
  id: string;
  prefix: string;
  value: number;
  secondaryValue?: number;
  separator?: string;
  suffix: string;
  label: string;
}

export interface PricingPlanItem {
  id: string;
  name: string;
  tag: string;
  price: string;
  period: string;
  desc: string;
  featured: boolean;
  cta: string;
  href: string;
  items: string[];
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface LandingContent {
  general: {
    brandName: string;
    domain: string;
    appUrl: string;
    waNumber: string;
    waMessage: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    footnote: string;
  };
  metrics: MetricItem[];
  showcaseTabs: ShowcaseTabItem[];
  mobileCard: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    highlights: string[];
    screenshot: string;
  };
  pricing: PricingPlanItem[];
  faqs: FaqItem[];
  footerCta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    primaryCta: string;
    secondaryCta: string;
  };
  updatedAt: string;
}

export type LeadStatus = "new" | "contacted" | "demo" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  businessName: string;
  whatsapp: string;
  email?: string;
  outletCount: string;
  planInterest: string;
  message: string;
  status: LeadStatus;
  notes: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type AnalyticsEventType = "pageview" | "click";
export type DeviceType = "Desktop" | "Mobile" | "Tablet";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  visitorId: string;
  path: string;
  referrer: string;
  source: string;
  device: DeviceType;
  label?: string;
  target?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

export interface AnalyticsStore {
  events: AnalyticsEvent[];
}
