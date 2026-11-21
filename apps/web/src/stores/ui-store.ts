import { create } from "zustand";

export type ThemeMode = "light" | "dark";
export type AccentMode = "ocean" | "sage" | "coral" | "amber" | "mono";

export interface ToastItem {
  id: string;
  message: string;
  tone?: "good" | "warn" | "bad" | "info";
}

interface UiState {
  theme: ThemeMode;
  accent: AccentMode;
  isOnline: boolean;
  pendingOffline: number;
  toasts: ToastItem[];
  finderOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentMode) => void;
  setOnline: (online: boolean) => void;
  setPendingOffline: (count: number) => void;
  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  dismissToast: (id: string) => void;
  setFinderOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: "light",
  accent: "ocean",
  isOnline: true,
  pendingOffline: 0,
  toasts: [],
  finderOpen: false,
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("cadra_theme", theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  setAccent: (accent) => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.accent = accent;
      localStorage.setItem("cadra_accent", accent);
    }
    set({ accent });
  },
  setOnline: (isOnline) => set({ isOnline }),
  setPendingOffline: (pendingOffline) => set({ pendingOffline }),
  pushToast: (message, tone = "good") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setFinderOpen: (finderOpen) => set({ finderOpen }),
}));
