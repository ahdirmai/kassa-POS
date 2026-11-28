import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "tumpu_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "tumpu_dev_fallback_secret_change_in_env_local"
  );
}

export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@tumpu.biz.id").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "tumpu-admin-2026",
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  return safeEqual(normalizedEmail, creds.email) && safeEqual(password, creds.password);
}

export interface AdminSession {
  email: string;
  exp: number;
}

export function createSessionToken(email: string): string {
  const payload: AdminSession = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("hex");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("hex");

  if (!safeEqual(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSession;
    if (!parsed?.email || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
