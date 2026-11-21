import { create } from "zustand";

export type ThemeMode = "light" | "dark";
export type AccentMode = "ocean" | "sage" | "coral" | "amber" | "mono";

export interface ToastItem {
  id: string;
  message: string;
  tone?: "good" | "warn" | "bad" | "info";
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface UiState {
  theme: ThemeMode;
  accent: AccentMode;
  isOnline: boolean;
  isSyncing: boolean;
  pendingOffline: number;
  failedOffline: number;
  offlineDrawerOpen: boolean;
  deferredInstallPrompt: BeforeInstallPromptEvent | null;
  toasts: ToastItem[];
  finderOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentMode) => void;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingOffline: (count: number) => void;
  setFailedOffline: (count: number) => void;
  setOfflineDrawerOpen: (open: boolean) => void;
  setDeferredInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  dismissToast: (id: string) => void;
  setFinderOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: "light",
  accent: "ocean",
  isOnline: true,
  isSyncing: false,
  pendingOffline: 0,
  failedOffline: 0,
  offlineDrawerOpen: false,
  deferredInstallPrompt: null,
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
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingOffline: (pendingOffline) => set({ pendingOffline }),
  setFailedOffline: (failedOffline) => set({ failedOffline }),
  setOfflineDrawerOpen: (offlineDrawerOpen) => set({ offlineDrawerOpen }),
  setDeferredInstallPrompt: (deferredInstallPrompt) => set({ deferredInstallPrompt }),
  pushToast: (message, tone = "good") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setFinderOpen: (finderOpen) => set({ finderOpen }),
}));
