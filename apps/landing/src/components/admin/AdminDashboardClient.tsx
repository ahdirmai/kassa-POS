"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  FileEdit,
  Images,
  LogOut,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import OverviewTab from "./OverviewTab";
import LeadsTab from "./LeadsTab";
import ContentTab from "./ContentTab";
import MediaTab from "./MediaTab";
import type { LandingContent } from "@/lib/types";

type AdminTab = "overview" | "leads" | "content" | "media";

interface AdminDashboardClientProps {
  adminEmail: string;
}

export default function AdminDashboardClient({
  adminEmail,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dark, setDark] = useState(false);
  const [content, setContent] = useState<LandingContent | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(
    null
  );

  const notify = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.msg === msg ? null : curr));
    }, 3200);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tumpu-landing-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const loadContent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await res.json()) as LandingContent;
      setContent(data);
    } catch {
      notify("Gagal memuat konten landing.", "err");
    }
  }, [router, notify]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tumpu-landing-theme", next ? "dark" : "light");
  };

  const handleSaveContent = async () => {
    if (!content) return;
    setSavingContent(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { content: LandingContent };
      setContent(json.content);
      notify("Perubahan konten landing berhasil disimpan.");
    } catch {
      notify("Gagal menyimpan konten landing.", "err");
    } finally {
      setSavingContent(false);
    }
  };

  const handleResetContent = async () => {
    if (
      !window.confirm(
        "Kembalikan semua teks, harga, FAQ, dan showcase ke pengaturan awal?"
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { content: LandingContent };
      setContent(json.content);
      notify("Konten landing dikembalikan ke default.");
    } catch {
      notify("Gagal mereset konten.", "err");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems: { key: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Pengunjung & Analytics", icon: BarChart3 },
    { key: "leads", label: "Manajemen Leads", icon: Users },
    { key: "content", label: "CMS Konten", icon: FileEdit },
    { key: "media", label: "Media & Showcase", icon: Images },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/branding/tumpu-icon-dark.svg"
              alt="Tumpu"
              width={34}
              height={34}
              className="h-8.5 w-8.5 rounded-lg"
            />
            <div>
              <div className="text-[14.5px] font-semibold tracking-tight">
                Tumpu Landing Admin
              </div>
              <div className="font-mono-num text-[11px] text-[var(--ink-muted)]">
                {adminEmail}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              Lihat Landing
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah tema"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink-secondary)] hover:text-red-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-12">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3">
          <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 lg:sticky lg:top-24 lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active Panel */}
        <main className="min-w-0 lg:col-span-9">
          {tab === "overview" && (
            <OverviewTab
              onNotify={notify}
              onJumpToLeads={() => setTab("leads")}
            />
          )}

          {tab === "leads" && <LeadsTab onNotify={notify} />}

          {tab === "content" && content && (
            <ContentTab
              content={content}
              onChange={setContent}
              onSave={handleSaveContent}
              onReset={handleResetContent}
              saving={savingContent}
            />
          )}

          {tab === "media" && content && (
            <MediaTab
              content={content}
              onChange={setContent}
              onSave={handleSaveContent}
              saving={savingContent}
              onNotify={notify}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-xl border px-4 py-3 text-[13px] font-medium shadow-xl ${
            toast.tone === "err"
              ? "border-red-500/30 bg-red-600 text-white"
              : "border-[var(--border-strong)] bg-[var(--ink)] text-[var(--bg)]"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
