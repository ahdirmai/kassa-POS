export type PostStatus = "draft" | "produksi" | "siap" | "published";
export type VideoEngine = "Google Flow + HyperFrames" | "HyperFrames Only";

export interface ContentPost {
  id: string;
  day: number;
  dayLabel: string;
  platform: "Instagram" | "Threads";
  format: string;
  theme: "dark" | "light";
  time: string;
  title: string;
  hook: string;
  coverTitle?: string;
  coverItalic?: string;
  screenshot?: string;
  videoEngine?: VideoEngine;
  videoPrompt?: string;
  brief: string[];
  caption: string;
  defaultStatus?: PostStatus;
  assetPath?: string;
  slideCount?: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  role: string;
}

export const PHOTOS = {
  icedCoffee: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85",
  cappuccino: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=85",
  espresso: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=85",
  americano: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=85",
  nasiGoreng: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=85",
  riceBowl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85",
};

export const BRAND_COLORS: BrandColor[] = [
  { name: "Deep Espresso", hex: "#0B1013", role: "Dark Canvas · Cover Reels & Offer" },
  { name: "Espresso Surface", hex: "#141B1F", role: "Dark Card & Mockup Frame" },
  { name: "Warm Brass", hex: "#D9A962", role: "Primary CTA & Highlight Dark" },
  { name: "Soft Champagne", hex: "#E5BA78", role: "Italic Serif Accent (Dark)" },
  { name: "Deep Petrol", hex: "#0F5257", role: "Signature Accent (Light)" },
  { name: "Bright Petrol", hex: "#38A3A5", role: "Teal Accent (Dark Mode)" },
  { name: "Warm Parchment", hex: "#F6F4EF", role: "Light Editorial Canvas" },
  { name: "Pure Surface", hex: "#FFFFFF", role: "Light Card & Tabel" },
  { name: "Charcoal Ink", hex: "#121517", role: "Headline & Teks Utama" },
  { name: "Slate Secondary", hex: "#4C5259", role: "Paragraf & Body Copy" },
  { name: "Hairline Border", hex: "#E2DFD7", role: "Garis Pemisah 1px" },
  { name: "Online / Untung", hex: "#059669", role: "Badge SYNCED & Margin 73%" },
  { name: "Offline / Alert", hex: "#D97706", role: "Badge OFFLINE & SLA Warning" },
  { name: "Terkunci / Bocor", hex: "#DC2626", role: "Highlight Celah & Kunci Akses" },
];

