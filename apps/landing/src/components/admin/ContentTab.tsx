"use client";

import { useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { LandingContent } from "@/lib/types";

interface ContentTabProps {
  content: LandingContent;
  onChange: (next: LandingContent) => void;
  onSave: () => Promise<void>;
  onReset: () => Promise<void>;
  saving: boolean;
}

type SectionKey = "general" | "hero" | "metrics" | "pricing" | "faqs" | "footer";

export default function ContentTab({
  content,
  onChange,
  onSave,
  onReset,
  saving,
}: ContentTabProps) {
  const [section, setSection] = useState<SectionKey>("general");

  const sections: { key: SectionKey; label: string }[] = [
    { key: "general", label: "Umum & Kontak" },
    { key: "hero", label: "Hero" },
    { key: "metrics", label: "Metrik" },
    { key: "pricing", label: "Paket Harga" },
    { key: "faqs", label: "FAQ" },
    { key: "footer", label: "Footer CTA" },
  ];

  const inputClass =
    "w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]";
  const labelClass =
    "mb-1.5 block text-[12px] font-medium text-[var(--ink-secondary)]";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            CMS Konten Landing Page
          </h2>
          <p className="text-[13.5px] text-[var(--ink-secondary)]">
            Edit teks, harga, FAQ, nomor WhatsApp, dan URL aplikasi secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-medium hover:bg-[var(--surface-subtle)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Default
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
              section === s.key
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "text-[var(--ink-secondary)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor Body */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        {section === "general" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama Brand</label>
              <input
                className={inputClass}
                value={content.general.brandName}
                onChange={(e) =>
                  onChange({
                    ...content,
                    general: { ...content.general, brandName: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Domain Landing</label>
              <input
                className={inputClass}
                value={content.general.domain}
                onChange={(e) =>
                  onChange({
                    ...content,
                    general: { ...content.general, domain: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>URL Aplikasi Utama (APP_URL)</label>
              <input
                className={inputClass}
                value={content.general.appUrl}
                onChange={(e) =>
                  onChange({
                    ...content,
                    general: { ...content.general, appUrl: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>
                Nomor WhatsApp (format 628xxx)
              </label>
              <input
                className={inputClass}
                value={content.general.waNumber}
                onChange={(e) =>
                  onChange({
                    ...content,
                    general: { ...content.general, waNumber: e.target.value },
                  })
                }
                placeholder="6281234567890"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Pesan Default WhatsApp</label>
              <textarea
                rows={3}
                className={inputClass}
                value={content.general.waMessage}
                onChange={(e) =>
                  onChange({
                    ...content,
                    general: { ...content.general, waMessage: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )}

        {section === "hero" && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Badge Pill Atas</label>
              <input
                className={inputClass}
                value={content.hero.badge}
                onChange={(e) =>
                  onChange({
                    ...content,
                    hero: { ...content.hero, badge: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Headline Baris 1</label>
                <input
                  className={inputClass}
                  value={content.hero.titleLine1}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, titleLine1: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>
                  Headline Baris 2 (Aksen Emas)
                </label>
                <input
                  className={inputClass}
                  value={content.hero.titleLine2}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, titleLine2: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Sub-judul Hero</label>
              <textarea
                rows={3}
                className={inputClass}
                value={content.hero.subtitle}
                onChange={(e) =>
                  onChange({
                    ...content,
                    hero: { ...content.hero, subtitle: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Teks Tombol Utama</label>
                <input
                  className={inputClass}
                  value={content.hero.primaryCta}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, primaryCta: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Catatan Kecil di Bawah Tombol</label>
                <input
                  className={inputClass}
                  value={content.hero.footnote}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, footnote: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {section === "metrics" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {content.metrics.map((m, idx) => (
              <div
                key={m.id}
                className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
              >
                <div className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Metrik #{idx + 1}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelClass}>Prefix</label>
                    <input
                      className={inputClass}
                      value={m.prefix}
                      onChange={(e) => {
                        const next = [...content.metrics];
                        next[idx] = { ...m, prefix: e.target.value };
                        onChange({ ...content, metrics: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Angka</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={m.value}
                      onChange={(e) => {
                        const next = [...content.metrics];
                        next[idx] = { ...m, value: Number(e.target.value) || 0 };
                        onChange({ ...content, metrics: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Suffix</label>
                    <input
                      className={inputClass}
                      value={m.suffix}
                      onChange={(e) => {
                        const next = [...content.metrics];
                        next[idx] = { ...m, suffix: e.target.value };
                        onChange({ ...content, metrics: next });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Deskripsi Metrik</label>
                  <input
                    className={inputClass}
                    value={m.label}
                    onChange={(e) => {
                      const next = [...content.metrics];
                      next[idx] = { ...m, label: e.target.value };
                      onChange({ ...content, metrics: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "pricing" && (
          <div className="space-y-5">
            {content.pricing.map((plan, idx) => (
              <div
                key={plan.id}
                className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono-num text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Paket {idx + 1}: {plan.name}
                  </span>
                  <label className="inline-flex items-center gap-2 text-[12.5px]">
                    <input
                      type="checkbox"
                      checked={plan.featured}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, featured: e.target.checked };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                    Highlight (Dark Card)
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>Nama Paket</label>
                    <input
                      className={inputClass}
                      value={plan.name}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, name: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Badge / Tag</label>
                    <input
                      className={inputClass}
                      value={plan.tag}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, tag: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Harga</label>
                    <input
                      className={inputClass}
                      value={plan.price}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, price: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Periode / Keterangan Harga</label>
                    <input
                      className={inputClass}
                      value={plan.period}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, period: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Deskripsi Singkat</label>
                    <input
                      className={inputClass}
                      value={plan.desc}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, desc: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Teks Tombol CTA</label>
                    <input
                      className={inputClass}
                      value={plan.cta}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, cta: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Link Tombol (isi <code>#wa</code> untuk link WhatsApp otomatis)
                    </label>
                    <input
                      className={inputClass}
                      value={plan.href}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, href: e.target.value };
                        onChange({ ...content, pricing: next });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Daftar Fitur (1 baris = 1 poin)
                  </label>
                  <textarea
                    rows={5}
                    className={inputClass}
                    value={plan.items.join("\n")}
                    onChange={(e) => {
                      const next = [...content.pricing];
                      next[idx] = {
                        ...plan,
                        items: e.target.value.split("\n"),
                      };
                      onChange({ ...content, pricing: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "faqs" && (
          <div className="space-y-4">
            {content.faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                    FAQ #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...content,
                        faqs: content.faqs.filter((_, i) => i !== idx),
                      })
                    }
                    className="inline-flex items-center gap-1 text-[12px] text-red-500 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Pertanyaan</label>
                  <input
                    className={inputClass}
                    value={faq.q}
                    onChange={(e) => {
                      const next = [...content.faqs];
                      next[idx] = { ...faq, q: e.target.value };
                      onChange({ ...content, faqs: next });
                    }}
                  />
                </div>
                <div>
                  <label className={labelClass}>Jawaban</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={faq.a}
                    onChange={(e) => {
                      const next = [...content.faqs];
                      next[idx] = { ...faq, a: e.target.value };
                      onChange({ ...content, faqs: next });
                    }}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  faqs: [
                    ...content.faqs,
                    {
                      id: `faq-${Date.now()}`,
                      q: "Pertanyaan baru?",
                      a: "Jawaban singkat dan jelas di sini.",
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border-strong)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              <Plus className="h-4 w-4" />
              Tambah FAQ Baru
            </button>
          </div>
        )}

        {section === "footer" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Eyebrow</label>
              <input
                className={inputClass}
                value={content.footerCta.eyebrow}
                onChange={(e) =>
                  onChange({
                    ...content,
                    footerCta: { ...content.footerCta, eyebrow: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Judul Baris 1</label>
              <input
                className={inputClass}
                value={content.footerCta.titleLine1}
                onChange={(e) =>
                  onChange({
                    ...content,
                    footerCta: {
                      ...content.footerCta,
                      titleLine1: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Judul Baris 2 (Aksen Emas)</label>
              <input
                className={inputClass}
                value={content.footerCta.titleLine2}
                onChange={(e) =>
                  onChange({
                    ...content,
                    footerCta: {
                      ...content.footerCta,
                      titleLine2: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Tombol Utama</label>
              <input
                className={inputClass}
                value={content.footerCta.primaryCta}
                onChange={(e) =>
                  onChange({
                    ...content,
                    footerCta: {
                      ...content.footerCta,
                      primaryCta: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Tombol WhatsApp</label>
              <input
                className={inputClass}
                value={content.footerCta.secondaryCta}
                onChange={(e) =>
                  onChange({
                    ...content,
                    footerCta: {
                      ...content.footerCta,
                      secondaryCta: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
