const fs = require("fs");
const path = require("path");
const { chromium } = require("/Users/ahdirmai/.local/lib/node_modules/playwright");

const decks1 = require("./decks-part1");
const decks2 = require("./decks-part2");
const ALL_DECKS = [...decks1, ...decks2];

const ROOT = "/Users/ahdirmai/Pos";
const OUT_BASE = path.join(ROOT, "docs/marketing/carousels");
const PUBLIC_BASE = path.join(ROOT, "apps/backoffice/public/carousels");
const SCREENSHOTS_DIR = path.join(ROOT, "apps/backoffice/public/screenshots");
const LOGO_PATH = path.join(ROOT, "assets/branding/kassa-icon-dark.svg");

const logoSvg = fs.readFileSync(LOGO_PATH, "utf8");
const logoDataUri = "data:image/svg+xml;base64," + Buffer.from(logoSvg).toString("base64");

// Preload screenshots as base64 data URIs so zero broken images ever
const imgCache = {};
for (const file of fs.readdirSync(SCREENSHOTS_DIR)) {
  if (file.endsWith(".png")) {
    const b64 = fs.readFileSync(path.join(SCREENSHOTS_DIR, file)).toString("base64");
    imgCache[file] = `data:image/png;base64,${b64}`;
  }
}

function hydrateImages(html) {
  return html.replace(/\{\{IMG:([^}]+)\}\}/g, (_, filename) => {
    if (!imgCache[filename]) {
      throw new Error(`Missing screenshot: ${filename}`);
    }
    return imgCache[filename];
  });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildSlideHtml(slide, index, total) {
  const isDark = slide.theme === "dark";
  const bodyHtml = hydrateImages(slide.html);
  const pageStr = `${pad2(index + 1)} / ${pad2(total)}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=JetBrains+Mono:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .canvas {
    position: relative;
    width: 1080px;
    height: 1350px;
    padding: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .canvas.light {
    background: #F6F4EF;
    color: #121517;
  }
  .canvas.dark {
    background-color: #0B1013;
    background-image:
      radial-gradient(ellipse 75% 50% at 12% 0%, rgba(15, 82, 87, 0.38), transparent 65%),
      radial-gradient(ellipse 65% 45% at 92% 12%, rgba(201, 150, 76, 0.20), transparent 60%);
    color: #F4F2EC;
  }

  /* Subtle editorial corner grid accent on light */
  .canvas.light::before {
    content: "";
    position: absolute;
    top: 0; right: 0;
    width: 420px; height: 420px;
    background: radial-gradient(circle at 85% 15%, rgba(15, 82, 87, 0.06), transparent 68%);
    pointer-events: none;
  }

  /* Top Bar */
  .topbar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'JetBrains Mono', monospace;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .canvas.light .eyebrow { color: #0F5257; }
  .canvas.dark .eyebrow { color: #E5BA78; }
  .canvas.light .rtag { color: #787E86; font-weight: 500; }
  .canvas.dark .rtag { color: rgba(244, 242, 236, 0.52); font-weight: 500; }

  /* Main Content Area */
  .main {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
    padding: 36px 0;
  }

  /* Footer */
  .footer {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 26px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }
  .canvas.light .footer {
    border-top: 1px solid #E2DFD7;
    color: #787E86;
  }
  .canvas.dark .footer {
    border-top: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(244, 242, 236, 0.56);
  }
  .brand-foot {
    display: flex;
    align-items: center;
    gap: 14px;
    font-weight: 600;
  }
  .canvas.light .brand-foot strong { color: #121517; }
  .canvas.dark .brand-foot strong { color: #F4F2EC; }
  .brand-logo {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    display: block;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  /* Typography */
  .h1-cover {
    font-size: 74px;
    font-weight: 700;
    line-height: 1.07;
    letter-spacing: -0.03em;
    color: #121517;
  }
  .h1-cover.dark { color: #F4F2EC; }
  .h1-lux {
    font-size: 62px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: #F4F2EC;
  }
  .h2-slide {
    font-size: 52px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.025em;
    color: #121517;
  }
  .h2-slide.dark { color: #F4F2EC; }

  .serif {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1.12em;
    color: #0F5257;
  }
  .serif-dark {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1.12em;
    color: #E5BA78;
  }

  .lead {
    font-size: 30px;
    line-height: 1.45;
    color: #4C5259;
    font-weight: 400;
  }
  .lead.dark { color: rgba(244, 242, 236, 0.74); }
  .body {
    font-size: 29px;
    line-height: 1.48;
    color: #4C5259;
  }
  .body strong { color: #121517; font-weight: 700; }
  .body-sm {
    font-size: 26px;
    line-height: 1.45;
    color: #4C5259;
  }
  .body-sm strong { color: #121517; font-weight: 700; }

  .mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  .mono-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #787E86;
  }
  .mono-label.teal { color: #0F5257; }
  .mono-label.good { color: #059669; }
  .mono-label.gold { color: #E5BA78; }
  .mono-label.muted-dark { color: rgba(244, 242, 236, 0.55); }
  .bold { font-weight: 700; }
  .teal { color: #0F5257; }
  .good { color: #059669; }
  .bad { color: #DC2626; }
  .gold { color: #E5BA78; }
  .muted { color: #787E86; }
  .muted-sm { font-size: 22px; font-weight: 500; color: #787E86; }

  .step-num {
    font-family: 'Instrument Serif', Georgia, serif;
    font-style: italic;
    font-size: 96px;
    line-height: 0.85;
    color: #0F5257;
  }

  /* Stacks */
  .cover-stack, .cta-stack, .luxury-hero {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* Pills & Badges */
  .pill {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 10px 20px;
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .pill.good { background: rgba(5, 150, 105, 0.13); color: #059669; }
  .pill.bad { background: rgba(220, 38, 38, 0.12); color: #DC2626; }
  .pill.warn { background: rgba(217, 119, 6, 0.14); color: #B45309; }
  .pill.teal-soft { background: rgba(15, 82, 87, 0.12); color: #0F5257; }
  .pill.gold-light { background: rgba(217, 169, 98, 0.24); color: #8A5E14; }
  .pill.gold-dark {
    background: rgba(217, 169, 98, 0.16);
    border: 1px solid rgba(217, 169, 98, 0.45);
    color: #E5BA78;
  }

  /* Metric Split */
  .metric-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .metric-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 32px 34px;
    box-shadow: 0 10px 28px rgba(18, 21, 23, 0.04);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .metric-big {
    font-family: 'JetBrains Mono', monospace;
    font-size: 72px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .metric-sub {
    font-size: 22px;
    color: #4C5259;
    line-height: 1.35;
  }

  /* Callout Bar */
  .callout-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 18px;
    padding: 22px 28px;
    font-size: 25px;
    color: #4C5259;
  }
  .callout-bar strong { color: #121517; }
  .dot {
    width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  }
  .dot.teal { background: #0F5257; }
  .dot.bad { background: #DC2626; }

  /* Surfaces & Tables */
  .card-surface {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 36px;
    box-shadow: 0 10px 30px rgba(18, 21, 23, 0.04);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .card-surface.compact { padding: 30px; gap: 14px; }
  .card-surface.accent-border { border: 2px solid #0F5257; }
  .card-head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 18px;
    border-bottom: 1px solid #E2DFD7;
  }
  .price-inline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 38px;
    font-weight: 700;
    color: #121517;
    margin-top: 4px;
  }
  .price-big {
    font-family: 'JetBrains Mono', monospace;
    font-size: 54px;
    font-weight: 700;
    line-height: 1.05;
    color: #121517;
  }
  .card-title {
    font-size: 30px;
    font-weight: 700;
    color: #121517;
    line-height: 1.2;
  }
  .card-text {
    font-size: 24px;
    line-height: 1.42;
    color: #4C5259;
  }

  .data-table {
    display: flex;
    flex-direction: column;
  }
  .data-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid #ECEAE3;
    font-size: 26px;
    color: #121517;
  }
  .data-row > span:first-child { flex: 1; }
  .data-row.total {
    border-bottom: none;
    border-top: 2px solid #121517;
    padding-top: 24px;
    padding-bottom: 4px;
    font-weight: 700;
    font-size: 28px;
  }

  /* Flow Card */
  .flow-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 32px;
  }
  .flow-node {
    flex: 1;
    background: #F6F4EF;
    border-radius: 16px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .flow-node.warn {
    background: rgba(220, 38, 38, 0.07);
    border: 1px solid rgba(220, 38, 38, 0.25);
  }
  .flow-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    color: #121517;
  }
  .flow-arrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 32px;
    font-weight: 700;
    color: #0F5257;
  }

  /* Note & Solution Cards */
  .note-card {
    background: #FFFFFF;
    border-left: 5px solid #0F5257;
    border-top: 1px solid #E2DFD7;
    border-right: 1px solid #E2DFD7;
    border-bottom: 1px solid #E2DFD7;
    border-radius: 16px;
    padding: 26px 30px;
    font-size: 25px;
    line-height: 1.45;
    color: #4C5259;
  }
  .note-card strong { color: #121517; }

  .solution-card {
    background: #FFFFFF;
    border: 2px solid #0F5257;
    border-radius: 24px;
    padding: 34px 36px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 12px 32px rgba(15, 82, 87, 0.08);
  }
  .sol-title {
    font-size: 34px;
    font-weight: 700;
    color: #121517;
    line-height: 1.2;
  }
  .sol-desc {
    font-size: 26px;
    line-height: 1.45;
    color: #4C5259;
  }

  /* Compare Grid */
  .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  /* List Card */
  .list-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 28px 34px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    box-shadow: 0 10px 28px rgba(18, 21, 23, 0.04);
  }
  .list-card.tight { padding: 26px 28px; gap: 20px; }
  .list-row {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 26px;
    line-height: 1.38;
    color: #121517;
  }
  .list-row strong { font-weight: 700; }
  .badge-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .badge-num.bad { background: rgba(220, 38, 38, 0.12); color: #DC2626; }
  .badge-num.teal { background: rgba(15, 82, 87, 0.12); color: #0F5257; }
  .badge-num.good { background: rgba(5, 150, 105, 0.14); color: #059669; }

  .mode-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ECEAE3;
  }
  .mode-block:last-child { padding-bottom: 0; border-bottom: none; }
  .mode-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    font-size: 28px;
    color: #121517;
  }

  /* RBAC Mini */
  .rbac-mini {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 20px;
    padding: 14px 28px;
  }
  .rbac-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    font-size: 26px;
    border-bottom: 1px solid #ECEAE3;
  }
  .rbac-row:last-child { border-bottom: none; }

  /* Device Screenshot Frames */
  .device-frame {
    background: #FFFFFF;
    border: 1px solid #DDD9CE;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 18px 44px rgba(18, 21, 23, 0.10);
  }
  .device-bar {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 14px 20px;
    background: #F4F2EC;
    border-bottom: 1px solid #E2DFD7;
  }
  .d-dot {
    width: 11px; height: 11px; border-radius: 50%; background: #D1CDC2;
  }
  .device-url {
    margin-left: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    color: #787E86;
  }
  .device-img {
    display: block;
    width: 100%;
    height: 490px;
    object-fit: cover;
    object-position: top center;
  }
  .device-img.tall-sm { height: 340px; }

  /* Dual Screenshots */
  .dual-shot {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .shot-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 22px;
    padding: 20px;
    box-shadow: 0 12px 30px rgba(18, 21, 23, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .shot-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 19px;
  }
  .shot-img {
    display: block;
    width: 100%;
    height: 365px;
    object-fit: cover;
    object-position: top center;
    border-radius: 14px;
    border: 1px solid #ECEAE3;
  }

  /* Split Mobile */
  .split-mobile {
    display: grid;
    grid-template-columns: 1.35fr 0.85fr;
    gap: 28px;
    align-items: center;
  }
  .phone-frame {
    background: #0B1013;
    border-radius: 34px;
    padding: 12px;
    box-shadow: 0 20px 48px rgba(18, 21, 23, 0.18);
  }
  .phone-img {
    display: block;
    width: 100%;
    height: 540px;
    object-fit: cover;
    object-position: top center;
    border-radius: 24px;
  }

  /* Steppers */
  .stepper-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .stepper-grid.three { grid-template-columns: repeat(3, 1fr); }
  .step-pill {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 20px;
    padding: 26px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(18, 21, 23, 0.03);
  }
  .step-pill strong { font-size: 28px; color: #121517; }
  .step-pill small { font-size: 21px; color: #787E86; }

  .stepper-vertical {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .v-step {
    display: flex;
    align-items: flex-start;
    gap: 22px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 22px;
    padding: 28px 30px;
  }
  .v-step strong {
    display: block;
    font-size: 28px;
    color: #121517;
    margin-bottom: 6px;
  }

  /* Chips */
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .chip {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 100px;
    padding: 14px 26px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 21px;
    font-weight: 600;
    color: #121517;
  }
  .chip.teal-chip {
    background: #0F5257;
    border-color: #0F5257;
    color: #FFFFFF;
  }

  /* Receipt Card */
  .receipt-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 38px 40px;
    box-shadow: 0 14px 36px rgba(18, 21, 23, 0.06);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .receipt-head {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #0F5257;
    text-align: center;
    padding-bottom: 12px;
    border-bottom: 2px dashed #E2DFD7;
  }
  .receipt-line {
    display: flex;
    justify-content: space-between;
    font-size: 26px;
    color: #121517;
  }
  .receipt-line.muted { color: #4C5259; }
  .receipt-line.grand {
    font-size: 32px;
    font-weight: 800;
    padding-top: 6px;
  }
  .receipt-dash {
    border-top: 2px dashed #E2DFD7;
    margin: 4px 0;
  }

  /* Branch Grid */
  .branch-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .branch-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 20px;
    padding: 26px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .branch-card strong {
    font-family: 'JetBrains Mono', monospace;
    font-size: 38px;
    color: #121517;
  }

  /* Checklist Boxes */
  .check-box-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .check-row {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 20px;
    padding: 26px 30px;
    font-size: 27px;
    line-height: 1.4;
    color: #121517;
  }
  .chk {
    font-family: 'JetBrains Mono', monospace;
    font-size: 32px;
    line-height: 1.1;
    color: #0F5257;
    flex-shrink: 0;
  }

  /* Bar Viz */
  .bar-viz {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 24px;
    padding: 34px 36px;
    display: flex;
    flex-direction: column;
    gap: 26px;
  }
  .bar-item { display: flex; flex-direction: column; gap: 10px; }
  .bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 25px;
    font-weight: 600;
  }
  .bar-track {
    height: 18px;
    background: #EFECE5;
    border-radius: 100px;
    overflow: hidden;
  }
  .bar-fill { height: 100%; border-radius: 100px; }
  .bar-fill.good { background: #059669; }
  .bar-fill.teal { background: #0F5257; }
  .bar-fill.bad { background: #DC2626; }

  /* KDS Ticket Mock */
  .ticket-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .kds-mock {
    background: #FFFFFF;
    border: 2px solid #0F5257;
    border-radius: 22px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .kds-mock.warn-b { border-color: #D97706; }
  .kds-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 24px;
  }
  .kds-item {
    font-size: 28px;
    font-weight: 700;
    color: #121517;
  }
  .kds-note {
    font-size: 22px;
    color: #4C5259;
    background: #F6F4EF;
    border-radius: 12px;
    padding: 12px 16px;
  }

  /* Dark Luxury & CTA */
  .big-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 132px;
    font-weight: 700;
    line-height: 0.96;
    letter-spacing: -0.04em;
    color: #F4F2EC;
  }
  .price-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    letter-spacing: 0.1em;
    color: rgba(244, 242, 236, 0.62);
  }
  .gold-divider {
    width: 110px;
    height: 3px;
    background: #D9A962;
    border-radius: 2px;
  }

  .dark-checklist {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .dark-check-item {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    background: rgba(255, 255, 255, 0.045);
    border: 1px solid rgba(255, 255, 255, 0.11);
    border-radius: 18px;
    padding: 24px 28px;
    font-size: 26px;
    line-height: 1.38;
    color: rgba(244, 242, 236, 0.88);
  }
  .dark-check-item strong { color: #FFFFFF; }
  .gold-check {
    color: #E5BA78;
    font-weight: 800;
    font-size: 28px;
    flex-shrink: 0;
  }

  .tier-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .tier-card {
    background: #12181B;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 24px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tier-card.pro {
    border: 2px solid #D9A962;
    background: linear-gradient(180deg, rgba(217,169,98,0.09), #12181B 60%);
  }
  .tier-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 56px;
    font-weight: 700;
    line-height: 1.05;
    color: #F4F2EC;
  }
  .tier-period {
    font-family: 'JetBrains Mono', monospace;
    font-size: 19px;
    color: rgba(244, 242, 236, 0.58);
    margin-bottom: 8px;
  }
  .tier-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 23px;
    line-height: 1.38;
    color: rgba(244, 242, 236, 0.82);
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    background: #D9A962;
    color: #0B1013;
    font-size: 28px;
    font-weight: 800;
    padding: 24px 40px;
    border-radius: 16px;
    letter-spacing: -0.01em;
    box-shadow: 0 12px 32px rgba(217, 169, 98, 0.24);
  }
  .cta-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 21px;
    color: rgba(244, 242, 236, 0.65);
  }
  .cta-sub strong { color: #E5BA78; }
</style>
</head>
<body>
  <div class="canvas ${isDark ? "dark" : "light"}">
    <header class="topbar">
      <span class="eyebrow">${slide.eyebrow}</span>
      <span class="rtag">${slide.rightTag}</span>
    </header>
    <main class="main">
      ${bodyHtml}
    </main>
    <footer class="footer">
      <div class="brand-foot">
        <img class="brand-logo" src="${logoDataUri}" alt="Kassa" />
        <span><strong>Kassa</strong> · kassa.biz.id</span>
      </div>
      <span>${pageStr}</span>
    </footer>
  </div>
</body>
</html>`;
}