export const INITIAL_POSTS: ContentPost[] = [
  // === INSTAGRAM (7) ===
  {
    id: "ig-d1", day: 1, dayLabel: "Senin", platform: "Instagram", format: "Reels (9:16 · 22s)", theme: "dark", time: "12:00 WIB",
    title: "Wi-Fi Mati di Jam Ramai? Kasir Tetap Jalan",
    hook: "Wi-Fi outlet mati pas jam makan siang. Kasir macet?",
    coverTitle: "Wi-Fi mati pas ramai?", coverItalic: "Kasir tetap jalan.",
    screenshot: "/screenshots/02-pos.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 handheld smartphone documentary video inside a cozy, busy Indonesian specialty coffee shop during lunch rush. Medium shot over the shoulder of a young Indonesian female cashier in a dark canvas apron standing behind a wooden espresso counter. She taps a sleek tablet on a metal stand, pauses with a brief realistic look of mild worry as a Wi-Fi router with a blinking red light sits near the corner of the counter, while two blurred customers wait politely in line holding smartphones. Warm natural daylight through storefront glass mixed with soft warm tungsten pendant lights, authentic cluttered cafe counter with ceramic cups, stainless milk pitcher, and thermal receipt printer. Natural skin texture, subtle handheld camera micro-shake, 35mm documentary lens, realistic ambient cafe chatter and espresso machine steam sound. No readable text or logos on screens, no cinematic slow motion, completely authentic unpolished real-life footage.`,
    brief: [
      "00–03s: Matikan Wi-Fi di tablet /pos → pil Offline (amber) muncul.",
      "03–08s: Tap cepat Es Kopi Susu + Nasi Goreng → Bayar Tunai → Lunas.",
      "08–13s: Zoom kode antrean OFF-042 & preview struk thermal 58/80mm.",
      "13–18s: Nyalakan Wi-Fi → status berubah hijau Online · Tersinkron.",
      "18–22s: End-card #0B1013: Logo K · Starter Gratis (1 Outlet, 3 Akun) · Pro Rp49rb/bln.",
    ],
    caption: `Pernah ngalamin antrean lagi panjang, tiba-tiba Wi-Fi outlet down, terus kasir ikut lumpuh?\n\nDi Tumpu, katalog menu tersimpan di perangkat. Internet putus, kasir tetap melayani transaksi tunai & cetak struk. Begitu sinyal balik, semua otomatis sinkron tanpa dobel.\n\nMulai gratis (1 outlet, total 3 akun khusus POS) atau coba Pro Rp49rb/bulan.\n\nKomen "TUMPU" biar kami kirim link demonya ke DM, atau klik tumpu.biz.id di bio.\n\n#poscafe #kasircafe #bisniskuliner #coffeeshopindonesia #tumpu`,
  },
  {
    id: "ig-d2", day: 2, dayLabel: "Selasa", platform: "Instagram", format: "Carousel (4:5 · 6 Slide)", theme: "light", time: "18:30 WIB",
    title: "Omzet 3 Juta Sehari Tapi Kas Tipis? Hitung HPP Kopi Susu",
    hook: "Omzet 3 juta sehari, tapi akhir bulan uangnya kok tipis?",
    coverTitle: "Omzet 3 juta sehari, tapi", coverItalic: "uangnya tipis?",
    screenshot: "/screenshots/07-stock.png",
    brief: [
      "Slide 1 (Light Cover): Foto Es Kopi Susu + kartu Margin 73% vs Selisih Stok -12%.",
      "Slide 2: 01 Beli kiloan tapi takaran dikira-kira + foto Espresso.",
      "Slide 3 (Hero Slide): Breakdown HPP Es Kopi Susu Aren Rp7.450 (Margin 73%).",
      "Slide 4: 02 Stok tidak terpotong otomatis di Excel mingguan.",
      "Slide 5: Screenshot asli /screenshots/07-stock.png (auto potong stok & HPP).",
      "Slide 6 (Dark CTA): Pro Rp49.000/bln · Trial Gratis 14 Hari · Komen HPP.",
    ],
    caption: `Omzet 3 juta sehari, tapi akhir bulan kas outlet kok tetap tipis?

Banyak coffee shop yang sebenarnya laris manis, tapi untungnya bocor halus di bar dan dapur—bukan karena sepi, melainkan karena HPP & stok cuma dikira-kira.

Geser buat lihat:
• Breakdown nyata HPP 1 cup Es Kopi Susu Aren (Rp7.450 · Margin 73%)
• 2 celah utama yang bikin uang belanja bahan terus membengkak
• Cara biar stok otomatis terpotong setiap transaksi kasir lunas

Simpan postingan ini buat bahan evaluasi outlet minggu ini 📌

Mau lihat contoh setup resep & HPP otomatis di Tumpu?
Komen "HPP" biar kami kirim link demonya ke DM, atau langsung coba gratis di tumpu.biz.id.

#hppkuliner #bisniskopi #ownercoffee #manajemenresto #aplikasikasir #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H02-hpp-kopi-susu",
    slideCount: 6,
  },
  {
    id: "ig-d3", day: 3, dayLabel: "Rabu", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "12:00 WIB",
    title: "Hapus Bon Kertas di Dapur: Demo Layar Dapur (KDS)",
    hook: "Masih pakai bon kertas di dapur yang sering hilang?",
    coverTitle: "Hapus bon kertas", coverItalic: "di dapur.",
    screenshot: "/screenshots/03-kds.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 candid handheld smartphone footage inside a bustling Indonesian restaurant kitchen during lunch peak. Close-up to medium shot of a stainless steel kitchen pass rail overloaded with messy crumpled white paper order tickets clipped haphazardly; one paper ticket slips and falls toward a damp metal prep counter next to steaming woks and plating bowls. An Indonesian line cook in a plain dark t-shirt and apron glances stressed at the paper rail, wiping sweat briefly. Harsh-but-natural overhead kitchen fluorescent mixed with warm steam light, real stainless reflections, slight grease haze, authentic handheld camera shake, realistic sizzling wok and clattering plates audio. No readable text on paper tickets, raw documentary realism, not stylized or glossy.`,
    brief: [
      "00–03s: B-roll bon kertas menumpuk → transisi snap ke layar /kds.",
      "03–09s: Kartu #108 masuk realtime di kolom Masuk dengan timer berjalan.",
      "09–14s: Drag & drop kartu Masuk → Dimasak → Siap Saji.",
      "14–18s: End-card #0B1013: Pakai tablet yang ada · Sudah termasuk di Pro Rp49rb/bln.",
    ],
    caption: `Satu bon kertas hilang pas jam makan siang = 1 meja komplain nunggu 30 menit.\n\nDengan Layar Dapur (KDS) di Tumpu:\n• Minuman otomatis masuk layar Bar, makanan ke Dapur\n• Ada timer otomatis biar tahu pesanan yang kelewat lama\n• Tinggal geser kartu: Masuk → Dimasak → Siap Saji\n\nCukup buka browser di tablet bekas yang sudah ada. Komen "KDS" atau cek tumpu.biz.id.\n\n#kitchendisplay #operasionalresto #posresto #bisniscafe #tumpu`,
  },
  {
    id: "ig-d4", day: 4, dayLabel: "Kamis", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "3 Celah Kebocoran Kasir & Kontrol Akses Staf",
    hook: "3 celah kebocoran kasir yang sering luput dari owner cafe.",
    coverTitle: "3 celah kebocoran", coverItalic: "kasir cafe.",
    screenshot: "/screenshots/08-rbac.png",
    brief: [
      "Slide 1 (Light Cover): Foto Cappuccino bar + 3 poin celah kebocoran.",
      "Slide 2: CELAH 01 Void tanpa izin → wajib PIN Manager & tercatat permanen.",
      "Slide 3: CELAH 02 1 akun dipakai ramai-ramai → PIN 4–6 digit per kasir.",
      "Slide 4: CELAH 03 Kasir bisa intip omzet & stok → visual RBAC + /screenshots/08-rbac.png.",
      "Slide 5 (Dark CTA): Sistem rapi bikin staf nyaman, owner tenang · Komen AMAN.",
    ],
    caption: `Hal paling nggak enak jadi owner cafe itu bukan pas lagi sepi—tapi pas harus curiga sama tim sendiri gara-gara uang laci sering selisih Rp50rb–Rp100rb.

Bisnis F&B yang sehat nggak bisa cuma mengandalkan "rasa percaya". Harus ada sistem yang melindungi owner sekaligus bikin staf yang jujur kerja lebih tenang.

Geser buat cek 3 celah kasir yang paling sering luput:
1. Void / hapus pesanan tanpa izin Manager
2. 1 akun kasir dipakai ramai-ramai lintas shift
3. Kasir bisa intip omzet harian & edit data stok

Di Tumpu, tiap staf login pakai PIN personal dan akses layarnya terkunci sesuai peran.

Komen "AMAN" kalau mau lihat demo kontrol akses staf di Tumpu, atau langsung coba di tumpu.biz.id.

#manajemencafe #kasirpintar #antifraud #bisnisfnb #ownerresto #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H04-anti-bocor-kasir",
    slideCount: 5,
  },
  {
    id: "ig-d5", day: 5, dayLabel: "Jumat", platform: "Instagram", format: "Carousel (4:5 · 3 Slide)", theme: "dark", time: "12:00 WIB",
    title: "Offer Anchor: All-In Cuma Rp49.000/Bulan (~Rp1.600/Hari)",
    hook: "Aplikasi kasir all-in, seharga 2 gelas es kopi susu per bulan.",
    coverTitle: "Rp49rb / bulan", coverItalic: "All-in tanpa komisi.",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1 (Full Dark Luxury): Latar foto Es Kopi Susu gelap + angka besar Rp49rb / outlet / bulan.",
      "Slide 2: 5 checklist All-In tanpa biaya add-on (POS Offline, KDS, Stok/HPP, Multi-Outlet, Struk Bluetooth).",
      "Slide 3: Perbandingan Starter Rp0 (1 Outlet, total 3 akun, khusus POS) vs Pro Rp49rb (All-In Multi-Outlet).",
    ],
    caption: `Banyak owner cafe menunda pakai sistem stok & layar dapur karena di aplikasi lain biasanya kena biaya add-on Rp150rb–Rp300rb lagi per bulan.

Padahal jualan kopi Rp25 ribuan, masa marginnya habis cuma buat bayar langganan aplikasi?

Di Tumpu Pro, semuanya sudah jadi satu:
• Rp49.000 / outlet / bulan (~Rp1.600 / hari)
• Rp0 komisi transaksi
• Sudah termasuk POS Offline, Layar Dapur (KDS), Auto Stok & HPP, Kontrol Staf, dan Multi-Outlet

Mau coba tanpa keluar uang dulu? Ada paket Starter Rp0 selamanya (1 outlet, 3 akun, khusus POS).

Komen "PRO" untuk link Trial Gratis 14 Hari, atau klik tumpu.biz.id di bio.

#aplikasikasirmurah #posindonesia #umkmkuliner #bisniskopi #poscafe #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H05-harga-pro-49rb",
    slideCount: 3,
  },
  {
    id: "ig-d6", day: 6, dayLabel: "Sabtu", platform: "Instagram", format: "Reels (9:16 · 16s)", theme: "dark", time: "17:30 WIB",
    title: "Weekend Rush: Catat Order Pakai HP di Meja Tamu",
    hook: "Malam Minggu outlet penuh? Gak perlu mesin kasir jutaan.",
    coverTitle: "Gak perlu mesin", coverItalic: "kasir jutaan.",
    screenshot: "/screenshots/10-pos-mobile.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 handheld documentary video on a lively Saturday evening at an Indonesian modern coffee shop and eatery. Medium shot of a friendly Indonesian male server in a casual olive apron standing beside a wooden table where three young friends are pointing at iced coffees and rice bowls, smiling and ordering. The server holds a regular black Android smartphone naturally in both hands, thumbs tapping smoothly as he takes their order without leaving the table. Warm evening pendant lights, bustling blurred cafe interior in the background, slight organic handheld camera movement, shot on iPhone 15 Pro natural color profile, authentic warm evening cafe chatter and clinking ice cubes audio. No readable text on the phone screen, candid documentary feel.`,
    brief: [
      "00–03s: Rekam HP membuka pos.tumpu.biz.id/pos di meja cafe.",
      "03–09s: Tap 2 menu di grid mobile → sticky checkout bar → klik Bayar / Kirim Dapur.",
      "09–13s: Cut cepat ke printer Bluetooth cetak struk / layar dapur menerima tiket.",
      "13–16s: End-card #0B1013: Jalan di HP, Tablet & Laptop · tumpu.biz.id.",
    ],
    caption: `Weekend antrean di kasir mengular? Pakai HP yang sudah ada biar pramusaji bisa langsung catat order dari meja tamu.\n\nTanpa beli hardware jutaan. Jalan di Android, iPhone, iPad, maupun laptop.\n\nCoba langsung dari HP kamu di tumpu.biz.id.\n\n#coffeeshoplife #weekendrush #kasirhp #aplikasikasirandroid #tumpu`,
  },
  {
    id: "ig-d7", day: 7, dayLabel: "Minggu", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "Recap 4 Langkah: Rapikan Outlet Mulai Senin Besok",
    hook: "Rapikan outlet kamu mulai Senin besok dalam 4 langkah.",
    coverTitle: "Rapikan outlet", coverItalic: "mulai Senin besok.",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1 (Light Cover): Strip 3 foto F&B + alur 01 Kasir → 02 Dapur → 03 Stok → 04 Shift.",
      "Slide 2: Split 01 Kasir POS + 02 Layar Dapur KDS.",
      "Slide 3: Split 03 Stok & HPP + 04 Dashboard & Z-Report.",
      "Slide 4: Setup 5 menit + foto /screenshots/10-pos-mobile.png.",
      "Slide 5 (Dark CTA): Mulai gratis hari ini di tumpu.biz.id.",
    ],
    caption: `Besok sudah Senin lagi. Saatnya pindah dari bon kertas yang sering hilang & rekap Excel manual ke satu alur operasional yang rapi dari depan sampai belakang.

4 langkah sederhana di Tumpu:
01. Kasir 1-tap (tetap jalan saat Wi-Fi mati)
02. Tiket otomatis muncul di Layar Dapur (KDS)
03. Stok bahan baku & HPP terpotong otomatis
04. Dashboard Owner & Z-Report tutup shift dalam 30 detik

Setup awalnya cuma butuh 5 menit—cukup masukkan 5 menu terlaris dulu buat tes langsung dari HP atau tablet kamu.

Ada pertanyaan soal printer Bluetooth atau PB1? Komen "TUMPU" atau langsung daftar gratis di tumpu.biz.id.

#bisniskuliner #poscafe #posresto #manajemenoutlet #operasionalcafe #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H07-recap-4-langkah",
    slideCount: 5,
  },

  // === THREADS (21 POSTS) ===
  { id: "th-1a", day: 1, dayLabel: "Senin", platform: "Threads", format: "Pagi · Opini", theme: "light", time: "08:30 WIB", title: "Momen paling deg-degan: Wi-Fi mati pas jam makan siang", hook: "Pancing diskusi owner F&B", brief: ["Balas semua komentar dalam 30 menit pertama."], caption: `Jujur deh, buat yang punya cafe atau rumah makan:\n\nMomen paling bikin deg-degan pas jam makan siang itu bukan bahan habis… tapi Wi-Fi mati terus mesin kasir ikut bengong.\n\nPernah ngalamin? Biasanya langsung balik tulis nota kertas atau gimana?` },
  { id: "th-1b", day: 1, dayLabel: "Senin", platform: "Threads", format: "Siang · Mini-Thread", theme: "dark", time: "12:45 WIB", title: "Build-in-Public: Kenapa Tumpu cuma Rp49rb/bulan", hook: "Cerita alasan membangun Tumpu untuk UMKM F&B", brief: ["Post utama + 3 reply berantai. Link di reply terakhir."], caption: `[Post Utama]\nSalah satu alasan kami bikin Tumpu: banyak pemilik kedai kopi yang baru jalan, tapi tiap bulan sudah habis Rp200rb–Rp350rb cuma buat langganan kasir + add-on stok + layar dapur. 🧵\n\n[Reply 1]\nDi Tumpu, Starter gratis selamanya buat 1 outlet (total 3 akun khusus POS). Versi Pro all-in (Multi-Outlet + KDS + Stok/HPP + Laporan) cuma Rp49.000/bulan (~Rp1.600/hari).\n\n[Reply 2]\nYang mau lihat tampilannya atau tes langsung di browser HP/tablet, mampir aja ke tumpu.biz.id 🙌` },
  { id: "th-1c", day: 1, dayLabel: "Senin", platform: "Threads", format: "Malam · Insight", theme: "light", time: "20:00 WIB", title: "Reminder Senin: Di mana gaji owner sembunyi", hook: "Short punchy reminder tanpa link", brief: ["Murni organik, tanpa link."], caption: `Reminder buat owner F&B hari Senin:\n\nJangan cuma lihat omzet harian. Cek juga selisih kas pas tutup shift dan bahan baku yang hilang tanpa jejak. Di situ biasanya "gaji owner" sembunyi.` },
  { id: "th-2a", day: 2, dayLabel: "Selasa", platform: "Threads", format: "Pagi · Angka HPP", theme: "light", time: "08:30 WIB", title: "Hitungan cepat HPP 1 gelas Es Kopi Susu Aren", hook: "Breakdown nyata Rp7.450 (Margin 73%)", brief: ["Format bullet rapi."], caption: `Hitungan cepat HPP 1 gelas Es Kopi Susu Aren (jual Rp28.000):\n\n• Espresso 18 gr → Rp3.600\n• Fresh milk 150 ml → Rp2.700\n• Gula aren 25 ml → Rp1.150\n• Total bahan: Rp7.450 (margin kotor ~73%)\n\nAngka 73% itu cuma di atas kertas kalau stok nggak kepotong otomatis tiap transaksi.` },
  { id: "th-2b", day: 2, dayLabel: "Selasa", platform: "Threads", format: "Siang · Diskusi", theme: "light", time: "13:00 WIB", title: "Masih stock opname pakai Excel atau sudah otomatis?", hook: "Pancing reply soal kendala stok", brief: ["Jawab tiap balasan dengan tips praktis."], caption: `Owner coffee shop / resto, kalian masih stock opname seminggu sekali pakai kertas & Excel, atau sudah otomatis terpotong dari resep kasir?\n\nBagian mana yang paling bikin males pas ngurus stok bahan baku?` },
  { id: "th-2c", day: 2, dayLabel: "Selasa", platform: "Threads", format: "Malam · Soft Demo", theme: "dark", time: "19:45 WIB", title: "Beli kiloan/botol, takar gram/ml otomatis", hook: "Lampirkan screenshot 07-stock.png", screenshot: "/screenshots/07-stock.png", brief: ["Lampirkan /screenshots/07-stock.png."], caption: `Hal kecil yang paling disukai owner cafe di Tumpu: beli kopi tetap input dalam kg, beli sirup dalam botol, tapi di resep cukup tulis 18 gram atau 25 ml.\n\nBegitu kasir klik lunas, stok otomatis berkurang dan HPP langsung kebaca → tumpu.biz.id.` },
  { id: "th-3a", day: 3, dayLabel: "Rabu", platform: "Threads", format: "Pagi · Hot Take", theme: "light", time: "08:45 WIB", title: "Unpopular opinion: Bon kertas kelihatan murah sampai...", hook: "Opini tajam yang relatable", brief: ["Tanpa link, fokus engagement."], caption: `Unpopular opinion buat rumah makan & cafe:\n\nBon kertas di dapur itu kelihatan murah, sampai satu bon nyelip di bawah piring pas jam makan siang dan bikin 1 meja nunggu 40 menit terus kasih bintang 1 di Google Maps.` },
  { id: "th-3b", day: 3, dayLabel: "Rabu", platform: "Threads", format: "Siang · Solusi KDS", theme: "light", time: "12:45 WIB", title: "Pakai Layar Dapur tidak perlu alat jutaan", hook: "Edukasi pakai tablet bekas untuk KDS", brief: ["Post utama + 2 reply singkat."], caption: `[Post Utama]\nBanyak yang ngira pakai Kitchen Display System (layar dapur) itu harus beli perangkat mahal jutaan rupiah. Padahal nggak perlu.\n\n[Reply 1]\nCukup pakai tablet Android lama atau monitor bekas yang bisa buka browser. Pesanan kopi otomatis ke layar Bar, makanan ke Dapur, lengkap timer otomatis.` },
  { id: "th-3c", day: 3, dayLabel: "Rabu", platform: "Threads", format: "Malam · Visual", theme: "dark", time: "20:00 WIB", title: "Tampilan Layar Dapur Tumpu", hook: "Lampirkan screenshot 03-kds.png", screenshot: "/screenshots/03-kds.png", brief: ["Lampirkan /screenshots/03-kds.png."], caption: `Tampilan layar dapur Tumpu. Bersih, kontras jelas, dan bisa drag & drop antar status. Sudah termasuk di paket Pro Rp49rb/bulan tanpa biaya add-on → tumpu.biz.id.` },
  { id: "th-4a", day: 4, dayLabel: "Kamis", platform: "Threads", format: "Pagi · Relatable", theme: "light", time: "08:30 WIB", title: "Sistem rapi melindungi owner sekaligus staf yang jujur", hook: "Cerita selisih laci kasir", brief: ["Nada empatik."], caption: `Hal paling nggak enak jadi owner cafe itu bukan pas sepi—tapi pas harus curiga sama staf sendiri gara-gara uang laci sering selisih Rp50rb–Rp100rb.\n\nSolusinya perbaiki sistem:\n1. Tiap shift punya PIN sendiri\n2. Void wajib PIN Manager\n3. Kasir nggak bisa buka omzet & edit stok.` },
  { id: "th-4b", day: 4, dayLabel: "Kamis", platform: "Threads", format: "Siang · Pertanyaan", theme: "light", time: "13:00 WIB", title: "SOP batal pesanan setelah cetak struk", hook: "Pertanyaan langsung ke owner", brief: ["Pancing diskusi SOP void."], caption: `Di outlet kalian, kalau ada pelanggan batalin pesanan setelah dicetak struk, kasir bisa langsung hapus sendiri atau harus minta izin Manager/Owner?` },
  { id: "th-4c", day: 4, dayLabel: "Kamis", platform: "Threads", format: "Malam · Soft-Sell", theme: "dark", time: "20:00 WIB", title: "Login PIN 4 digit, 3 detik ganti shift", hook: "Lampirkan screenshot 08-rbac.png", screenshot: "/screenshots/08-rbac.png", brief: ["Lampirkan /screenshots/08-rbac.png."], caption: `Di Tumpu, kalau staf login pakai PIN Kasir, yang kebuka ya cuma layar Kasir POS. Menu laporan omzet, stok, dan pengaturan otomatis hilang dan terkunci → tumpu.biz.id.` },
  { id: "th-5a", day: 5, dayLabel: "Jumat", platform: "Threads", format: "Pagi · Value Anchor", theme: "dark", time: "08:45 WIB", title: "Biaya operasional digital UMKM vs Rp49rb all-in", hook: "Kontras harga kompetitor Rp300rb vs Tumpu Rp49rb", brief: ["Tegaskan Rp0 komisi transaksi."], caption: `Jualan kopi Rp25 ribuan, tapi biaya aplikasi kasir + fitur stok + layar dapur bisa tembus Rp300rb/bulan.\n\nMakanya di Tumpu kami patok Rp49.000/outlet/bulan (~Rp1.600/hari) sudah all-in + Multi-Outlet, dan Rp0 komisi transaksi.` },
  { id: "th-5b", day: 5, dayLabel: "Jumat", platform: "Threads", format: "Siang · Perbandingan", theme: "light", time: "12:30 WIB", title: "Beda paket Starter Gratis vs Pro Rp49.000", hook: "Transparansi fitur tanpa jebakan", brief: ["Tautkan tumpu.biz.id di akhir."], caption: `Beda paket Gratis vs Pro di Tumpu:\n\nStarter (Rp0 / Gratis selamanya):\n1 Outlet, total 3 akun (1 Owner + 2 Staf), khusus Kasir POS + Offline + Struk 58/80mm.\n\nPro (Rp49.000/bulan):\nMulti-Outlet, staf tanpa batas, Layar Dapur (KDS), Stok & HPP otomatis, Dashboard & Laporan CSV → tumpu.biz.id.` },
  { id: "th-5c", day: 5, dayLabel: "Jumat", platform: "Threads", format: "Malam · Community", theme: "light", time: "20:30 WIB", title: "Semangat shift Jumat malam!", hook: "Sapaan hangat komunitas F&B", brief: ["Interaksi ringan."], caption: `Jumat malam biasanya jam paling sibuk di cafe & resto. Semangat buat semua owner, barista, kasir, dan tim dapur yang lagi lembur malam ini ☕🔥` },
  { id: "th-6a", day: 6, dayLabel: "Sabtu", platform: "Threads", format: "Pagi · Tips Modal", theme: "light", time: "09:00 WIB", title: "Jangan buru-buru beli mesin kasir Rp4–6 juta", hook: "Tips hemat modal buka kedai baru", brief: ["Sangat shareable."], caption: `Buat yang baru mau buka kedai kopi bulan ini: jangan buru-buru keluar Rp4–6 juta buat beli mesin kasir khusus.\n\nMulai dulu pakai tablet/HP Android yang sudah ada + printer thermal Bluetooth Rp250 ribuan.` },
  { id: "th-6b", day: 6, dayLabel: "Sabtu", platform: "Threads", format: "Siang · Mobile POS", theme: "dark", time: "13:30 WIB", title: "Tampilan Tumpu di HP untuk weekend rush", hook: "Lampirkan screenshot 10-pos-mobile.png", screenshot: "/screenshots/10-pos-mobile.png", brief: ["Lampirkan /screenshots/10-pos-mobile.png."], caption: `Ini tampilan Tumpu kalau dibuka dari HP. Pas weekend outlet penuh, pramusaji bisa langsung catat pesanan di meja tamu, dan tiket langsung muncul di dapur.` },
  { id: "th-6c", day: 6, dayLabel: "Sabtu", platform: "Threads", format: "Malam · Rekomendasi", theme: "light", time: "19:30 WIB", title: "Merek printer thermal Bluetooth paling awet?", hook: "Pancing komentar organik soal hardware", brief: ["Reply semua jawaban."], caption: `Teman-teman F&B, printer thermal Bluetooth 58mm/80mm merek apa yang paling awet menurut pengalaman kalian? (Buat referensi calon owner yang lagi nyari).` },
  { id: "th-7a", day: 7, dayLabel: "Minggu", platform: "Threads", format: "Pagi · Refleksi", theme: "light", time: "09:00 WIB", title: "3 data wajib cek tiap hari Minggu", hook: "Checklist evaluasi mingguan owner", brief: ["Edukasi santai Minggu pagi."], caption: `Hari Minggu paling enak dipakai buat cek 3 hal ini:\n1. Menu apa yang paling laku?\n2. Jam berapa outlet paling ramai?\n3. Bahan baku mana yang paling sering sisa/terbuang?\n\nKalau data ini masih susah dilihat tanpa ngitung manual, saatnya rapikan sistem kasirnya.` },
  { id: "th-7b", day: 7, dayLabel: "Minggu", platform: "Threads", format: "Siang · Recap", theme: "dark", time: "13:00 WIB", title: "Recap 4 langkah sistem Tumpu", hook: "Ringkasan padat + ajakan coba gratis", brief: ["Sertakan link tumpu.biz.id."], caption: `Satu alur rapi untuk cafe & rumah makan:\n1. Kasir 1-tap (tetap jalan saat Wi-Fi mati)\n2. Layar dapur tanpa kertas bon\n3. Stok & HPP terpotong otomatis\n4. Multi-Outlet & akses staf terkunci\n\nCoba gratis di tumpu.biz.id (Starter Rp0, atau Pro Rp49rb/bulan).` },
  { id: "th-7c", day: 7, dayLabel: "Minggu", platform: "Threads", format: "Malam · Open Q&A", theme: "light", time: "19:30 WIB", title: "Open Q&A soal kasir, printer Bluetooth & PB1", hook: "Closing leads Minggu malam", brief: ["Jawab cepat semua pertanyaan."], caption: `Ada owner cafe/resto di sini yang lagi cari aplikasi kasir tapi masih bingung soal printer Bluetooth, hitung PB1 10%, atau cara pindahin menu?\n\nDrop aja pertanyaannya di bawah, aku bantu jawab satu-satu malam ini 👇` },

  // === MINGGU 2–4: INSTAGRAM (HARI 8–30) ===
  {
    id: "ig-d8", day: 8, dayLabel: "Senin", platform: "Instagram", format: "Reels (9:16 · 20s)", theme: "dark", time: "12:00 WIB",
    title: "Tutup Shift 30 Detik: Anti Selisih Laci Kasir (Z-Report)",
    hook: "Jam 11 malam masih pusing ngitung ulang uang laci kasir?",
    coverTitle: "Tutup shift 30 detik,", coverItalic: "anti selisih laci.",
    screenshot: "/screenshots/04-dashboard.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 candid handheld smartphone video inside a quiet Indonesian coffee shop late at night after closing, chairs stacked loosely in the background. Medium close-up of a tired Indonesian male cashier at the dimly lit wooden counter counting stacks of Indonesian Rupiah banknotes beside an open metal cash drawer, a pocket calculator, and messy crumpled paper receipts, frowning slightly as he recounts. Practical warm downlight over the counter, subtle shadows, realistic tired facial expression, slight handheld camera sway, quiet late-night refrigerator hum and soft paper rustling sound. Authentic documentary realism, no readable numbers or text, natural film-like grain.`,
    brief: [
      "00–05s (Google Flow B-Roll): Kasir kelelahan hitung uang laci & nota kusut jam 11 malam.",
      "05–15s (HyperFrames): Transisi ke Z-Report Tumpu (/screenshots/04-dashboard.png) → Tunai Sistem vs Fisik → badge SELISIH Rp0.",
      "15–20s (HyperFrames): End-card #0B1013 · Starter Gratis & Pro Rp49rb/bln · tumpu.biz.id.",
    ],
    caption: `Drama tiap tutup outlet: kasir capek, uang di laci selisih, terus rekapnya makan waktu 1 jam sendiri.\n\nDengan fitur Tutup Shift (Z-Report) di Tumpu, sistem langsung mencocokkan total tunai, QRIS, dan kas keluar otomatis. Cuma 30 detik, shift beres, owner tenang.\n\nKomen "SHIFT" atau langsung coba gratis di tumpu.biz.id.\n\n#tutupshift #kasircafe #zreport #bisniskuliner #tumpu`,
  },
  {
    id: "ig-d9", day: 9, dayLabel: "Selasa", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "Setup Kasir Modal Rp250rb: HP Lama + Printer Thermal Bluetooth",
    hook: "Baru buka kedai? Jangan beli mesin kasir Rp5 juta dulu.",
    coverTitle: "Setup kasir modal", coverItalic: "cuma Rp250rb.",
    screenshot: "/screenshots/09-settings.png",
    brief: [
      "Slide 1 (Light Cover): Breakdown modal kasir hemat buat kedai baru.",
      "Slide 2: 01 Pakai HP Android / iPad bekas yang sudah ada (Rp0).",
      "Slide 3: 02 Printer Thermal Bluetooth 58mm (~Rp250rb) + kertas thermal.",
      "Slide 4: 03 Install Tumpu Starter Gratis (Rp0 selamanya, 1 outlet, 3 akun).",
      "Slide 5 (Dark CTA): Hemat modal Rp4,5 juta di bulan pertama → tumpu.biz.id.",
    ],
    caption: `Buat yang baru mau buka coffee shop, kedai minuman, atau rumah makan bulan ini: jangan buru-buru habis Rp4–6 juta cuma buat beli mesin kasir khusus.

Modal setup kasir yang rapi sebenarnya cukup Rp250 ribuan:
• HP Android / iPad bekas yang sudah ada: Rp0
• Printer Thermal Bluetooth 58mm + kertas: ~Rp250.000
• Tumpu Starter (1 outlet, 3 akun, offline POS): Rp0 selamanya

Sisa modal Rp4,5 juta lebih baik dipakai buat beli biji kopi, bahan baku berkualitas, dan promosi pembukaan.

Simpan carousel ini buat checklist buka outlet kamu 📌
Bingung pilih merek printer Bluetooth yang awet? Komen "PRINTER" biar kami kirim rekomendasinya ke DM!

#bukacafe #modalusaha #printerbluetooth #posumkm #tipsbisniskopi #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H09-setup-kasir-250rb",
    slideCount: 5,
  },
  {
    id: "ig-d10", day: 10, dayLabel: "Rabu", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "12:00 WIB",
    title: "Pindah Meja & Split Bill Tanpa Drama di Jam Makan Siang",
    hook: "Meja rombongan minta pisah struk pas antrean panjang?",
    coverTitle: "Split bill & pindah meja", coverItalic: "tanpa drama.",
    screenshot: "/screenshots/06-tables.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 handheld smartphone footage in a bright daytime Indonesian casual restaurant. Medium shot of a group of four Indonesian office workers standing near the cashier counter after lunch, gesturing politely while holding individual wallets and smartphones to split their bill, while another customer waits behind them. Natural window daylight, warm wood and concrete interior, casual everyday clothing, realistic candid expressions, natural handheld micro-shake, ambient restaurant lunchtime chatter and cutlery clinks. No readable text or logos, completely natural documentary video.`,
    brief: [
      "00–04s (Google Flow B-Roll): Rombongan kantor minta split bill di kasir saat jam makan siang.",
      "04–14s (HyperFrames): Demo /screenshots/06-tables.png → Pindah Meja 04 ke 08 & Split Bill 2 struk dalam 3 tap.",
      "14–18s (HyperFrames): End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Jam makan siang paling sering bikin antrean kasir numpuk: meja rombongan pindah tempat duduk terus minta pisah struk.\n\nDi Tumpu, pindah meja & split bill cukup beberapa tap di denah meja. Antrean lancar, pelanggan senang.\n\nCoba langsung di tumpu.biz.id.\n\n#posresto #splitbill #operasionalresto #rumahmakan #tumpu`,
  },
  {
    id: "ig-d11", day: 11, dayLabel: "Kamis", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "Cara Hitung PB1 10% & Service Charge Otomatis di Struk Cafe",
    hook: "Masih sering salah hitung PB1 10% & service charge di struk?",
    coverTitle: "PB1 10% & Service", coverItalic: "otomatis di struk.",
    screenshot: "/screenshots/09-settings.png",
    brief: [
      "Slide 1: Beda PB1 (Pajak Restoran 10%) vs Service Charge 5%.",
      "Slide 2: Cara setting otomatis di Pengaturan Outlet Tumpu (/screenshots/09-settings.png).",
      "Slide 3: Contoh struk rapi (Subtotal + Service + PB1 10% = Grand Total).",
      "Slide 4: Mode inklusif vs eksklusif sesuai kebutuhan outlet.",
      "Slide 5 (Dark CTA): Gak perlu hitung manual lagi · tumpu.biz.id.",
    ],
    caption: `Masih sering salah hitung PB1 10% dan service charge di struk, atau kasir suka lupa tambahin pajak pas jam ramai?

Banyak owner cafe & resto baru yang masih bingung bedain PB1 dan Service Charge—apalagi cara urut hitungannya biar nggak salah setor di akhir bulan.

Geser buat simpan panduan ringkasnya:
• Beda PB1 10% (Pajak Daerah) vs Service Charge 5%
• Contoh urutan hitungan struk yang benar (Subtotal → Service → PB1 10%)
• Kapan pakai harga Inklusif vs Eksklusif
• Cara setting otomatis sekali klik di Pengaturan Outlet Tumpu

Simpan biar kasir nggak perlu pencet kalkulator manual lagi 📌
Komen "PB1" atau langsung coba atur otomatis di tumpu.biz.id.

#pajakresto #pb1 #bisniscafe #operasionalresto #aplikasikasir #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H11-pb1-service-charge",
    slideCount: 5,
  },
  {
    id: "ig-d12", day: 12, dayLabel: "Jumat", platform: "Instagram", format: "Reels (9:16 · 15s)", theme: "dark", time: "12:00 WIB",
    title: "3 Detik Ganti Shift Pakai PIN 4 Digit (Anti Akun Sharing)",
    hook: "Masih 1 akun kasir dipakai 4 staf? Ganti shift cukup 3 detik.",
    coverTitle: "Ganti shift 3 detik", coverItalic: "pakai PIN personal.",
    screenshot: "/screenshots/01-login.png",
    videoEngine: "HyperFrames Only",
    videoPrompt: `[HyperFrames Only · 1080x1920 · 15s]\n00–03s: Editorial hook #0B1013 + Warm Brass: "Masih 1 akun kasir dipakai 4 staf? Ini cara aman ganti shift dalam 3 detik."\n03–09s: Animated UI /screenshots/01-login.png → fast 4-digit PIN keypad tap (• • • •) → switch to Shift Sore (Rina).\n09–12s: Highlight RBAC lock (/screenshots/08-rbac.png) — Omzet & Stok terkunci.\n12–15s: End-card #0B1013: Coba Gratis di tumpu.biz.id.`,
    brief: [
      "100% HyperFrames UI Motion: Keypad PIN 4 digit (/screenshots/01-login.png) → switch shift instan.",
      "Tunjukkan layar /screenshots/08-rbac.png bahwa kasir tidak bisa buka laporan omzet.",
      "End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Kalau semua kasir pakai 1 login yang sama, pas ada selisih kas nggak bakal tahu terjadi di shift siapa.\n\nDi Tumpu, tiap staf punya PIN 4 digit sendiri. Ganti shift cukup 3 detik, dan laporan Z-Report langsung terpisah otomatis.\n\nCoba di tumpu.biz.id.\n\n#manajemenstaf #kasircafe #antifraud #tumpu`,
  },
  {
    id: "ig-d13", day: 13, dayLabel: "Sabtu", platform: "Instagram", format: "Carousel (4:5 · 6 Slide)", theme: "light", time: "17:30 WIB",
    title: "5 Kesalahan Fatal Owner Baru Saat Pilih Aplikasi Kasir",
    hook: "Jangan sampai salah pilih POS terus boncos biaya add-on tiap bulan.",
    coverTitle: "5 kesalahan pilih", coverItalic: "aplikasi kasir.",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1 (Cover): 5 kesalahan fatal owner baru saat pilih aplikasi kasir.",
      "Slide 2: 01 Terjebak harga murah di awal, tapi KDS & stok kena add-on mahal.",
      "Slide 3: 02 Tidak cek apakah kasir bisa jalan saat Wi-Fi mati.",
      "Slide 4: 03 Beli hardware khusus jutaan yang tidak bisa dipakai untuk app lain.",
      "Slide 5: 04 Tidak ada kunci akses kasir & log void.",
      "Slide 6 (Dark CTA): Tumpu Pro Rp49rb/bln All-In tanpa biaya tersembunyi · tumpu.biz.id.",
    ],
    caption: `Banyak owner baru menyesal setelah 3 bulan langganan aplikasi kasir—baru sadar fitur stok, resep, dan layar dapur ternyata kena biaya add-on mahal lagi.

Sebelum keluar uang langganan tahunan atau beli hardware jutaan, cek dulu 5 kesalahan paling sering ini:
01. Terjebak harga awal murah, tapi fitur penting kena add-on
02. Lupa cek apakah kasir tetap jalan saat Wi-Fi mati
03. Beli mesin kasir khusus jutaan yang terkunci 1 aplikasi
04. Tidak ada kunci akses kasir & log pembatalan (void)
05. Kena potongan komisi per transaksi yang menggerus margin

Simpan carousel ini sebelum kamu memilih POS untuk outlet kamu 📌
Mau bandingkan langsung? Komen "DEMO" atau cek tumpu.biz.id.

#tipsbisnisfnb #poscafe #ownercoffee #aplikasikasir #bisniskuliner #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H13-5-kesalahan-pilih-pos",
    slideCount: 6,
  },
  {
    id: "ig-d14", day: 14, dayLabel: "Minggu", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "18:30 WIB",
    title: "POV Owner Cek Omzet & Margin Hari Minggu dari Rumah",
    hook: "Hari Minggu tetap santai di rumah, tapi omzet & margin outlet terpantau realtime.",
    coverTitle: "Pantau outlet Minggu", coverItalic: "langsung dari rumah.",
    screenshot: "/screenshots/04-dashboard.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 natural handheld documentary video on a calm Sunday morning inside a modest modern Indonesian home living room. Over-the-shoulder medium shot of an Indonesian man in his early 30s wearing a plain casual t-shirt, sitting relaxed at a wooden dining table with a ceramic mug of black coffee beside him, calmly scrolling on his smartphone with a slight relieved smile. Soft morning sunlight streaming through sheer curtains, real home clutter subtly out of focus in background, natural skin tone, gentle handheld camera movement, quiet morning birds and ceramic mug clink audio. No readable text on phone screen, authentic everyday lifestyle footage.`,
    brief: [
      "00–05s (Google Flow B-Roll): Owner santai Minggu pagi ngopi di rumah sambil cek HP.",
      "05–14s (HyperFrames): Overlay /screenshots/04-dashboard.png → Omzet Realtime, Margin 73%, Top Menu.",
      "14–18s (HyperFrames): End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Enaknya punya sistem yang rapi: hari Minggu nggak perlu bolak-balik chat kasir "hari ini ramai nggak?" atau nunggu rekap Excel malam hari.\n\nBuka dashboard Tumpu dari HP, omzet, margin kotor, dan menu terlaris langsung kebaca realtime.\n\nCoba gratis di tumpu.biz.id.\n\n#ownercafe #bisnisautopilot #dashboardpos #tumpu`,
  },
  {
    id: "ig-d15", day: 15, dayLabel: "Senin", platform: "Instagram", format: "Reels (9:16 · 20s)", theme: "dark", time: "12:00 WIB",
    title: "Resep Kopi Susu Terpotong Otomatis Tiap Order Lunas",
    hook: "Tiap 1 cup Es Kopi Susu terjual, stok bahan baku langsung terpotong otomatis.",
    coverTitle: "1 cup lunas, stok", coverItalic: "terpotong otomatis.",
    screenshot: "/screenshots/07-stock.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 close-up handheld documentary video at an Indonesian coffee shop espresso bar. A skilled Indonesian barista's hands pull a rich espresso shot into a small glass, pour creamy fresh milk from a carton and dark palm sugar syrup into a clear iced cup filled with ice cubes on a stainless steel bar counter. Natural side daylight catching the swirling milk and coffee layers, realistic droplets of condensation on the cup, slight authentic handheld camera movement, crisp real audio of espresso extraction, pouring milk, and clinking ice. No brand logos or text on cups or cartons, pure realistic coffee-making B-roll.`,
    brief: [
      "00–05s (Google Flow B-Roll): Barista meracik Es Kopi Susu Aren real-time di bar.",
      "05–16s (HyperFrames): Overlay pengurangan stok live (-18gr Espresso, -150ml Susu, -25ml Aren, HPP Rp7.450) + /screenshots/07-stock.png.",
      "16–20s (HyperFrames): End-card #0B1013 · Sudah termasuk di Pro Rp49rb/bln.",
    ],
    caption: `Susu literan & biji kopi sering habis lebih cepat dari penjualan? Biasanya karena stok tidak terhubung ke resep kasir.\n\nDi Tumpu, begitu 1 cup lunas, gramasi kopi, susu, dan gula aren langsung terpotong otomatis sekaligus menghitung HPP.\n\nKomen "STOK" untuk lihat demonya atau klik tumpu.biz.id.\n\n#stokbahanbaku #hppkopi #coffeeshopindonesia #tumpu`,
  },
  {
    id: "ig-d16", day: 16, dayLabel: "Selasa", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "Studi Kasus Rumah Makan: Hemat 40 Menit/Hari Tanpa Bon Kertas",
    hook: "Jam makan siang rumah makan sering kacau karena kertas bon numpuk?",
    coverTitle: "Hemat 40 menit/hari", coverItalic: "tanpa bon kertas.",
    screenshot: "/screenshots/03-kds.png",
    brief: [
      "Slide 1: Sebelum vs Sesudah pakai KDS di Rumah Makan 15 meja.",
      "Slide 2: Masalah lama: pramusaji bolak-balik kasir → dapur, bon hilang.",
      "Slide 3: Alur baru: Catat di HP meja tamu → tiket langsung ke layar dapur.",
      "Slide 4: Dampak: Waktu tunggu turun, komplain salah menu jadi 0 (/screenshots/03-kds.png).",
      "Slide 5 (Dark CTA): Trial Pro 14 Hari gratis di tumpu.biz.id.",
    ],
    caption: `Banyak yang mengira Layar Dapur (KDS) cuma buat coffee shop modern. Padahal rumah makan dengan 15+ meja saat jam makan siang justru yang paling terasa bedanya!

Satu kertas bon nyelip di bawah piring = 1 keluarga nunggu 35 menit lalu kasih ulasan bintang 1.

Geser buat lihat perbandingan nyata sebelum vs sesudah rumah makan beralih ke Layar Dapur (KDS) Tumpu:
• Pramusaji catat order langsung dari HP di meja tamu
• Tiket otomatis muncul di tablet dapur lengkap timer SLA
• Salah menu turun drastis & hemat 40 menit/hari di jam puncak

Komen "KDS" kalau mau coba pasang di tablet bekas dapur kamu, atau cek langsung di tumpu.biz.id.

#rumahmakan #posresto #kitchendisplay #operasionalresto #bisniskuliner #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H16-studi-kasus-rumah-makan",
    slideCount: 5,
  },
  {
    id: "ig-d17", day: 17, dayLabel: "Rabu", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "12:00 WIB",
    title: "Barista vs Dapur Panas: Routing Tiket Otomatis Tanpa Teriak",
    hook: "Kopi langsung ke layar Bar, makanan langsung ke layar Dapur.",
    coverTitle: "Bar & Dapur terpisah,", coverItalic: "tanpa teriak-teriak.",
    screenshot: "/screenshots/03-kds.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 handheld documentary two-beat shot inside a busy Indonesian cafe-bistro. First 2.5 seconds: a barista behind the espresso bar glances down at a mounted black tablet screen and immediately starts steaming milk; smooth natural whip-pan transition to the open kitchen pass 3 meters away where a cook checks a wall-mounted tablet and begins plating a hot rice bowl. Warm natural indoor lighting, genuine cafe hustle, natural unposed movements, authentic background hiss of milk steamer and kitchen pan sizzle. No readable text on tablets, documentary realism.`,
    brief: [
      "00–05s (Google Flow B-Roll): Whip-pan dokumenter dari Barista cek tablet bar ke Koki cek tablet dapur.",
      "05–14s (HyperFrames): Animasi routing otomatis dari 1 order (/screenshots/02-pos.png → Bar & Dapur /screenshots/03-kds.png).",
      "14–18s (HyperFrames): End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Satu meja pesan 2 Es Kopi Susu + 2 Nasi Goreng? Nggak perlu kasir bolak-balik teriak ke bar dan dapur.\n\nTumpu otomatis memisahkan tiket minuman ke layar Bar dan makanan ke layar Dapur secara realtime.\n\nCoba di tumpu.biz.id.\n\n#operasionalcafe #baristalife #kitchendisplay #tumpu`,
  },
  {
    id: "ig-d18", day: 18, dayLabel: "Kamis", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "Punya 2–3 Cabang? Kelola Semua Outlet dalam 1 Dashboard",
    hook: "Buka cabang ke-2 tapi malah makin pusing rekap laporan terpisah?",
    coverTitle: "Kelola 2–3 cabang", coverItalic: "dalam 1 dashboard.",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1: Tanda outlet kamu siap buka cabang ke-2.",
      "Slide 2: Bandingkan omzet & margin antar cabang dalam 1 layar.",
      "Slide 3: Menu & resep tersinkron, harga tetap bisa beda per cabang.",
      "Slide 4: Biaya tetap terjangkau: Rp49.000 / outlet / bulan.",
      "Slide 5 (Dark CTA): Konsultasi setup multi-outlet via WA di tumpu.biz.id.",
    ],
    caption: `Buka cabang ke-2 seharusnya bikin bisnis makin tumbuh—bukan malah bikin owner pusing rekap 3 file laporan terpisah tiap malam.

Di Tumpu Pro, semua cabang terpantau rapi dari 1 akun Owner:
• Bandingkan omzet, transaksi, & margin antar cabang dalam 1 layar
• Master menu & resep tersinkron, tapi harga jual tetap bisa disesuaikan per lokasi
• Biaya tetap masuk akal: Rp49.000 / outlet / bulan, Rp0 komisi transaksi

Punya 2 cabang atau sedang persiapan ekspansi tahun ini?
Komen "CABANG" biar tim kami bantu konsultasi setup multi-outlet, atau cek langsung di tumpu.biz.id.

#multioutlet #ekspansibisnis #poscafe #ownercafe #manajemenbisnis #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H18-multi-outlet-dashboard",
    slideCount: 5,
  },
  {
    id: "ig-d19", day: 19, dayLabel: "Jumat", platform: "Instagram", format: "Reels (9:16 · 16s)", theme: "dark", time: "12:00 WIB",
    title: "Audit Void & Diskon: Kenapa Owner Wajib Kunci Akses Kasir",
    hook: "1 void fiktif Rp50rb/hari = Rp1,5 juta hilang diam-diam per bulan.",
    coverTitle: "1 void/hari hilang", coverItalic: "Rp1,5 juta/bulan.",
    screenshot: "/screenshots/08-rbac.png",
    videoEngine: "HyperFrames Only",
    videoPrompt: `[HyperFrames Only · 1080x1920 · 16s]\n00–04s: Bold editorial counter on #0B1013: "1 Void fiktif Rp50.000/hari" → rapid roll-up to "Rp1.500.000 / bulan" in #DC2626.\n04–12s: UI demo /screenshots/08-rbac.png → Void button triggers "Wajib PIN Manager" modal + permanent audit log.\n12–16s: End-card #0B1013: Amankan Outlet di tumpu.biz.id.`,
    brief: [
      "100% HyperFrames: Animasi angka Rp50rb/hari → Rp1,5jt/bulan.",
      "Demo layar kunci PIN Manager saat void di /screenshots/08-rbac.png.",
      "End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Kebocoran terbesar di F&B sering bukan dari angka besar sekali ambil—tapi dari void dan diskon kecil tanpa izin yang terjadi tiap hari.\n\nKunci tombol void dengan PIN Manager di Tumpu agar setiap pembatalan tercatat permanen.\n\nCoba gratis di tumpu.biz.id.\n\n#antifraud #auditkasir #manajemencafe #tumpu`,
  },
  {
    id: "ig-d20", day: 20, dayLabel: "Sabtu", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "17:30 WIB",
    title: "Checklist SOP Opening & Closing Cafe (Siap Simpan!)",
    hook: "Checklist 5 menit biar staf opening & closing gak pernah kelewat.",
    coverTitle: "Checklist SOP", coverItalic: "Opening & Closing.",
    screenshot: "/screenshots/02-pos.png",
    brief: [
      "Slide 1: Simpan & bagikan ke grup WA staf outlet kamu!",
      "Slide 2: SOP Opening (Modal kas awal, cek printer Bluetooth, cek stok kritis).",
      "Slide 3: SOP Operasional (Login PIN personal, routing KDS, catat kas keluar).",
      "Slide 4: SOP Closing (Hitung fisik laci, cocokkan Z-Report, export laporan).",
      "Slide 5 (Dark CTA): Semua checklist ini otomatis tercatat di Tumpu · tumpu.biz.id.",
    ],
    caption: `SOP yang bagus itu bukan dokumen 50 halaman yang cuma disimpan di laci—tapi checklist 5 menit yang simpel dan benar-benar dijalankan tim setiap hari.

Simpan carousel ini dan kirim langsung ke grup WA staf kasir & barista kamu 📌

Ringkasan 3 fase operasional harian:
• Opening (08:00): Input modal kas awal, cek kertas thermal, cek stok bahan kritis
• Operasional: Login PIN personal, routing KDS, catat setiap kas keluar
• Closing (22:00): Hitung fisik uang laci, cocokkan Z-Report, export laporan harian

Di Tumpu, seluruh alur buka-tutup shift dan Z-Report sudah tercatat otomatis dalam 30 detik.

Komen "SOP" kalau mau versi checklist praktisnya, atau coba langsung di tumpu.biz.id.

#sopcafe #operasionalfnb #baristaindonesia #manajemencafe #kasircafe #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H20-sop-opening-closing",
    slideCount: 5,
  },
  {
    id: "ig-d21", day: 21, dayLabel: "Minggu", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "18:30 WIB",
    title: "Perbandingan Biaya POS Rp300rb/bln vs Tumpu Pro Rp49rb/bln",
    hook: "Hemat Rp3 juta per tahun dari biaya langganan aplikasi kasir.",
    coverTitle: "Hemat Rp3 juta/thn", coverItalic: "tanpa kurangi fitur.",
    screenshot: "/screenshots/04-dashboard.png",
    videoEngine: "HyperFrames Only",
    videoPrompt: `[HyperFrames Only · 1080x1920 · 18s]\n00–04s: Editorial dark hook #0B1013 + #E5BA78: "Bayar POS Rp300rb/bln atau Rp49rb/bln? Cek bedanya."\n04–13s: Animated price stack comparison — POS Lama (Base Rp150rb + Stok Rp75rb + KDS Rp75rb = Rp3,6jt/thn) vs Tumpu Pro All-In (Rp49rb/bln = Rp588rb/thn · Hemat Rp3jt/thn).\n13–18s: End-card #0B1013: Starter Rp0 · Trial Pro 14 Hari · tumpu.biz.id.`,
    brief: [
      "100% HyperFrames Data Motion: Breakdown biaya POS Rp300rb/bln vs Tumpu Pro Rp49rb/bln.",
      "Highlight: Hemat ~Rp3 juta/tahun per outlet, Rp0 komisi transaksi.",
      "End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Rp3 juta setahun hasil hemat biaya langganan POS bisa dipakai buat beli bahan baku, promo lokal, atau bonus staf.\n\nTumpu Pro Rp49.000/outlet/bulan sudah all-in (POS Offline + KDS + Stok & HPP + Multi-Outlet). Tanpa potongan per transaksi.\n\nCoba gratis di tumpu.biz.id.\n\n#hematbiaya #posmurah #umkmkuliner #tumpu`,
  },
  {
    id: "ig-d22", day: 22, dayLabel: "Senin", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "12:00 WIB",
    title: "\"Males Input Ulang Menu?\" Setup 5 Menu Terlaris Cuma 5 Menit",
    hook: "Alasan paling sering menunda pindah POS: males input ulang menu.",
    coverTitle: "Setup 5 menu awal", coverItalic: "cuma 5 menit.",
    screenshot: "/screenshots/05-menu.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 handheld smartphone documentary video inside an Indonesian coffee shop before opening hours. Medium shot of a young Indonesian cafe owner sitting at a clean wooden table with a printed laminated menu sheet beside an iPad and a small black Bluetooth thermal printer. He taps the tablet screen casually while sipping iced americano, looking relaxed and focused. Soft morning daylight through glass window, warm wood tones, authentic lived-in cafe interior, subtle handheld micro-shake, gentle morning ambient cafe sound. No readable text on the menu or tablet screen.`,
    brief: [
      "00–04s (Google Flow B-Roll): Owner santai setup menu di tablet sebelum kedai buka sambil minum kopi.",
      "04–14s (HyperFrames): Demo /screenshots/05-menu.png + stopwatch 05:00 input 5 menu terlaris → langsung bisa transaksi.",
      "14–18s (HyperFrames): End-card #0B1013 · Panduan migrasi via WA & Manual Book PDF.",
    ],
    caption: `Nggak perlu langsung input 100 menu di hari pertama. Cukup masukkan 5 menu terlaris dulu buat tes alur kasir & printer Bluetooth—cuma butuh 5 menit.\n\nKalau cocok, tim kami siap bantu pandu migrasi menu sampai jalan.\n\nDaftar gratis di tumpu.biz.id.\n\n#setupkasir #pindahpos #bisniskopi #tumpu`,
  },
  {
    id: "ig-d23", day: 23, dayLabel: "Selasa", platform: "Instagram", format: "Carousel (4:5 · 4 Slide)", theme: "light", time: "18:30 WIB",
    title: "Starter Gratis Rp0 vs Pro Rp49rb — Pilih Mana Buat Outlet Kamu?",
    hook: "Transparan tanpa jebakan: kapan cukup pakai Starter gratis saja?",
    coverTitle: "Starter Rp0 vs Pro,", coverItalic: "pilih mana?",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1: Perbandingan jujur Starter Gratis vs Pro Rp49rb.",
      "Slide 2: Pilih Starter (Rp0 selamanya) jika 1 outlet, maksimal 3 akun, fokus kasir POS & struk Bluetooth.",
      "Slide 3: Pilih Pro (Rp49rb/bln) jika butuh KDS dapur, potong stok/HPP otomatis, atau multi-outlet.",
      "Slide 4 (Dark CTA): Bisa mulai dari Starter dulu, upgrade kapan saja → tumpu.biz.id.",
    ],
    caption: `Kami nggak maksa kamu langsung bayar. Transparan sejak hari pertama:

• Pilih STARTER (Rp0 / Gratis selamanya) kalau kedai kamu baru buka, 1 outlet, maksimal 3 akun (1 Owner + 2 Staf), dan fokus butuh kasir cepat + mode offline + struk Bluetooth 58/80mm.

• Pilih PRO (Rp49.000/outlet/bulan) begitu outlet makin ramai dan butuh Layar Dapur (KDS), auto potong stok & HPP, staf tanpa batas, laporan CSV, atau mulai buka cabang ke-2.

Nggak ada jebakan kontrak tahunan, dan Rp0 komisi transaksi di kedua paket.

Komen "STARTER" untuk link daftar gratis 2 menit, atau langsung buka tumpu.biz.id.

#aplikasikasirgratis #poscafe #umkmindonesia #bisniskuliner #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H23-starter-vs-pro",
    slideCount: 4,
  },
  {
    id: "ig-d24", day: 24, dayLabel: "Rabu", platform: "Instagram", format: "Reels (9:16 · 17s)", theme: "dark", time: "12:00 WIB",
    title: "Tes Cetak Struk Bluetooth 58mm & 80mm Langsung dari HP",
    hook: "Cetak struk rapi pakai printer thermal Bluetooth 58mm/80mm langsung dari browser HP.",
    coverTitle: "Cetak struk 58/80mm", coverItalic: "langsung dari HP.",
    screenshot: "/screenshots/09-settings.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 close-up handheld smartphone video on a dark wooden Indonesian coffee shop counter. A compact matte-black 58mm Bluetooth thermal receipt printer sits next to a smartphone held by an Indonesian cashier's hand. The hand taps the phone screen once, and immediately white thermal receipt paper feeds smoothly out of the printer; the hand tears the receipt cleanly along the serrated metal edge. Natural overhead cafe lighting, crisp real texture of thermal paper and wood grain, authentic mechanical buzzing sound of a thermal printer and crisp paper tear audio. No readable text on the paper or phone, raw authentic product-in-use footage.`,
    brief: [
      "00–05s (Google Flow B-Roll): Close-up nyata printer Bluetooth mencetak struk thermal & disobek rapi.",
      "05–13s (HyperFrames): Tampilkan /screenshots/09-settings.png (pilih 58mm/80mm) + preview struk bersih dengan logo & PB1.",
      "13–17s (HyperFrames): End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Bingung apakah printer thermal Bluetooth kamu cocok? Tumpu mendukung printer thermal standar 58mm dan 80mm (Bluetooth & USB).\n\nTinggal pairing, atur nama & alamat outlet, struk langsung tercetak rapi.\n\nKomen "PRINTER" kalau mau tanya rekomendasi tipe printer yang cocok.\n\n#printerthermal #strukkasir #kasirhp #tumpu`,
  },
  {
    id: "ig-d25", day: 25, dayLabel: "Kamis", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "4 Data Wajib Cek Sebelum Akhir Bulan Biar Margin Naik 15%",
    hook: "Evaluasi akhir bulan nggak perlu ribet—cukup cek 4 angka ini.",
    coverTitle: "4 data akhir bulan", coverItalic: "naikkan margin 15%.",
    screenshot: "/screenshots/04-dashboard.png",
    brief: [
      "Slide 1: 4 metrik evaluasi bulanan owner F&B.",
      "Slide 2: 01 Top 5 Menu terlaris vs Bottom 5 Menu (pangkas menu beban stok).",
      "Slide 3: 02 Persentase HPP rata-rata (jaga di bawah 30–35%).",
      "Slide 4: 03 Jam puncak transaksi (atur jadwal shift staf biar efisien).",
      "Slide 5 (Dark CTA): Semua grafik ini otomatis tersedia di Tumpu Pro · tumpu.biz.id.",
    ],
    caption: `Evaluasi akhir bulan nggak perlu ribet bikin rumus rumit—luangkan 15 menit saja buat cek 4 data inti ini.

Banyak coffee shop & rumah makan bisa menaikkan margin bersih 10–15% bukan dari menaikkan harga, tapi dari memangkas menu yang bahan bakunya sering terbuang dan merapikan jadwal shift.

4 data wajib cek sebelum tanggal 1:
01. Top 5 Menu terlaris vs Bottom 5 Menu (pangkas beban stok)
02. Persentase HPP rata-rata (target sehat 28%–35%)
03. Jam puncak transaksi (atur jadwal shift staf biar efisien)
04. Selisih kas & void bulanan (deteksi kebocoran lebih awal)

Simpan buat agenda evaluasi akhir bulan outlet kamu 📌
Komen "MARGIN" atau lihat dashboard otomatisnya di tumpu.biz.id.

#evaluasibisnis #marginfnb #ownercafe #bisniskuliner #dashboardpos #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H25-4-data-akhir-bulan",
    slideCount: 5,
  },
  {
    id: "ig-d26", day: 26, dayLabel: "Jumat", platform: "Instagram", format: "Reels (9:16 · 22s)", theme: "dark", time: "12:00 WIB",
    title: "Kenapa Banyak Cafe Ramai Tapi Tetap Tutup di Tahun Pertama?",
    hook: "Cafe ramai pengunjung tiap hari, tapi kok tetap tutup di tahun pertama?",
    coverTitle: "Ramai pengunjung,", coverItalic: "kenapa tetap tutup?",
    screenshot: "/screenshots/04-dashboard.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 candid handheld documentary video from outside looking slightly through the glass window of a lively Indonesian coffee shop at golden hour. Warm interior lights glow as customers sit chatting over iced coffee and laptops, baristas move briskly behind the bar, while reflections of passing motorbikes faintly glide across the glass. Realistic natural golden-hour light, subtle handheld camera drift, authentic muffled street and cafe ambiance, raw documentary tone rather than commercial glossy look. No readable store signs or logos.`,
    brief: [
      "00–05s (Google Flow B-Roll): Shot dokumenter sore hari melihat ke dalam cafe yang ramai dari luar kaca.",
      "05–17s (HyperFrames): 3 penyebab tak terlihat (HPP dikira-kira, stok bocor tanpa jejak, biaya langganan bengkak) + solusi /screenshots/04-dashboard.png.",
      "17–22s (HyperFrames): End-card #0B1013 · Rapikan sistem sebelum terlambat · tumpu.biz.id.",
    ],
    caption: `Ramai pengunjung itu baru separuh cerita. Tanpa kontrol HPP, stok bahan baku, dan laporan kas yang jujur, omzet besar tetap bisa habis tak bersisa.\n\nRapikan fondasi operasional outletmu dari sekarang—mulai gratis di tumpu.biz.id.\n\n#bisniscafe #coffeeshopindonesia #manajemenkeuangan #tumpu`,
  },
  {
    id: "ig-d27", day: 27, dayLabel: "Sabtu", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "17:30 WIB",
    title: "Alur Lengkap Dine-In, Takeaway & Delivery Tanpa Antre Kasir",
    hook: "Order dine-in, bungkus, dan ojol kecampur semua di dapur?",
    coverTitle: "Dine-in & Takeaway", coverItalic: "rapi tanpa ketukar.",
    screenshot: "/screenshots/06-tables.png",
    brief: [
      "Slide 1: Pisahkan label order Dine-In, Takeaway, dan Delivery di Tumpu.",
      "Slide 2: Dine-In terhubung ke nomor meja (/screenshots/06-tables.png).",
      "Slide 3: Takeaway & Ojol otomatis diberi badge khusus di layar KDS.",
      "Slide 4: Dapur langsung tahu mana yang pakai piring, mana yang pakai kemasan bungkus.",
      "Slide 5 (Dark CTA): Kurangi salah bungkus pas weekend rush · tumpu.biz.id.",
    ],
    caption: `Salah satu komplain paling sering pas weekend ramai: pesanan tamu makan di tempat malah dibungkus plastik, atau pesanan ojol malah ditaruh di piring!

Solusinya bukan cuma nyuruh dapur "lebih teliti", tapi memastikan jenis order sudah terpisah jelas sejak dari layar kasir.

Di Tumpu:
• Dine-In otomatis terhubung ke nomor meja & bisa pindah meja / split bill
• Takeaway & Delivery (Ojol) langsung tampil dengan badge khusus di Layar Dapur (KDS)
• Tim dapur langsung tahu mana yang pakai piring, mana yang pakai kemasan bungkus

Kurangi salah bungkus pas malam Minggu nanti!
Komen "RESTO" atau langsung coba alur mejanya di tumpu.biz.id.

#operasionalresto #dinein #takeaway #posresto #bisniscafe #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H27-dinein-takeaway-delivery",
    slideCount: 5,
  },
  {
    id: "ig-d28", day: 28, dayLabel: "Minggu", platform: "Instagram", format: "Reels (9:16 · 20s)", theme: "dark", time: "18:30 WIB",
    title: "Demo 20 Detik: Dari Pelanggan Pesan Sampai Laporan Laba Rugi",
    hook: "Lihat seluruh alur kerja Tumpu dalam 20 detik.",
    coverTitle: "Full alur Tumpu", coverItalic: "dalam 20 detik.",
    screenshot: "/screenshots/02-pos.png",
    videoEngine: "HyperFrames Only",
    videoPrompt: `[HyperFrames Only · 1080x1920 · 20s]\n00–03s: Hook #0B1013: "Alur lengkap operasional cafe dalam 20 detik."\n03–07s: Step 01 Kasir POS (/screenshots/02-pos.png).\n07–11s: Step 02 Layar Dapur KDS (/screenshots/03-kds.png).\n11–15s: Step 03 Auto Potong Stok & HPP (/screenshots/07-stock.png).\n15–18s: Step 04 Dashboard Laba & Z-Report (/screenshots/04-dashboard.png).\n18–20s: End-card #0B1013: tumpu.biz.id.`,
    brief: [
      "100% HyperFrames Fast Product Tour: 4 layar utama Tumpu dalam 20 detik.",
      "Transisi cepat & presisi dengan progress bar nomor step 01–04.",
      "End-card #0B1013 · tumpu.biz.id.",
    ],
    caption: `Dari pelanggan pesan di kasir → tiket muncul di dapur → stok bahan terpotong otomatis → laporan laba langsung jadi. Semua dalam 1 sistem.\n\nMulai gratis atau coba Pro Rp49.000/bulan di tumpu.biz.id.\n\n#demoaplikasi #posindonesia #kasircafe #tumpu`,
  },
  {
    id: "ig-d29", day: 29, dayLabel: "Senin", platform: "Instagram", format: "Carousel (4:5 · 5 Slide)", theme: "light", time: "18:30 WIB",
    title: "FAQ Lengkap Tumpu: Offline, Printer, Multi-Outlet & Keamanan Data",
    hook: "Semua pertanyaan yang paling sering masuk ke DM Tumpu, kami jawab di sini.",
    coverTitle: "FAQ Tumpu:", coverItalic: "Semua jawaban cepat.",
    screenshot: "/screenshots/09-settings.png",
    brief: [
      "Slide 1: FAQ Tumpu — Offline, Printer, Harga & Keamanan.",
      "Slide 2: Q1 — Apakah benar tetap jalan saat Wi-Fi mati? Ya, transaksi tunai & cetak struk tetap jalan.",
      "Slide 3: Q2 — Bisa pakai HP/tablet apa saja? Android, iPhone, iPad, laptop lewat browser/PWA.",
      "Slide 4: Q3 — Ada komisi per transaksi? Rp0 komisi, flat Rp49rb/outlet/bulan untuk Pro.",
      "Slide 5 (Dark CTA): Masih ada pertanyaan lain? Tulis di komentar atau WA di tumpu.biz.id.",
    ],
    caption: `Masih ada keraguan sebelum mulai pakai Tumpu? Kami rangkum 4 pertanyaan yang paling sering masuk ke DM dari owner coffee shop & rumah makan:

Q1: Benar tetap jalan kalau Wi-Fi mati?
→ Ya! Transaksi tunai & cetak struk tetap jalan offline, lalu otomatis sinkron saat internet balik.

Q2: Harus beli mesin kasir khusus?
→ Tidak perlu. Jalan di HP Android, iPhone, iPad, & laptop + printer thermal Bluetooth/USB 58mm & 80mm.

Q3: Ada potongan komisi per transaksi?
→ Rp0 komisi. Starter gratis selamanya (1 outlet, 3 akun), Pro flat Rp49.000/outlet/bulan all-in.

Q4: Bagaimana keamanan data & akses staf?
→ Tiap staf punya PIN personal, akses menu terkunci per peran (RBAC), dan data tersimpan aman di cloud.

Masih ada pertanyaan lain soal outlet kamu? Drop di kolom komentar atau komen "TUMPU" biar kami bantu langsung di DM 👇

#faqtumpu #aplikasikasir #bisniskuliner #poscafe #posresto #tumpu`,
    defaultStatus: "siap",
    assetPath: "docs/marketing/carousels/H29-faq-lengkap-tumpu",
    slideCount: 5,
  },
  {
    id: "ig-d30", day: 30, dayLabel: "Selasa", platform: "Instagram", format: "Reels (9:16 · 18s)", theme: "dark", time: "12:00 WIB",
    title: "Bulan Baru, Outlet Lebih Rapi — Mulai Gratis Hari Ini di tumpu.biz.id",
    hook: "Siap masuk bulan baru dengan kasir, dapur, dan stok yang jauh lebih rapi?",
    coverTitle: "Bulan baru, outlet", coverItalic: "jauh lebih rapi.",
    screenshot: "/screenshots/04-dashboard.png",
    videoEngine: "Google Flow + HyperFrames",
    videoPrompt: `Vertical 9:16 warm handheld documentary video in a sunlit Indonesian specialty coffee shop early in the morning just before opening. A smiling Indonesian cafe owner flips a small wooden door sign, wipes down the clean espresso counter, and places a clean tablet neatly on its stand next to a steaming cup of freshly brewed coffee. Golden morning sunlight slanting across the wooden counter, crisp dust motes in natural light, gentle handheld camera movement, peaceful morning cafe prep ambiance with espresso machine warming up. No readable text on signs or screens, genuine optimistic documentary realism.`,
    brief: [
      "00–05s (Google Flow B-Roll): Owner membuka kedai di pagi hari yang cerah, menaruh tablet kasir dengan rapi.",
      "05–14s (HyperFrames): Recap 4 pilar Tumpu + Offer penutup bulan (Starter Rp0 · Pro Rp49rb/bln All-In).",
      "14–18s (HyperFrames): End-card #0B1013 · Komen TUMPU atau klik tumpu.biz.id.",
    ],
    caption: `Bulan baru adalah waktu terbaik buat berhenti tebak-tebakan soal stok, HPP, dan selisih kasir.\n\nMulai gratis hari ini (Starter Rp0 selamanya) atau aktifkan Trial Pro 14 Hari (Rp49.000/bulan All-In tanpa komisi).\n\nKomen "TUMPU" atau langsung daftar 2 menit di tumpu.biz.id ☕✨\n\n#bulanbaru #poscafe #posresto #bisniskuliner #tumpu`,
  },

  // === MINGGU 2–4: THREADS HARIAN (HARI 8–30) ===
  { id: "th-8", day: 8, dayLabel: "Senin", platform: "Threads", format: "Pagi · Relatable", theme: "light", time: "08:30 WIB", title: "Drama hitung uang laci jam 11 malam pas tutup outlet", hook: "Pancing cerita tutup shift", brief: ["Balas komentar dalam 30 menit."], caption: `Siapa di sini yang kasirnya masih makan waktu 30–60 menit tiap malam cuma buat nyocokin uang laci sama nota?\n\nDi Tumpu, rekap tutup shift (Z-Report) otomatis pisahin tunai, QRIS, dan kas keluar dalam 30 detik → tumpu.biz.id.` },
  { id: "th-9", day: 9, dayLabel: "Selasa", platform: "Threads", format: "Siang · Tips Modal", theme: "light", time: "12:30 WIB", title: "Breakdown modal kasir Rp250rb buat kedai baru", hook: "Tips hemat modal awal", brief: ["Format list singkat."], caption: `Modal setup kasir buat kedai kopi baru nggak harus Rp5 juta:\n• HP/Tablet lama yang sudah ada: Rp0\n• Printer Bluetooth 58mm: ~Rp250rb\n• Tumpu Starter (1 outlet, 3 akun): Rp0 selamanya\n\nSisa dananya mending buat beli biji kopi & promosi pembukaan ☕` },
  { id: "th-10", day: 10, dayLabel: "Rabu", platform: "Threads", format: "Siang · Operasional", theme: "light", time: "12:45 WIB", title: "Momen paling bikin antre: meja rombongan minta split bill", hook: "Relatable jam makan siang", brief: ["Tanpa hard-sell."], caption: `Momen paling bikin kasir keringetan pas jam makan siang: 1 meja isi 6 orang, pindah meja sekali, terus pas bayar minta pisah 6 struk 😅\n\nPastikan aplikasi kasirmu bisa pindah meja & split bill cepat biar antrean belakang gak kabur.` },
  { id: "th-11", day: 11, dayLabel: "Kamis", platform: "Threads", format: "Pagi · Edukasi", theme: "light", time: "09:00 WIB", title: "Beda PB1 10% vs PPN buat pemilik cafe & resto", hook: "Edukasi pajak F&B ringan", brief: ["Shareable untuk owner pemula."], caption: `Quick reminder buat owner F&B baru: pajak di struk cafe/restoran itu namanya PB1 (Pajak Restoran Daerah, umumnya 10%), bukan PPN.\n\nKalau masih dihitung manual pakai kalkulator di kasir, rawan salah total. Set otomatis sekali di kasir jauh lebih aman.` },
  { id: "th-12", day: 12, dayLabel: "Jumat", platform: "Threads", format: "Siang · Keamanan", theme: "dark", time: "13:00 WIB", title: "Bahaya 1 akun kasir dipakai ramai-ramai tanpa PIN personal", hook: "Edukasi kontrol shift", brief: ["Sertakan link tumpu.biz.id."], caption: `Kalau Shift Pagi dan Shift Sore login pakai 1 akun yang sama, begitu uang laci kurang Rp75rb, owner nggak akan tahu itu terjadi di shift siapa.\n\nPakai PIN personal 4 digit: 3 detik ganti shift, laporan terpisah rapi → tumpu.biz.id.` },
  { id: "th-13", day: 13, dayLabel: "Sabtu", platform: "Threads", format: "Pagi · Hot Take", theme: "light", time: "09:30 WIB", title: "Jangan cuma lihat gratisnya, cek biaya add-on tersembunyi", hook: "Opini tajam soal pricing POS", brief: ["Pancing diskusi pengalaman POS."], caption: `Banyak aplikasi kasir iklannya "mulai Rp99rb", tapi pas butuh fitur resep/stok nambah Rp100rb, layar dapur nambah Rp100rb lagi.\n\nMakanya di Tumpu kami bikin simpel: Rp49.000/outlet/bulan sudah All-In tanpa biaya add-on tersembunyi.` },
  { id: "th-14", day: 14, dayLabel: "Minggu", platform: "Threads", format: "Malam · Refleksi", theme: "dark", time: "19:30 WIB", title: "Enaknya hari Minggu pantau omzet tanpa chat kasir di WA", hook: "POV owner tenang", screenshot: "/screenshots/04-dashboard.png", brief: ["Lampirkan /screenshots/04-dashboard.png."], caption: `Salah satu nikmat terbesar merapikan sistem outlet: hari Minggu bisa santai bareng keluarga, tapi tetap tahu omzet, margin kotor, dan menu terlaris langsung dari HP.` },
  { id: "th-15", day: 15, dayLabel: "Senin", platform: "Threads", format: "Pagi · Insight Stok", theme: "light", time: "08:45 WIB", title: "Susu habis duluan padahal penjualan biasa aja? Cek waste bar", hook: "Pancing kesadaran soal waste", brief: ["Nada edukatif."], caption: `Pernah ngerasa stok susu fresh milk habis lebih cepat padahal penjualan hari itu biasa saja?\n\nKalau stok nggak terpotong otomatis dari resep kasir, kita nggak pernah tahu mana yang tumpah, mana yang kelebihan takaran, dan mana yang bocor.` },
  { id: "th-16", day: 16, dayLabel: "Selasa", platform: "Threads", format: "Siang · Studi Kasus", theme: "light", time: "12:30 WIB", title: "Kenapa rumah makan justru paling butuh Layar Dapur (KDS)", hook: "Targeting Persona B (Rumah Makan)", brief: ["Fokus rumah makan & eatery."], caption: `Banyak yang mikir Layar Dapur (KDS) cuma buat coffee shop modern. Padahal rumah makan dengan 15+ meja justru yang paling butuh.\n\nSatu bon kertas hilang di dapur = 1 keluarga nunggu 30 menit lalu nggak balik lagi.` },
  { id: "th-17", day: 17, dayLabel: "Rabu", platform: "Threads", format: "Siang · Operasional", theme: "dark", time: "13:00 WIB", title: "Kurangi teriak-teriak antar bar & dapur saat jam sibuk", hook: "Routing tiket otomatis", screenshot: "/screenshots/03-kds.png", brief: ["Lampirkan /screenshots/03-kds.png."], caption: `Suasana cafe jauh lebih tenang dan profesional saat kasir nggak perlu teriak "Meja 4 es kopi susu dua, nasi goreng satu!"\n\nDi Tumpu, tiket minuman otomatis masuk layar Bar, makanan masuk layar Dapur → tumpu.biz.id.` },
  { id: "th-18", day: 18, dayLabel: "Kamis", platform: "Threads", format: "Pagi · Scale-Up", theme: "light", time: "09:00 WIB", title: "3 tanda sistem outletmu sudah siap buka cabang ke-2", hook: "Checklist ekspansi multi-outlet", brief: ["Format 3 poin ringkas."], caption: `Sebelum buka cabang ke-2, pastikan 3 hal ini sudah beres di cabang pertama:\n1. Resep & HPP sudah terstandar di sistem\n2. Tutup shift kasir jarang selisih\n3. Owner bisa pantau omzet tanpa harus nongkrong di kasir tiap hari.` },
  { id: "th-19", day: 19, dayLabel: "Jumat", platform: "Threads", format: "Siang · Angka", theme: "dark", time: "12:45 WIB", title: "1 void fiktif Rp50rb/hari = Rp1,5 juta hilang per bulan", hook: "Angka tajam soal kebocoran void", brief: ["Singkat & menohok."], caption: `Hitung sederhana: 1 kali void fiktif Rp50.000 per hari = Rp1.500.000 hilang tiap bulan (Rp18 juta/tahun).\n\nMengunci tombol void dengan PIN Manager itu bukan soal pelit—tapi menjaga bisnis tetap hidup.` },
  { id: "th-20", day: 20, dayLabel: "Sabtu", platform: "Threads", format: "Pagi · Freebie", theme: "light", time: "09:00 WIB", title: "Checklist 5 menit sebelum buka & tutup kedai", hook: "Tips praktis akhir pekan", brief: ["Mudah di-bookmark."], caption: `Checklist 5 menit sebelum buka kedai:\n• Cek kertas thermal printer\n• Input modal kas awal di POS\n• Cek stok bahan kritis (susu, es batu, kopi)\n• Pastikan tiap staf login pakai PIN sendiri\n\nSimpel, tapi menyelamatkan dari drama seharian.` },
  { id: "th-21", day: 21, dayLabel: "Minggu", platform: "Threads", format: "Siang · Value", theme: "dark", time: "13:00 WIB", title: "Hemat Rp3 juta/tahun dari biaya langganan POS", hook: "Kontras tahunan yang nyata", brief: ["Sertakan link tumpu.biz.id."], caption: `Bayar POS Rp300rb/bln = Rp3,6 juta/tahun.\nTumpu Pro All-In Rp49rb/bln = Rp588rb/tahun.\n\nSelisih Rp3 juta per outlet tiap tahunnya bisa balik jadi modal promosi atau bonus tim → tumpu.biz.id.` },
  { id: "th-22", day: 22, dayLabel: "Senin", platform: "Threads", format: "Pagi · Objection", theme: "light", time: "08:30 WIB", title: "Alasan #1 owner menunda pindah POS: males input ulang menu", hook: "Trik mulai dengan 5 menu", brief: ["Tawarkan tes 5 menit."], caption: `Alasan paling umum owner menunda pindah dari POS mahal/ribet: "Males input ulang 80 menu."\n\nTriknya: mulai tes pakai 5 menu terlaris dulu (cuma 5 menit) buat nyobain alur kasir & printer Bluetooth. Kalau klik, baru migrasi sisanya.` },
  { id: "th-23", day: 23, dayLabel: "Selasa", platform: "Threads", format: "Siang · Transparansi", theme: "light", time: "12:30 WIB", title: "Kapan cukup pakai Tumpu Starter Gratis Rp0 saja?", hook: "Jujur soal paket gratis", brief: ["Bangun trust tinggi."], caption: `Jujur aja: kalau kedai kamu baru buka, 1 outlet, staf 1–2 orang, dan cuma butuh kasir cepat + struk Bluetooth + mode offline—jangan bayar dulu.\n\nPakai Tumpu Starter Rp0 (gratis selamanya) dulu aja di tumpu.biz.id.` },
  { id: "th-24", day: 24, dayLabel: "Rabu", platform: "Threads", format: "Siang · Tips Hardware", theme: "light", time: "13:00 WIB", title: "Pilih kertas thermal 58mm atau 80mm untuk cafe?", hook: "Edukasi hardware kasir", brief: ["Pancing diskusi owner."], caption: `Tips pilih ukuran printer thermal:\n• 58mm: hemat kertas, printer murah (~Rp250rb), cocok untuk coffee shop & grab-and-go.\n• 80mm: tampilan struk lebih lega & rapi, cocok untuk rumah makan dengan banyak item per meja.\n\nTumpu support keduanya (Bluetooth & USB).` },
  { id: "th-25", day: 25, dayLabel: "Kamis", platform: "Threads", format: "Pagi · Evaluasi", theme: "light", time: "09:00 WIB", title: "Jangan tunggu akhir tahun buat evaluasi menu yang rugi", hook: "Menu engineering sederhana", brief: ["Edukasi margin."], caption: `Cek 5 menu paling jarang laku di outletmu bulan ini. Kalau bahan bakunya khusus dan sering kebuang, menghapus 3 menu itu kadang langsung menaikkan profit bulanan tanpa perlu nambah pelanggan baru.` },
  { id: "th-26", day: 26, dayLabel: "Jumat", platform: "Threads", format: "Siang · Realita F&B", theme: "dark", time: "12:45 WIB", title: "Ramai pengunjung belum tentu sehat cashflow-nya", hook: "Diskusi mendalam soal margin", brief: ["Tanpa hard-sell, fokus insight."], caption: `Pelajaran paling mahal di bisnis F&B: kursi penuh tiap akhir pekan bukan jaminan bisnis sehat kalau HPP tidak terkontrol dan stok bahan baku bocor pelan-pelan.` },
  { id: "th-27", day: 27, dayLabel: "Sabtu", platform: "Threads", format: "Siang · Weekend Ops", theme: "light", time: "13:00 WIB", title: "Pisahkan alur order takeaway biar tamu dine-in gak kesal", hook: "Tips operasional Sabtu", brief: ["Singkat & actionable."], caption: `Pas weekend ramai, pisahkan penandaan order Dine-In vs Takeaway di layar dapur. Satu kesalahan bungkus pesanan tamu meja bisa bikin alur dapur mundur 10 menit.` },
  { id: "th-28", day: 28, dayLabel: "Minggu", platform: "Threads", format: "Malam · Product Tour", theme: "dark", time: "19:30 WIB", title: "Satu alur terhubung: POS → KDS → Stok/HPP → Laba", hook: "Ringkasan sistem Tumpu", brief: ["Sertakan link tumpu.biz.id."], caption: `POS yang bagus nggak cuma nyetak struk—tapi langsung kirim tiket ke dapur, motong stok bahan baku, dan ngasih tahu margin bersih hari itu juga.\n\nLihat demonya di tumpu.biz.id.` },
  { id: "th-29", day: 29, dayLabel: "Senin", platform: "Threads", format: "Malam · Open Q&A", theme: "light", time: "19:30 WIB", title: "Open Q&A akhir bulan: tanya apa saja soal setup Tumpu", hook: "Closing leads akhir bulan", brief: ["Jawab cepat setiap reply."], caption: `Menjelang bulan baru, ada owner cafe atau rumah makan yang berencana rapikan sistem kasir & stok mulai tanggal 1?\n\nDrop pertanyaan soal printer, mode offline, atau migrasi menu di bawah—aku bantu jawab 👇` },
  { id: "th-30", day: 30, dayLabel: "Selasa", platform: "Threads", format: "Pagi · Closing", theme: "dark", time: "09:00 WIB", title: "Bulan baru, operasional lebih rapi — mulai gratis di tumpu.biz.id", hook: "Ajakan mulai tanggal 1", brief: ["Closing kuat dengan CTA jelas."], caption: `Masuk bulan baru dengan sistem yang lebih tenang:\n• Kasir tetap jalan walau Wi-Fi mati\n• Dapur tanpa kertas bon\n• Stok & HPP terpotong otomatis\n• Starter Gratis Rp0 · Pro Rp49rb/bln All-In\n\nDaftar 2 menit di tumpu.biz.id ☕` },
];

export const DM_SCRIPTS = [
  {
    title: "Bio Instagram Resmi",
    text: `Tumpu — Kasir & Operasional Cafe/Resto\n☕ Kasir Offline · Layar Dapur · Stok & HPP Otomatis\n📱 Pakai HP/Tablet Anda · Struk Bluetooth 58/80mm\n⚡ Mulai Gratis (1 Outlet, 3 Akun) · Pro Rp49rb/bln\n👇 Coba demo langsung\ntumpu.biz.id`,
  },
  {
    title: "Bio Threads Resmi",
    text: `Bikin POS cafe & rumah makan yang masuk akal harganya (Rp49rb/bln all-in).\nCatatan harian soal HPP, operasional outlet, & anti-bocor buat owner F&B.\n👉 tumpu.biz.id`,
  },
  {
    title: "Balas Cepat DM — Keyword (TUMPU / HPP / KDS / AMAN)",
    text: `Halo Kak! Makasih sudah mampir ke Tumpu 🙌\nTumpu bisa langsung dipakai di HP, tablet, atau laptop yang sudah ada (support printer thermal Bluetooth 58/80mm).\n\nKakak bisa langsung daftar gratis & coba di sini:\n👉 https://tumpu.biz.id\n\nOutlet Kakak konsepnya coffee shop atau rumah makan? Biar aku bantu rekomenin setup yang paling pas 😊`,
  },
  {
    title: "Balas Cepat DM/WA — Tanya Harga",
    text: `Untuk Tumpu ada 2 pilihan simpel Kak:\n1. Starter (Gratis selamanya) — 1 outlet, total 3 akun (1 Owner + 2 Staf), khusus Kasir POS + Offline + Struk 58/80mm.\n2. Pro (Rp49.000/outlet/bulan) — Multi-Outlet, staf tanpa batas, Layar Dapur (KDS), Potong Stok & HPP otomatis, Dashboard & Laporan CSV.\n\nRp0 komisi per transaksi. Mau coba versi Pro gratis 14 hari dulu Kak?`,
  },
  {
    title: "Objection Handling — Ragu Pindah POS",
    text: `Wajar banget Kak, biasanya paling males input ulang menu ya.\nCukup masukkan 5 menu terlaris dulu buat tes alur kasir & printer Bluetooth (cuma 5 menit). Kalau cocok, nanti tim kami bantu pandu migrasi menu & training staf lewat Manual Book PDF + WA.`,
  },
  {
    title: "Target KPI 7 Hari Pertama",
    text: `• Total Reach (IG + Threads): 5.000 – 15.000 organik\n• Profile Visits: 300 – 800\n• Klik tumpu.biz.id / DM Masuk: 40 – 100\n• Akun Register / Trial Aktif: 15 – 35 outlet\n• Konversi Pro Rp49rb (Bulan 1): 5 – 12 outlet`,
  },
];
