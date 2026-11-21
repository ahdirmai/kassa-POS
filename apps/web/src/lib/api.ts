import { useAuthStore, type UserSession } from "@/stores/auth-store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const mem = useAuthStore.getState().accessToken;
  if (mem) return mem;
  try {
    const raw = localStorage.getItem("cadra_pos_auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
          credentials: "include",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string; user: UserSession };
        useAuthStore.getState().setSession(data.user, data.accessToken);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  // Auto-refresh JWT access token saat 401 (kecuali endpoint /auth/*)
  if (res.status === 401 && !_retried && !path.startsWith("/auth/")) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return apiFetch<T>(path, init, true);
    }
    if (typeof window !== "undefined") {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  if (!res.ok) {
    let errData: { code?: string; message?: string } = {};
    try {
      errData = await res.json();
    } catch {}
    throw new ApiError(res.status, errData.code ?? "API_ERROR", errData.message ?? `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}
