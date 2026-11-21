"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import type { LandingContent } from "@/lib/types";

interface MediaItem {
  name: string;
  url: string;
  folder: "screenshots" | "uploads";
  size: number;
  updatedAt: string;
}

interface MediaTabProps {
  content: LandingContent;
  onChange: (next: LandingContent) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}

export default function MediaTab({
  content,
  onChange,
  onSave,
  saving,
  onNotify,
}: MediaTabProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { items: MediaItem[] };
      setMedia(json.items);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        onNotify(data.error || "Upload gagal.", "err");
      } else {
        onNotify(`Gambar berhasil diunggah (${data.url}).`);
        await loadMedia();
      }
    } catch {
      onNotify("Gagal mengunggah gambar.", "err");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMedia = async (url: string) => {
    if (!window.confirm(`Hapus gambar ${url}?`)) return;
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onNotify(data.error || "Gagal menghapus gambar.", "err");
      } else {
        onNotify("Gambar dihapus.");
        await loadMedia();
      }
    } catch {
      onNotify("Gagal menghapus gambar.", "err");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            Media &amp; Screenshot Showcase
          </h2>
          <p className="text-[13.5px] text-[var(--ink-secondary)]">
            Unggah screenshot baru dan atur gambar untuk tab showcase serta tampilan mobile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-[12.5px] font-medium hover:bg-[var(--surface-subtle)]"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Mengunggah..." : "Upload Gambar"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : "Simpan Showcase"}
          </button>
        </div>
      </div>

      {/* Showcase Tabs Editor */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15.5px] font-semibold">
              Tab Showcase Hero (Scroll-Expand)
            </h3>
            <p className="text-[12.5px] text-[var(--ink-muted)]">
              Atur modul yang tampil di mockup browser utama landing page.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...content,
                showcaseTabs: [
                  ...content.showcaseTabs,
                  {
                    id: `tab-${Date.now()}`,
                    label: "Modul Baru",
                    route: "/modul",
                    tag: "Baru",
                    title: "Deskripsi singkat layar modul ini.",
                    img: media[0]?.url || "/screenshots/02-pos.png",
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-[12.5px] font-medium hover:bg-[var(--surface-subtle)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Tab
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {content.showcaseTabs.map((tab, idx) => (
            <div
              key={tab.id}
              className="grid items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 lg:grid-cols-12"
            >
              <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] lg:col-span-4">
                <img
                  src={tab.img}
                  alt={tab.label}
                  className="aspect-[16/10] w-full object-cover object-top"
                />
              </div>

              <div className="space-y-3 lg:col-span-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Tab #{idx + 1}
                  </span>
                  {content.showcaseTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...content,
                          showcaseTabs: content.showcaseTabs.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="inline-flex items-center gap-1 text-[12px] text-red-500 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11.5px] text-[var(--ink-secondary)]">
                      Label Tab
                    </label>
                    <input
                      className={inputClass}
                      value={tab.label}
                      onChange={(e) => {
                        const next = [...content.showcaseTabs];
                        next[idx] = { ...tab, label: e.target.value };
                        onChange({ ...content, showcaseTabs: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] text-[var(--ink-secondary)]">
                      Route URL
                    </label>
                    <input
                      className={inputClass}
                      value={tab.route}
                      onChange={(e) => {
                        const next = [...content.showcaseTabs];
                        next[idx] = { ...tab, route: e.target.value };
                        onChange({ ...content, showcaseTabs: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] text-[var(--ink-secondary)]">
                      Tag Badge
                    </label>
                    <input
                      className={inputClass}
                      value={tab.tag}
                      onChange={(e) => {
                        const next = [...content.showcaseTabs];
                        next[idx] = { ...tab, tag: e.target.value };
                        onChange({ ...content, showcaseTabs: next });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] text-[var(--ink-secondary)]">
                    Caption Baris Bawah
                  </label>
                  <input
                    className={inputClass}
                    value={tab.title}
                    onChange={(e) => {
                      const next = [...content.showcaseTabs];
                      next[idx] = { ...tab, title: e.target.value };
                      onChange({ ...content, showcaseTabs: next });
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] text-[var(--ink-secondary)]">
                    Pilih Screenshot
                  </label>
                  <select
                    className={inputClass}
                    value={tab.img}
                    onChange={(e) => {
                      const next = [...content.showcaseTabs];
                      next[idx] = { ...tab, img: e.target.value };
                      onChange({ ...content, showcaseTabs: next });
                    }}
                  >
                    {!media.some((m) => m.url === tab.img) && (
                      <option value={tab.img}>{tab.img}</option>
                    )}
                    {media.map((m) => (
                      <option key={m.url} value={m.url}>
                        [{m.folder}] {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile POS Screenshot */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="text-[15.5px] font-semibold">
          Screenshot Kartu Mobile POS
        </h3>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <img
            src={content.mobileCard.screenshot}
            alt="Mobile POS"
            className="h-36 w-20 rounded-xl border border-[var(--border)] object-cover"
          />
          <div className="flex-1 space-y-2">
            <label className="block text-[12px] font-medium text-[var(--ink-secondary)]">
              Gambar untuk Mockup Ponsel
            </label>
            <select
              className={inputClass}
              value={content.mobileCard.screenshot}
              onChange={(e) =>
                onChange({
                  ...content,
                  mobileCard: {
                    ...content.mobileCard,
                    screenshot: e.target.value,
                  },
                })
              }
            >
              {media.map((m) => (
                <option key={m.url} value={m.url}>
                  [{m.folder}] {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Media Library */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-[15.5px] font-semibold">
              Galeri Media ({media.length} file)
            </h3>
          </div>
          <span className="text-[12px] text-[var(--ink-muted)]">
            Format PNG, JPG, WEBP · Maks 5MB
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.url}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--surface-subtle)]">
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium">
                    {item.name}
                  </div>
                  <div className="font-mono-num text-[10.5px] text-[var(--ink-muted)]">
                    /{item.folder} · {(item.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                {item.folder === "uploads" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(item.url)}
                    title="Hapus file upload"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--border)] text-[var(--ink-muted)] hover:border-red-500/40 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
