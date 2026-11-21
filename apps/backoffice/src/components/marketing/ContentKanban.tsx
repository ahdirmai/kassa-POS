"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Film,
  Flame,
  GripVertical,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import type { ContentPost, PostStatus } from "@/data/marketing-data";

interface ContentKanbanProps {
  posts: ContentPost[];
  getStatus: (id: string) => PostStatus;
  getCaption: (post: ContentPost) => string;
  onUpdateStatus: (id: string, status: PostStatus) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  onCopy: (text: string, label?: string) => void;
}

const COLUMNS: Array<{
  status: PostStatus;
  label: string;
  color: string;
  emptyText: string;
}> = [
  {
    status: "draft",
    label: "Draft / Ide",
    color: "var(--coral)",
    emptyText: "Belum ada konten di draft",
  },
  {
    status: "produksi",
    label: "Sedang Produksi",
    color: "var(--amber)",
    emptyText: "Tarik kartu ke sini untuk mulai produksi",
  },
  {
    status: "siap",
    label: "Siap Upload",
    color: "var(--teal)",
    emptyText: "Konten siap tayang tampil di sini",
  },
  {
    status: "published",
    label: "Published",
    color: "var(--good)",
    emptyText: "Riwayat konten yang sudah tayang",
  },
];

export default function ContentKanban({
  posts,
  getStatus,
  getCaption,
  onUpdateStatus,
  onUpdateCaption,
  onCopy,
}: ContentKanbanProps) {
  const [showPublished, setShowPublished] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<PostStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleCols = useMemo(
    () => (showPublished ? COLUMNS : COLUMNS.filter((c) => c.status !== "published")),
    [showPublished],
  );

  const grouped = useMemo(() => {
    const map: Record<PostStatus, ContentPost[]> = {
      draft: [],
      produksi: [],
      siap: [],
      published: [],
    };
    for (const p of posts) {
      const st = getStatus(p.id);
      if (map[st]) map[st].push(p);
    }
    return map;
  }, [posts, getStatus]);

  const selectedPost = useMemo(
    () => (selectedId ? posts.find((p) => p.id === selectedId) ?? null : null),
    [selectedId, posts],
  );

  const handleDrop = (targetStatus: PostStatus) => {
    setOverCol(null);
    if (!draggingId) return;
    const currentStatus = getStatus(draggingId);
    const id = draggingId;
    setDraggingId(null);
    if (currentStatus === targetStatus) return;
    onUpdateStatus(id, targetStatus);
  };

  return (
    <>
      <div className="cadra-card space-y-3">
        {/* Cadra Kanban Stage Distribution Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span className="font-semibold">
            Seret kartu antar kolom atau klik tombol aksi cepat · Total{" "}
            <b className="text-[var(--text)]">{posts.length} konten</b>
          </span>
          <button
            type="button"
            onClick={() => setShowPublished((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              showPublished
                ? "bg-[var(--ink)] text-[var(--on-ink)]"
                : "bg-[var(--well)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            {showPublished ? "Sembunyikan Published" : "Tampilkan Published"}
          </button>
        </div>

        <div className="kds-ribbon" aria-hidden="true">
          {visibleCols.map((col) => {
            const count = grouped[col.status].length;
            return (
              <span
                key={col.status}
                className="kds-rib"
                style={{
                  ["--c" as string]: col.color,
                  flexGrow: Math.max(0.25, count),
                }}
              />
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="kds-scroll">
          <div className="kds-board" style={{ ["--cols" as string]: visibleCols.length }}>
            {visibleCols.map((col) => {
              const list = grouped[col.status];
              const isOver = overCol === col.status;
              return (
                <section
                  key={col.status}
                  className={`kds-col ${isOver ? "is-over" : ""}`}
                  style={{ ["--c" as string]: col.color }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overCol !== col.status) setOverCol(col.status);
                  }}
                  onDragLeave={() => {
                    if (overCol === col.status) setOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(col.status);
                  }}
                >
                  <header className="kds-col__head">
                    <span className="kds-col__title">
                      <i className="kds-col__dot" />
                      {col.label}
                    </span>
                    <span className="kds-col__n font-mono-num">{list.length}</span>
                  </header>

                  {list.length === 0 ? (
                    <div className="kds-col__empty">{col.emptyText}</div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {list.map((p) => {
                        const st = getStatus(p.id);
                        const cap = getCaption(p);
                        return (
                          <article
                            key={p.id}
                            draggable
                            onDragStart={() => setDraggingId(p.id)}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setOverCol(null);
                            }}
                            className={`kds-ticket ${draggingId === p.id ? "is-dragging" : ""}`}
                          >
                            {/* Ticket Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-1.5">
                                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)] opacity-60" />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-md bg-[#0b1013] px-1.5 py-0.5 font-mono-num text-[10px] font-semibold text-[#e5ba78]">
                                      H{p.day} · {p.dayLabel}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 font-mono-num text-[10px] font-bold ${
                                        p.platform === "Instagram"
                                          ? "bg-[#0f5257]/12 text-[#0f5257]"
                                          : "bg-[var(--well)] text-[var(--ink)]"
                                      }`}
                                    >
                                      {p.platform}
                                    </span>
                                  </div>
                                  <div className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-[var(--text)]">
                                    {p.title}
                                  </div>
                                  <div className="truncate font-mono-num text-[10.5px] text-[var(--muted)]">
                                    {p.format}
                                  </div>
                                  {p.videoEngine && (
                                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#d9a962]/20 px-1.5 py-0.5 font-mono-num text-[9.5px] font-bold text-[#7d5600]">
                                      <Film className="h-2.5 w-2.5" />
                                      {p.videoEngine}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="spill spill--iris font-mono-num shrink-0">
                                <Clock className="h-3 w-3" />
                                {p.time.replace(" WIB", "")}
                              </span>
                            </div>

                            {/* Ticket Body (Hook + Brief preview) */}
                            <div className="divide-y divide-[var(--line)] rounded-xl bg-[var(--surface)] px-2.5 py-1.5">
                              <div className="py-1">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-ink)]">
                                  Hook
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-[var(--text)]">
                                  “{p.hook}”
                                </p>
                              </div>
                              {p.brief.length > 0 && (
                                <div className="py-1.5">
                                  <div className="text-[11px] leading-snug text-[var(--muted)] line-clamp-2">
                                    • {p.brief[0]}
                                  </div>
                                  {p.brief.length > 1 && (
                                    <div className="mt-0.5 font-mono-num text-[10px] text-[var(--faint)]">
                                      +{p.brief.length - 1} poin brief lainnya
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Secondary Utility Row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedId(p.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--ink)]"
                              >
                                <Eye className="h-3 w-3" />
                                Brief &amp; Caption
                              </button>
                              <button
                                type="button"
                                onClick={() => onCopy(cap, `Caption "${p.title}" tersalin!`)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--well)] px-2.5 py-1 font-mono-num text-[11px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--ink)] hover:text-white"
                              >
                                <Copy className="h-3 w-3" />
                                Salin
                              </button>
                            </div>

                            {/* Stage Quick-Action CTA (Cadra KDS pattern) */}
                            <div className="flex items-center gap-2">
                              {st === "draft" && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(p.id, "produksi")}
                                  className="btn-cadra btn-cadra--accent w-full !min-h-9 !text-xs"
                                >
                                  <Flame className="h-3.5 w-3.5" />
                                  Mulai Produksi
                                </button>
                              )}
                              {st === "produksi" && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(p.id, "siap")}
                                  className="btn-cadra btn-cadra--teal w-full !min-h-9 !text-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Tandai Siap Upload
                                </button>
                              )}
                              {st === "siap" && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(p.id, "published")}
                                  className="btn-cadra btn-cadra--primary w-full !min-h-9 !text-xs"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Tandai Published
                                </button>
                              )}
                              {st === "published" && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(p.id, "draft")}
                                  className="btn-cadra btn-cadra--ghost w-full !min-h-9 !text-xs"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Recall ke Draft
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail & Edit Caption Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#0b1013] px-2.5 py-0.5 font-mono-num text-[11px] font-semibold text-[#e5ba78]">
                    H{selectedPost.day} · {selectedPost.dayLabel}
                  </span>
                  <span className="rounded-md bg-[#0f5257]/12 px-2 py-0.5 font-mono-num text-[11px] font-semibold text-[#0f5257]">
                    {selectedPost.platform}
                  </span>
                  <span className="rounded-md border border-[var(--border-strong)] bg-white px-2 py-0.5 font-mono-num text-[11px] text-[var(--muted)]">
                    {selectedPost.format} · {selectedPost.time}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-[var(--ink)]">
                  {selectedPost.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  <strong>Hook:</strong> {selectedPost.hook}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-full border border-[var(--border-strong)] bg-white p-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stage Switcher */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Stage:
              </span>
              {COLUMNS.map((col) => {
                const active = getStatus(selectedPost.id) === col.status;
                return (
                  <button
                    key={col.status}
                    type="button"
                    onClick={() => onUpdateStatus(selectedPost.id, col.status)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[var(--ink)] text-white"
                        : "border border-[var(--border-strong)] bg-white text-[var(--muted)] hover:border-[var(--ink)]"
                    }`}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="mb-2.5 font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-[#0f5257]">
                  Production Brief &amp; Visual
                </div>
                <ul className="space-y-2 text-xs text-[var(--muted)]">
                  {selectedPost.brief.map((b, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                {selectedPost.screenshot && (
                  <img
                    src={selectedPost.screenshot}
                    alt={selectedPost.title}
                    className="mt-3 max-h-[200px] w-full rounded-xl border border-[var(--border)] object-cover object-top"
                  />
                )}
              </div>

              <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-4">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-[#0f5257]">
                    Caption / Copy (Bisa Edit Langsung)
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(getCaption(selectedPost), "Caption berhasil disalin!")}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#121517] px-2.5 py-1 font-mono-num text-[11px] font-medium text-white hover:opacity-90"
                  >
                    <Copy className="h-3 w-3" />
                    Salin
                  </button>
                </div>
                <textarea
                  rows={11}
                  value={getCaption(selectedPost)}
                  onChange={(e) => onUpdateCaption(selectedPost.id, e.target.value)}
                  className="w-full flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--ink)] focus:border-[#0f5257] focus:outline-none"
                />
              </div>
            </div>

            {selectedPost.videoPrompt && (
              <div className="mt-4 rounded-2xl border border-[#d9a962]/45 bg-[#0b1013] p-4 text-[#f4f2ec]">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[#e5ba78]" />
                    <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#e5ba78]">
                      Video Prompt · {selectedPost.videoEngine ?? "Google Flow"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopy(selectedPost.videoPrompt!, "Prompt video tersalin!")}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#d9a962] px-2.5 py-1 font-mono-num text-[11px] font-semibold text-[#0b1013] hover:opacity-90"
                  >
                    <Copy className="h-3 w-3" />
                    Salin Prompt
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono-num text-[11.5px] leading-relaxed text-white/85">
                  {selectedPost.videoPrompt}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
