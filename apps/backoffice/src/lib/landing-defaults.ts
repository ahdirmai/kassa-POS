import type { LandingContent } from "./landing-types";

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  general: {
    brandName: "Kassa",
    domain: "kassa.biz.id",
    appUrl: "https://app.kassa.biz.id",
    waNumber: "62895388220777",
    waMessage:
      "Halo tim Kassa, saya ingin tanya soal Kassa POS untuk outlet saya.",
  },
  hero: {
    badge: "POS Cafe & Rumah Makan · Rp49rb/bln",
    titleLine1: "Kasir, dapur, dan stok",
    titleLine2: "dalam satu ritme.",
    subtitle:
      "Tetap jualan saat Wi-Fi mati. Layar dapur tanpa bon kertas, stok & HPP terhitung otomatis, dan akses staf terkunci.",
    primaryCta: "Coba Gratis Sekarang",
    secondaryCta: "Lihat Layar POS",
    footnote: "Gratis selamanya untuk 1 outlet · Jalan di HP, tablet & laptop",
  },
  metrics: [
    {
      id: "m1",
      prefix: "Rp",
      value: 0,
      suffix: "",
      label: "Komisi per transaksi",
    },
    {
      id: "m2",
      prefix: "Rp",
      value: 49,
      suffix: "rb",
      label: "All-in kasir, dapur & stok / bln",
    },
    {
      id: "m3",
      prefix: "",
      value: 100,
      suffix: "%",
      label: "Kasir tunai tetap jalan saat offline",
    },
    {
      id: "m4",
      prefix: "",
      value: 58,
      secondaryValue: 80,
      separator: "/",
      suffix: "mm",
      label: "Struk thermal USB & Bluetooth",
    },
  ],
  showcaseTabs: [
    {
      id: "pos",
      label: "Kasir POS",
      route: "/pos",
      tag: "Offline-Ready",
      title: "Input 1-tap, tetap melayani tanpa internet.",
      img: "/screenshots/02-pos.png",
    },
    {
      id: "kds",
      label: "Dapur KDS",
      route: "/kds",
      tag: "Realtime",
      title: "Antrean dapur tanpa kertas bon, lengkap timer.",
      img: "/screenshots/03-kds.png",
    },
    {
      id: "dashboard",
      label: "Dashboard",
      route: "/admin",
      tag: "Omzet Live",
      title: "Pantau omzet, PB1, dan jam ramai real-time.",
      img: "/screenshots/04-dashboard.png",
    },
    {
      id: "stock",
      label: "Stok & HPP",
      route: "/admin/stock",
      tag: "Auto HPP",
      title: "Stok terpotong otomatis, HPP per porsi akurat.",
      img: "/screenshots/07-stock.png",
    },
    {
      id: "rbac",
      label: "Akses Staf",
      route: "/admin/rbac",
      tag: "Kontrol Peran",
      title: "Tiap staf hanya melihat layar tugasnya.",
      img: "/screenshots/08-rbac.png",
    },
  ],
  mobileCard: {
    eyebrow: "Desktop · Tablet · Ponsel",
    titleLine1: "Cepat di meja kasir,",
    titleLine2: "ringkas di tangan pramusaji.",
    description:
      "Pakai HP atau tablet yang sudah ada untuk catat pesanan langsung dari meja tamu, lalu cetak struk dalam sekejap.",
    highlights: [
      "Tanpa beli mesin kasir mahal",
      "Struk Bluetooth 58/80mm",
      "Mode terang & gelap",
    ],
    screenshot: "/screenshots/10-pos-mobile.png",
  },
  pricing: [
    {
      id: "starter",
      name: "Starter",
      tag: "Gratis Selamanya",
      price: "Rp0",
      period: "1 outlet · total 3 akun",
      desc: "Khusus Kasir POS untuk kedai yang baru mulai.",
      featured: false,
      cta: "Mulai Gratis",
      href: "https://app.kassa.biz.id/register",
      items: [
        "1 Outlet & 2 Staf (total 3 akun)",
        "Kasir POS & Hold Bill",
        "Mode offline tunai otomatis",
        "Struk thermal 58/80mm",
        "Tutup shift kasir harian",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      tag: "Paling Dipilih",
      price: "Rp49.000",
      period: "/ outlet / bulan · ~Rp1.600/hari",
      desc: "All-in kasir, layar dapur, dan stok HPP.",
      featured: true,
      cta: "Coba Pro 14 Hari",
      href: "https://app.kassa.biz.id/login?plan=pro",
      items: [
        "Semua fitur Starter",
        "Layar Dapur (KDS) realtime",
        "Stok bahan, resep & HPP otomatis",
        "Stock opname & catat waste",
        "Kunci akses staf & log aktivitas",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      tag: "Multi-Cabang / Server Sendiri",
      price: "Custom",
      period: "tanpa biaya per cabang",
      desc: "Data penuh di server dan domain bisnis Anda.",
      featured: false,
      cta: "Tanya via WhatsApp",
      href: "#wa",
      items: [
        "Instalasi server & domain sendiri",
        "Kepemilikan penuh database & backup",
        "Kustomisasi alur sesuai SOP",
        "Bantuan migrasi menu & training",
        "Dukungan teknis prioritas",
      ],
    },
  ],
  faqs: [
    {
      id: "faq-1",
      q: "Kasir tetap jalan kalau Wi-Fi outlet mati?",
      a: "Ya. Menu tersimpan di perangkat sehingga transaksi tunai tetap jalan. Begitu sinyal kembali, seluruh data tersinkron otomatis tanpa duplikat.",
    },
    {
      id: "faq-2",
      q: "Harus beli mesin kasir khusus, atau bisa pakai HP/tablet?",
      a: "Cukup pakai HP, tablet, atau laptop yang sudah ada lewat browser. Mendukung printer thermal Bluetooth dan USB ukuran 58mm maupun 80mm.",
    },
    {
      id: "faq-3",
      q: "Apakah ada potongan atau komisi per transaksi?",
      a: "Tidak ada. 100% omzet masuk ke bisnis Anda. Cukup bayar flat Rp49.000/bulan untuk paket Pro atau pakai paket Starter gratis.",
    },
    {
      id: "faq-4",
      q: "Akses Kasir dan Dapur bisa dipisah agar omzet aman?",
      a: "Bisa. Kasir hanya membuka layar kasir, dapur hanya membuka layar KDS. Omzet, stok, dan pembatalan transaksi terkunci untuk Owner/Manager.",
    },
    {
      id: "faq-5",
      q: "Gimana kalau satuan beli bahan beda dengan satuan resep?",
      a: "Atur konversi sekali saja, misal 1 kg = 1.000 gram. Restock pakai satuan kemasan, resep pakai gram atau ml—stok & HPP terhitung otomatis.",
    },
  ],
  footerCta: {
    eyebrow: "Mulai Hari Ini",
    titleLine1: "Rapikan outlet Anda",
    titleLine2: "mulai shift berikutnya.",
    primaryCta: "Mulai Gratis Hari Ini",
    secondaryCta: "Tanya via WhatsApp",
  },
  updatedAt: new Date().toISOString(),
};

export function buildWhatsAppUrl(waNumber: string, message: string): string {
  const digits = waNumber.replace(/\D/g, "") || "62895388220777";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