function buildCaptionTxt(deck) {
  return `================================================================================
KASSA INSTAGRAM CAROUSEL — HARI ${deck.day} (${deck.dayLabel.toUpperCase()})
================================================================================
Judul       : ${deck.title}
Post ID     : ${deck.id}
Folder      : docs/marketing/carousels/${deck.folder}
Jumlah Slide: ${deck.slides.length} Slide (1080×1350 px · 4:5 PNG)
Tema Visual : ${deck.themeLabel}
Jadwal Post : Hari ${deck.day} (${deck.dayLabel}) · ${deck.time}
DM Keyword  : "${deck.dmKeyword}"

--------------------------------------------------------------------------------
CAPTION INSTAGRAM (READY TO PASTE)
--------------------------------------------------------------------------------
${deck.caption}

--------------------------------------------------------------------------------
FIRST COMMENT / PINNED COMMENT
--------------------------------------------------------------------------------
${deck.firstComment}

--------------------------------------------------------------------------------
COMPANION IG STORY (2–3 SLIDE PROMPTS)
--------------------------------------------------------------------------------
${deck.stories.map((s) => `- ${s}`).join("\n")}
`;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  let totalRendered = 0;

  for (const deck of ALL_DECKS) {
    const outDir = path.join(OUT_BASE, deck.folder);
    const pubDir = path.join(PUBLIC_BASE, deck.folder);
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(pubDir, { recursive: true });

    // Write caption.txt
    fs.writeFileSync(path.join(outDir, "caption.txt"), buildCaptionTxt(deck), "utf8");

    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      const html = buildSlideHtml(slide, i, deck.slides.length);
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const fileName = `slide-${pad2(i + 1)}.png`;
      const outPath = path.join(outDir, fileName);
      const pubPath = path.join(pubDir, fileName);

      await page.screenshot({ path: outPath, type: "png" });
      fs.copyFileSync(outPath, pubPath);
      totalRendered++;
    }
    console.log(`✓ ${deck.folder} (${deck.slides.length} slides + caption.txt)`);
  }

  await browser.close();
  console.log(`\nDONE! Rendered ${totalRendered} PNG slides across ${ALL_DECKS.length} carousels.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
