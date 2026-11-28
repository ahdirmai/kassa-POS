// First 7 Ready-to-Post Instagram Carousel Decks (H02, H04, H05, H07, H09, H11, H13)

module.exports = [
  // =========================================================================
  // 1. H02-hpp-kopi-susu (ig-d2 · 6 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d2",
    folder: "H02-hpp-kopi-susu",
    day: 2,
    dayLabel: "Selasa",
    time: "18:30 WIB",
    dmKeyword: "HPP",
    title: "Omzet 3 Juta Sehari Tapi Kas Tipis? Hitung HPP Kopi Susu",
    themeLabel: "Light Editorial + Dark CTA",
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
    firstComment: `Boleh tulis di kolom komentar: di outlet kamu sekarang masih hitung stok pakai Excel mingguan, atau sudah auto-potong dari kasir? 👇`,
    stories: [
      "Slide 1 (Poll): \"Jujur, stok susu & kopi di outlet pernah habis lebih cepat dari catatan penjualan?\" [Sering banget 😅 / Aman terkendali ✅]",
      "Slide 2 (Teaser): Share Slide 3 (Breakdown HPP Rp7.450) dengan stiker \"Cek hitungan lengkapnya di feed terbaru 👆\"",
      "Slide 3 (CTA): Link sticker ke tumpu.biz.id — \"Coba Trial Pro 14 Hari · Auto potong stok & HPP\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "EDUKASI BISNIS F&B",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Omzet 3 juta sehari, tapi akhir bulan <span class="serif">uangnya tipis?</span></h1>
            <p class="lead">Ramai di kasir belum tentu sehat di rekening. Ini 2 kebocoran HPP yang paling sering bikin owner kaget di akhir bulan.</p>
            <div class="metric-split">
              <div class="metric-card">
                <div class="mono-label">MARGIN DI ATAS KERTAS</div>
                <div class="metric-big good">73%</div>
                <div class="metric-sub">Hitungan resep ideal per cup</div>
              </div>
              <div class="metric-card">
                <div class="mono-label">SELISIH STOK NYATA</div>
                <div class="metric-big bad">-12%</div>
                <div class="metric-sub">Waste, tumpah &amp; takaran meleset</div>
              </div>
            </div>
            <div class="callout-bar">
              <span class="dot teal"></span>
              <span>Studi kasus nyata: <strong>Es Kopi Susu Aren (Rp28.000)</strong></span>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "KEBOCORAN PERTAMA",
        rightTag: "HPP & TAKARAN",
        html: `
          <div class="step-num">01</div>
          <h2 class="h2-slide">Beli bahan kiloan, tapi takaran per cup <span class="serif">dikira-kira.</span></h2>
          <p class="body">Owner beli biji kopi 1 kg dan susu 1 liter, tapi tidak pernah mencatat gramasi pasti per menu. Akhirnya modal per cup cuma tebakan.</p>
          <div class="flow-card">
            <div class="flow-node">
              <div class="mono-label">PEMBELIAN SUPPLIER</div>
              <div class="flow-val">1 kg Beans · 1 L Susu</div>
            </div>
            <div class="flow-arrow">──▶</div>
            <div class="flow-node warn">
              <div class="mono-label">HASIL PENJUALAN</div>
              <div class="flow-val">??? Cup Terjual</div>
            </div>
          </div>
          <div class="note-card">
            <strong>Fakta lapangan:</strong> Kelebihan tuang 20 ml susu &amp; 5 ml sirup per cup × 100 cup/hari = <strong>Rp350rb+ hilang diam-diam tiap minggu.</strong>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "CONTOH HITUNGAN NYATA",
        rightTag: "ES KOPI SUSU",
        html: `
          <h2 class="h2-slide">Breakdown HPP <span class="serif">Es Kopi Susu Aren</span></h2>
          <div class="card-surface">
            <div class="card-head-row">
              <div>
                <div class="mono-label">HARGA JUAL MENU</div>
                <div class="price-inline">Rp28.000 <span class="muted-sm">/ cup</span></div>
              </div>
              <span class="pill good">MARGIN KOTOR 73%</span>
            </div>
            <div class="data-table">
              <div class="data-row"><span>Espresso Blend</span><span class="mono muted">18 gr</span><span class="mono bold">Rp3.600</span></div>
              <div class="data-row"><span>Fresh Milk</span><span class="mono muted">150 ml</span><span class="mono bold">Rp2.700</span></div>
              <div class="data-row"><span>Sirup Gula Aren</span><span class="mono muted">25 ml</span><span class="mono bold">Rp1.150</span></div>
              <div class="data-row total"><span>Total HPP Bahan / Cup</span><span class="mono">26,6%</span><span class="mono teal">Rp7.450</span></div>
            </div>
          </div>
          <p class="body-sm">Margin kotor <strong>Rp20.550 / cup</strong> baru benar-benar aman kalau setiap transaksi langsung memotong stok sesuai resep ini.</p>
        `,
      },
      {
        theme: "light",
        eyebrow: "KEBOCORAN KEDUA",
        rightTag: "STOK BAHAN",
        html: `
          <div class="step-num">02</div>
          <h2 class="h2-slide">Stok cuma dicek <span class="serif">seminggu sekali</span> di Excel.</h2>
          <p class="body">Kalau stock opname baru dilakukan hari Minggu malam, kamu tidak pernah tahu hari apa susu tumpah, bahan dipakai berlebih, atau ada selisih tak wajar.</p>
          <div class="compare-grid">
            <div class="card-surface compact">
              <span class="pill bad">CARA LAMA</span>
              <div class="card-title">Excel Mingguan</div>
              <p class="card-text">Baru sadar bahan habis duluan setelah uang belanja membengkak.</p>
            </div>
            <div class="card-surface compact accent-border">
              <span class="pill good">CARA RAPI</span>
              <div class="card-title">Auto-Potong Resep</div>
              <p class="card-text">Setiap 1 cup lunas di kasir, gramasi kopi &amp; susu langsung berkurang realtime.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "SOLUSI DI TUMPU",
        rightTag: "AUTO HPP & STOK",
        html: `
          <h2 class="h2-slide">Transaksi lunas, stok <span class="serif">terpotong otomatis.</span></h2>
          <p class="body-sm">Input belanja tetap pakai kg/liter/botol, resep pakai gram/ml. Tumpu otomatis konversi satuan dan hitung HPP per menu.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">pos.tumpu.biz.id/stock</span>
            </div>
            <img class="device-img" src="{{IMG:07-stock.png}}" alt="Stok & HPP Otomatis Tumpu" />
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "MULAI MINGGU INI",
        rightTag: "TUMPU PRO",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">TRIAL GRATIS 14 HARI</span>
            <h1 class="h1-cover dark">Rapikan stok &amp; HPP <span class="serif-dark">tanpa ribet Excel.</span></h1>
            <p class="lead dark">Sudah termasuk Kasir Offline, Layar Dapur (KDS), Multi-Outlet, dan potong stok resep otomatis. Rp0 komisi transaksi.</p>
            <div class="cta-btn">Pro Rp49.000/outlet/bln · tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"HPP"</strong> di bawah untuk link demo langsung ke DM</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 2. H04-anti-bocor-kasir (ig-d4 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d4",
    folder: "H04-anti-bocor-kasir",
    day: 4,
    dayLabel: "Kamis",
    time: "18:30 WIB",
    dmKeyword: "AMAN",
    title: "3 Celah Kebocoran Kasir & Kontrol Akses Staf",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Hal paling nggak enak jadi owner cafe itu bukan pas lagi sepi—tapi pas harus curiga sama tim sendiri gara-gara uang laci sering selisih Rp50rb–Rp100rb.

Bisnis F&B yang sehat nggak bisa cuma mengandalkan "rasa percaya". Harus ada sistem yang melindungi owner sekaligus bikin staf yang jujur kerja lebih tenang.

Geser buat cek 3 celah kasir yang paling sering luput:
1. Void / hapus pesanan tanpa izin Manager
2. 1 akun kasir dipakai ramai-ramai lintas shift
3. Kasir bisa intip omzet harian & edit data stok

Di Tumpu, tiap staf login pakai PIN personal dan akses layarnya terkunci sesuai peran.

Komen "AMAN" kalau mau lihat demo kontrol akses staf di Tumpu, atau langsung coba di tumpu.biz.id.

#manajemencafe #kasirpintar #antifraud #bisnisfnb #ownerresto #tumpu`,
    firstComment: `Di outlet kamu sekarang, kalau ada pelanggan batalin order setelah struk tercetak, kasir bisa langsung hapus sendiri atau wajib izin Manager? Share SOP kamu ya 👇`,
    stories: [
      "Slide 1 (Question Box): \"Pernah ngalamin uang laci kasir selisih pas tutup shift? Biasanya paling sering gara-gara apa?\"",
      "Slide 2 (Teaser): Repost Slide 1 + teks \"3 celah kasir yang sering nggak kelihatan owner 👀\"",
      "Slide 3 (Demo): Tampilkan screenshot RBAC + link tumpu.biz.id",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "KONTROL OUTLET",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">3 celah kebocoran kasir <span class="serif">yang sering luput.</span></h1>
            <p class="lead">Sistem yang rapi bukan tanda tidak percaya staf—tapi melindungi owner sekaligus menjaga tim yang jujur tetap nyaman bekerja.</p>
            <div class="list-card">
              <div class="list-row"><span class="badge-num bad">01</span><span>Void atau hapus pesanan tanpa izin Manager</span></div>
              <div class="list-row"><span class="badge-num bad">02</span><span>1 akun kasir dipakai ramai-ramai lintas shift</span></div>
              <div class="list-row"><span class="badge-num bad">03</span><span>Kasir bebas intip omzet harian &amp; ubah stok</span></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "CELAH PERTAMA",
        rightTag: "ANTI-VOID",
        html: `
          <span class="pill bad">CELAH 01</span>
          <h2 class="h2-slide">Void / hapus pesanan <span class="serif">tanpa izin owner.</span></h2>
          <p class="body">Pelanggan sudah bayar tunai, struk tercetak, lalu pesanan dibatalkan sepihak di sistem tanpa jejak. 1 void fiktif Rp50rb/hari = <strong>Rp1,5 juta hilang per bulan.</strong></p>
          <div class="solution-card">
            <div class="mono-label teal">SOLUSI DI TUMPU</div>
            <div class="sol-title">Wajib PIN Manager &amp; Audit Log Permanen</div>
            <p class="sol-desc">Setiap pembatalan atau diskon khusus wajib otorisasi PIN Manager/Owner dan tercatat otomatis lengkap dengan jam &amp; nama staf.</p>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "CELAH KEDUA",
        rightTag: "SHIFT PIN",
        html: `
          <span class="pill bad">CELAH 02</span>
          <h2 class="h2-slide">Semua staf pakai <span class="serif">1 akun yang sama.</span></h2>
          <p class="body">Begitu Shift Pagi dan Shift Sore berbagi login yang sama, saat laci kasir selisih Rp75.000 di malam hari, owner tidak pernah tahu terjadi di shift siapa.</p>
          <div class="solution-card">
            <div class="mono-label teal">SOLUSI DI TUMPU</div>
            <div class="sol-title">PIN Personal 4–6 Digit per Staf</div>
            <p class="sol-desc">Ganti shift cukup 3 detik lewat keypad PIN. Rekap tunai &amp; Z-Report Shift Pagi dan Shift Sore otomatis terpisah rapi.</p>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "CELAH KETIGA",
        rightTag: "RBAC AKSES",
        html: `
          <span class="pill bad">CELAH 03</span>
          <h2 class="h2-slide">Kasir bisa intip omzet &amp; <span class="serif">edit data stok.</span></h2>
          <div class="rbac-mini">
            <div class="rbac-row"><strong>Kasir POS</strong><span class="pill good">TERBUKA</span></div>
            <div class="rbac-row"><span>Laporan Omzet, HPP &amp; Edit Stok</span><span class="pill bad">TERKUNCI</span></div>
          </div>
          <div class="device-frame compact">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">pos.tumpu.biz.id/staff-roles</span>
            </div>
            <img class="device-img tall-sm" src="{{IMG:08-rbac.png}}" alt="Kontrol Akses Peran Tumpu" />
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "TENANG TINGGALKAN OUTLET",
        rightTag: "TUMPU",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">KONTROL AKSES PERAN</span>
            <h1 class="h1-cover dark">Sistem rapi bikin staf nyaman, <span class="serif-dark">owner tenang.</span></h1>
            <p class="lead dark">Atur akses Owner, Manager, Kasir, dan Dapur dalam 1 menit. Mulai gratis (1 outlet, 3 akun) atau Pro Rp49rb/bln.</p>
            <div class="cta-btn">Amankan Outlet di tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"AMAN"</strong> biar kami kirim demo kontrol staf ke DM</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 3. H05-harga-pro-49rb (ig-d5 · 3 slides · Full Dark Luxury)
  // =========================================================================
  {
    id: "ig-d5",
    folder: "H05-harga-pro-49rb",
    day: 5,
    dayLabel: "Jumat",
    time: "12:00 WIB",
    dmKeyword: "PRO",
    title: "Offer Anchor: All-In Cuma Rp49.000/Bulan (~Rp1.600/Hari)",
    themeLabel: "Full Dark Luxury (#0B1013 + Warm Brass)",
    caption: `Banyak owner cafe menunda pakai sistem stok & layar dapur karena di aplikasi lain biasanya kena biaya add-on Rp150rb–Rp300rb lagi per bulan.

Padahal jualan kopi Rp25 ribuan, masa marginnya habis cuma buat bayar langganan aplikasi?

Di Tumpu Pro, semuanya sudah jadi satu:
• Rp49.000 / outlet / bulan (~Rp1.600 / hari)
• Rp0 komisi transaksi
• Sudah termasuk POS Offline, Layar Dapur (KDS), Auto Stok & HPP, Kontrol Staf, dan Multi-Outlet

Mau coba tanpa keluar uang dulu? Ada paket Starter Rp0 selamanya (1 outlet, 3 akun, khusus POS).

Komen "PRO" untuk link Trial Gratis 14 Hari, atau klik tumpu.biz.id di bio.

#aplikasikasirmurah #posindonesia #umkmkuliner #bisniskopi #poscafe #tumpu`,
    firstComment: `Harga 2 gelas es kopi susu per bulan untuk sistem kasir + dapur + stok yang bikin tidur lebih nyenyak ☕ Cek detailnya di tumpu.biz.id`,
    stories: [
      "Slide 1 (Dark Editorial): Repost Slide 1 — \"Rp1.600/hari sudah dapat POS Offline + KDS + Auto Stok & HPP\"",
      "Slide 2 (Link CTA): \"Pilih Starter Rp0 atau Trial Pro 14 Hari\" + link sticker tumpu.biz.id",
    ],
    slides: [
      {
        theme: "dark",
        eyebrow: "TANPA KOMISI TRANSAKSI",
        rightTag: "SWIPE →",
        html: `
          <div class="luxury-hero">
            <span class="pill gold-dark">TUMPU PRO · ALL-IN</span>
            <div class="big-price">Rp49rb</div>
            <div class="price-meta">/ OUTLET / BULAN &nbsp;·&nbsp; ~Rp1.600 / HARI</div>
            <div class="gold-divider"></div>
            <h1 class="h1-lux">Aplikasi kasir all-in, <span class="serif-dark">seharga 2 gelas kopi.</span></h1>
            <p class="lead dark">Tanpa biaya tambahan untuk layar dapur, stok &amp; HPP otomatis, kontrol staf, maupun multi-outlet.</p>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "SEMUA SUDAH TERMASUK",
        rightTag: "ALL-IN",
        html: `
          <h2 class="h2-slide dark">Tanpa biaya add-on <span class="serif-dark">tersembunyi.</span></h2>
          <div class="dark-checklist">
            <div class="dark-check-item"><span class="gold-check">✓</span><span><strong>Kasir POS + Mode Offline Tunai</strong> — tetap jalan saat Wi-Fi mati</span></div>
            <div class="dark-check-item"><span class="gold-check">✓</span><span><strong>Layar Dapur (KDS) Realtime</strong> — routing Bar &amp; Dapur + timer SLA</span></div>
            <div class="dark-check-item"><span class="gold-check">✓</span><span><strong>Stok Bahan Baku, Resep &amp; HPP</strong> — terpotong otomatis per cup</span></div>
            <div class="dark-check-item"><span class="gold-check">✓</span><span><strong>Multi-Outlet &amp; Kontrol Akses (RBAC)</strong> — PIN personal tiap staf</span></div>
            <div class="dark-check-item"><span class="gold-check">✓</span><span><strong>Struk Thermal 58/80mm</strong> — Bluetooth &amp; USB dari HP/Tablet/Laptop</span></div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "PILIH SESUAI SKALA",
        rightTag: "TRANSPARAN",
        html: `
          <h2 class="h2-slide dark">Mulai gratis, <span class="serif-dark">upgrade kapan saja.</span></h2>
          <div class="tier-grid">
            <div class="tier-card">
              <div class="mono-label muted-dark">STARTER</div>
              <div class="tier-price">Rp0</div>
              <div class="tier-period">Gratis selamanya</div>
              <div class="tier-list">
                <div>• 1 Outlet · Total 3 Akun</div>
                <div>• Khusus Kasir POS &amp; Offline</div>
                <div>• Struk Thermal 58/80mm</div>
              </div>
            </div>
            <div class="tier-card pro">
              <div class="mono-label gold">PRO · POPULER</div>
              <div class="tier-price gold">Rp49rb</div>
              <div class="tier-period">/ outlet / bulan</div>
              <div class="tier-list">
                <div>• Multi-Outlet &amp; Staf Unlimited</div>
                <div>• Layar Dapur (KDS) + Stok &amp; HPP</div>
                <div>• Dashboard Laba &amp; Export CSV</div>
              </div>
            </div>
          </div>
          <div class="cta-btn">Daftar Gratis di tumpu.biz.id</div>
          <div class="cta-sub">Komen <strong>"PRO"</strong> untuk aktifkan Trial Gratis 14 Hari</div>
        `,
      },
    ],
  },

  // =========================================================================
  // 4. H07-recap-4-langkah (ig-d7 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d7",
    folder: "H07-recap-4-langkah",
    day: 7,
    dayLabel: "Minggu",
    time: "18:30 WIB",
    dmKeyword: "TUMPU",
    title: "Recap 4 Langkah: Rapikan Outlet Mulai Senin Besok",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Besok sudah Senin lagi. Saatnya pindah dari bon kertas yang sering hilang & rekap Excel manual ke satu alur operasional yang rapi dari depan sampai belakang.

4 langkah sederhana di Tumpu:
01. Kasir 1-tap (tetap jalan saat Wi-Fi mati)
02. Tiket otomatis muncul di Layar Dapur (KDS)
03. Stok bahan baku & HPP terpotong otomatis
04. Dashboard Owner & Z-Report tutup shift dalam 30 detik

Setup awalnya cuma butuh 5 menit—cukup masukkan 5 menu terlaris dulu buat tes langsung dari HP atau tablet kamu.

Ada pertanyaan soal printer Bluetooth atau PB1? Komen "TUMPU" atau langsung daftar gratis di tumpu.biz.id.

#bisniskuliner #poscafe #posresto #manajemenoutlet #operasionalcafe #tumpu`,
    firstComment: `Siap masuk hari Senin dengan sistem kasir yang jauh lebih tenang? Drop pertanyaan kamu soal setup Tumpu di komentar ya 👇`,
    stories: [
      "Slide 1 (Sunday Check-in): \"Minggu sore enaknya siapin outlet buat Senin besok. Sudah rapi kasir & stoknya?\"",
      "Slide 2 (Swipe Recap): Share Slide 1 (Alur 01→04) ke Story",
      "Slide 3 (CTA): Link sticker tumpu.biz.id — \"Setup 5 menit, mulai Rp0\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "4 LANGKAH OPERASIONAL",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Rapikan outlet kamu <span class="serif">mulai Senin besok.</span></h1>
            <p class="lead">Satu alur kerja terhubung—dari pelanggan pesan di kasir sampai laporan tutup shift otomatis di tangan owner.</p>
            <div class="stepper-grid">
              <div class="step-pill"><span class="mono teal">01</span><strong>Kasir POS</strong><small>Offline-ready</small></div>
              <div class="step-pill"><span class="mono teal">02</span><strong>Layar Dapur</strong><small>Tanpa bon kertas</small></div>
              <div class="step-pill"><span class="mono teal">03</span><strong>Stok &amp; HPP</strong><small>Potong otomatis</small></div>
              <div class="step-pill"><span class="mono teal">04</span><strong>Z-Report</strong><small>Tutup shift 30 dtk</small></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "LANGKAH 01 & 02",
        rightTag: "DEPAN → DAPUR",
        html: `
          <div class="dual-shot">
            <div class="shot-card">
              <div class="shot-head"><span class="mono teal bold">01 · KASIR POS (OFFLINE-READY)</span><span class="pill good">1-TAP</span></div>
              <img class="shot-img" src="{{IMG:02-pos.png}}" alt="Kasir POS Tumpu" />
            </div>
            <div class="shot-card">
              <div class="shot-head"><span class="mono teal bold">02 · LAYAR DAPUR (KDS KANBAN)</span><span class="pill warn">REALTIME</span></div>
              <img class="shot-img" src="{{IMG:03-kds.png}}" alt="Layar Dapur KDS Tumpu" />
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "LANGKAH 03 & 04",
        rightTag: "STOK → LAPORAN",
        html: `
          <div class="dual-shot">
            <div class="shot-card">
              <div class="shot-head"><span class="mono teal bold">03 · STOK &amp; HPP TERPOTONG OTOMATIS</span><span class="pill good">AUTO</span></div>
              <img class="shot-img" src="{{IMG:07-stock.png}}" alt="Stok & HPP Tumpu" />
            </div>
            <div class="shot-card">
              <div class="shot-head"><span class="mono teal bold">04 · DASHBOARD OWNER &amp; Z-REPORT</span><span class="pill teal-soft">LIVE</span></div>
              <img class="shot-img" src="{{IMG:04-dashboard.png}}" alt="Dashboard Owner Tumpu" />
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "SETUP CEPAT",
        rightTag: "5 MENIT",
        html: `
          <h2 class="h2-slide">Cuma butuh 5 menit <span class="serif">buat mulai:</span></h2>
          <div class="split-mobile">
            <div class="list-card tight">
              <div class="list-row"><span class="badge-num teal">01</span><span>Buka <strong>tumpu.biz.id</strong> dari HP atau tablet</span></div>
              <div class="list-row"><span class="badge-num teal">02</span><span>Input 5 menu terlaris outlet dulu</span></div>
              <div class="list-row"><span class="badge-num teal">03</span><span>Sambung printer thermal Bluetooth</span></div>
              <div class="list-row"><span class="badge-num teal">04</span><span>Langsung tes transaksi pertama</span></div>
            </div>
            <div class="phone-frame">
              <img class="phone-img" src="{{IMG:10-pos-mobile.png}}" alt="Tumpu Mobile POS" />
            </div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "SIAP UNTUK SENIN?",
        rightTag: "TUMPU",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">TANPA KARTU KREDIT</span>
            <h1 class="h1-cover dark">Mulai gratis hari ini. <span class="serif-dark">Outlet rapi besok.</span></h1>
            <p class="lead dark">Starter Rp0 selamanya (1 Outlet, 3 Akun) atau Pro Rp49.000/bulan (Multi-Outlet, KDS, Stok &amp; HPP).</p>
            <div class="cta-btn">Daftar 2 Menit di tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"TUMPU"</strong> atau chat WA di link bio</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 5. H09-setup-kasir-250rb (ig-d9 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d9",
    folder: "H09-setup-kasir-250rb",
    day: 9,
    dayLabel: "Selasa",
    time: "18:30 WIB",
    dmKeyword: "PRINTER",
    title: "Setup Kasir Modal Rp250rb: HP Lama + Printer Thermal Bluetooth",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Buat yang baru mau buka coffee shop, kedai minuman, atau rumah makan bulan ini: jangan buru-buru habis Rp4–6 juta cuma buat beli mesin kasir khusus.

Modal setup kasir yang rapi sebenarnya cukup Rp250 ribuan:
• HP Android / iPad bekas yang sudah ada: Rp0
• Printer Thermal Bluetooth 58mm + kertas: ~Rp250.000
• Tumpu Starter (1 outlet, 3 akun, offline POS): Rp0 selamanya

Sisa modal Rp4,5 juta lebih baik dipakai buat beli biji kopi, bahan baku berkualitas, dan promosi pembukaan.

Simpan carousel ini buat checklist buka outlet kamu 📌
Bingung pilih merek printer Bluetooth yang awet? Komen "PRINTER" biar kami kirim rekomendasinya ke DM!

#bukacafe #modalusaha #printerbluetooth #posumkm #tipsbisniskopi #tumpu`,
    firstComment: `Teman-teman owner F&B, printer thermal Bluetooth 58mm/80mm merek apa yang paling awet di outlet kalian? Bantu share buat calon owner baru ya 👇`,
    stories: [
      "Slide 1 (Poll): \"Pas baru buka usaha F&B, kasir pertama kamu pakai apa?\" [Mesin POS jutaan / HP + Printer Bluetooth]",
      "Slide 2 (Share Feed): Share Slide 1 (Setup Kasir Modal Rp250rb) — \"Hemat Rp4,5 juta di bulan pertama!\"",
      "Slide 3 (CTA): Link tumpu.biz.id — \"Jalan di HP, Tablet & Laptop\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "TIPS HEMAT MODAL",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Setup kasir kedai baru modal <span class="serif">cuma Rp250rb.</span></h1>
            <p class="lead">Jangan buru-buru keluar Rp4–6 juta buat beli mesin kasir khusus. Ini rincian setup hemat tapi tetap profesional.</p>
            <div class="card-surface">
              <div class="data-table">
                <div class="data-row"><span>HP / Tablet yang sudah ada</span><span class="mono good bold">Rp0</span></div>
                <div class="data-row"><span>Printer Thermal Bluetooth 58mm</span><span class="mono bold">~Rp250.000</span></div>
                <div class="data-row"><span>Tumpu Starter (1 Outlet, 3 Akun)</span><span class="mono good bold">Rp0</span></div>
                <div class="data-row total"><span>Total Modal Kasir Awal</span><span class="mono teal">~Rp250.000</span></div>
              </div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERANGKAT 01",
        rightTag: "HARDWARE Rp0",
        html: `
          <div class="step-num">01</div>
          <h2 class="h2-slide">Pakai HP Android atau iPad <span class="serif">yang sudah ada.</span></h2>
          <p class="body">Tumpu berbasis web &amp; PWA ringan—langsung jalan di browser HP Android, iPhone, iPad, maupun laptop tanpa harus beli perangkat terkunci.</p>
          <div class="pill-row">
            <span class="chip">Android</span>
            <span class="chip">iPhone / iPad</span>
            <span class="chip">Laptop / PC</span>
            <span class="chip teal-chip">Mode Offline Ready</span>
          </div>
          <div class="note-card">
            <strong>Keuntungan:</strong> Jika suatu saat perlu ganti perangkat, cukup login di HP lain—semua data menu &amp; transaksi aman di cloud.
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERANGKAT 02",
        rightTag: "PRINTER THERMAL",
        html: `
          <div class="step-num">02</div>
          <h2 class="h2-slide">Printer Thermal Bluetooth <span class="serif">58mm (~Rp250rb).</span></h2>
          <p class="body">Tanpa tinta, cukup isi ulang kertas thermal Rp3.000-an per roll. Tumpu mendukung standar 58mm maupun 80mm (Bluetooth &amp; USB).</p>
          <div class="compare-grid">
            <div class="card-surface compact">
              <span class="pill teal-soft">58MM · HEMAT</span>
              <div class="card-title">Coffee Shop &amp; Booth</div>
              <p class="card-text">Ukuran ringkas, kertas hemat, pas untuk order 1–5 item cepat.</p>
            </div>
            <div class="card-surface compact">
              <span class="pill warn">80MM · LEGA</span>
              <div class="card-title">Rumah Makan / Resto</div>
              <p class="card-text">Tulisan lebih lega, rapi untuk pesanan meja rombongan banyak item.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERANGKAT 03",
        rightTag: "SOFTWARE Rp0",
        html: `
          <h2 class="h2-slide">Atur struk &amp; printer <span class="serif">dalam 1 menit.</span></h2>
          <p class="body-sm">Pasangkan printer Bluetooth di Pengaturan Tumpu, isi nama &amp; alamat kedai, struk langsung tercetak rapi.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">pos.tumpu.biz.id/settings</span>
            </div>
            <img class="device-img" src="{{IMG:09-settings.png}}" alt="Pengaturan Printer Tumpu" />
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "HEMAT Rp4,5 JUTA DI BULAN PERTAMA",
        rightTag: "TUMPU STARTER",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">STARTER Rp0 SELAMANYA</span>
            <h1 class="h1-cover dark">Modal hemat buat kasir, <span class="serif-dark">fokus ke rasa &amp; promo.</span></h1>
            <p class="lead dark">Starter gratis untuk 1 outlet (3 akun, POS Offline + Struk 58/80mm). Upgrade ke Pro Rp49rb/bln kapan saja.</p>
            <div class="cta-btn">Mulai Gratis di tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"PRINTER"</strong> untuk daftar printer Bluetooth yang cocok</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 6. H11-pb1-service-charge (ig-d11 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d11",
    folder: "H11-pb1-service-charge",
    day: 11,
    dayLabel: "Kamis",
    time: "18:30 WIB",
    dmKeyword: "PB1",
    title: "Cara Hitung PB1 10% & Service Charge Otomatis di Struk Cafe",
    themeLabel: "Light Editorial + Dark CTA",
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
    firstComment: `Di outlet kamu, harga menu di buku menu sudah termasuk pajak (inklusif) atau belum termasuk (eksklusif)? Tulis di bawah ya 👇`,
    stories: [
      "Slide 1 (Quiz): \"Pajak 10% di struk cafe/restoran itu namanya...\" [A. PPN / B. PB1 ✅]",
      "Slide 2 (Teaser): Share Slide 3 (Contoh Struk Rapi Subtotal + Service + PB1) ke Story",
      "Slide 3 (CTA): Link tumpu.biz.id — \"Atur pajak otomatis sekali klik\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "PANDUAN STRUK F&B",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">PB1 10% &amp; Service Charge <span class="serif">otomatis di struk.</span></h1>
            <p class="lead">Jangan sampai kasir masih hitung pajak pakai kalkulator manual—rawan salah total dan bikin laporan akhir bulan berantakan.</p>
            <div class="compare-grid">
              <div class="card-surface compact">
                <span class="pill teal-soft">PB1 · UMUMNYA 10%</span>
                <div class="card-title">Pajak Restoran Daerah</div>
                <p class="card-text">Disetor ke Pemda setempat (bukan PPN). Wajib dipisahkan di laporan.</p>
              </div>
              <div class="card-surface compact">
                <span class="pill warn">SERVICE · 5%</span>
                <div class="card-title">Biaya Layanan</div>
                <p class="card-text">Opsional untuk resto/cafe dine-in, dikelola untuk layanan &amp; tim.</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "ATUR SEKALI SAJA",
        rightTag: "PENGATURAN OUTLET",
        html: `
          <h2 class="h2-slide">Aktifkan sekali di <span class="serif">Pengaturan Outlet.</span></h2>
          <p class="body-sm">Cukup tentukan persentase PB1 &amp; Service Charge di Tumpu. Setiap transaksi langsung terhitung rapi di layar kasir &amp; struk.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">pos.tumpu.biz.id/settings/tax</span>
            </div>
            <img class="device-img" src="{{IMG:09-settings.png}}" alt="Pengaturan Pajak PB1 Tumpu" />
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "CONTOH STRUK RAPI",
        rightTag: "URUTAN HITUNG",
        html: `
          <h2 class="h2-slide">Contoh hitungan <span class="serif">struk yang benar.</span></h2>
          <div class="receipt-card">
            <div class="receipt-head">TUMPU COFFEE &amp; EATERY · MEJA 04</div>
            <div class="receipt-line"><span>2× Es Kopi Susu Aren</span><span class="mono">Rp56.000</span></div>
            <div class="receipt-line"><span>1× Nasi Goreng Spesial</span><span class="mono">Rp44.000</span></div>
            <div class="receipt-dash"></div>
            <div class="receipt-line"><span>Subtotal</span><span class="mono">Rp100.000</span></div>
            <div class="receipt-line muted"><span>Service Charge (5%)</span><span class="mono">Rp5.000</span></div>
            <div class="receipt-line muted"><span>PB1 (10% dari Rp105.000)</span><span class="mono">Rp10.500</span></div>
            <div class="receipt-dash"></div>
            <div class="receipt-line grand"><span>GRAND TOTAL</span><span class="mono teal">Rp115.500</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PILIHAN MODE HARGA",
        rightTag: "INKLUSIF / EKSKLUSIF",
        html: `
          <h2 class="h2-slide">Inklusif vs Eksklusif, <span class="serif">mana yang cocok?</span></h2>
          <div class="list-card">
            <div class="mode-block">
              <div class="mode-head"><strong>Mode Inklusif (Harga Nett)</strong><span class="pill good">COFFEE SHOP</span></div>
              <p class="card-text">Harga di buku menu sudah termasuk pajak. Pelanggan bayar angka bulat persis seperti yang tertulis (mis. Rp28.000 nett).</p>
            </div>
            <div class="mode-block">
              <div class="mode-head"><strong>Mode Eksklusif (+ Pajak)</strong><span class="pill teal-soft">RESTO / BISTRO</span></div>
              <p class="card-text">PB1 10% &amp; Service ditambahkan di bawah subtotal pada struk. Cocok untuk rumah makan &amp; bistro dine-in.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "BEBAS HITUNG MANUAL",
        rightTag: "TUMPU",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">STRUK &amp; LAPORAN RAPI</span>
            <h1 class="h1-cover dark">Atur pajak sekali, <span class="serif-dark">beres setiap hari.</span></h1>
            <p class="lead dark">Total PB1 &amp; Service Charge otomatis terpisah di laporan CSV bulanan. Mulai gratis di Starter Rp0 atau Pro Rp49rb/bln.</p>
            <div class="cta-btn">Coba Gratis di tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"PB1"</strong> kalau mau panduan setup struk outlet kamu</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 7. H13-5-kesalahan-pilih-pos (ig-d13 · 6 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d13",
    folder: "H13-5-kesalahan-pilih-pos",
    day: 13,
    dayLabel: "Sabtu",
    time: "17:30 WIB",
    dmKeyword: "DEMO",
    title: "5 Kesalahan Fatal Owner Baru Saat Pilih Aplikasi Kasir",
    themeLabel: "Light Editorial + Dark CTA",
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
    firstComment: `Dari 5 poin di atas, mana yang paling sering bikin owner F&B kaget setelah terlanjur langganan? Nomor 1 atau nomor 2? 👇`,
    stories: [
      "Slide 1 (Hook): \"Mau langganan aplikasi kasir? Stop dulu, cek 5 jebakan ini sebelum transfer 👇\"",
      "Slide 2 (Teaser): Share Slide 2 (Jebakan Biaya Add-On) ke Story",
      "Slide 3 (CTA): Link tumpu.biz.id — \"Pro Rp49rb/bln All-In · Rp0 Komisi\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "PANDUAN OWNER BARU",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">5 kesalahan fatal saat pilih <span class="serif">aplikasi kasir.</span></h1>
            <p class="lead">Jangan sampai baru 3 bulan buka outlet, malah boncos biaya add-on dan pusing migrasi ulang dari awal.</p>
            <div class="callout-bar">
              <span class="dot bad"></span>
              <span>Cek daftar ini <strong>sebelum</strong> langganan tahunan atau beli mesin POS.</span>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "KESALAHAN 01",
        rightTag: "BIAYA ADD-ON",
        html: `
          <div class="step-num">01</div>
          <h2 class="h2-slide">Terjebak harga awal, tapi <span class="serif">kena add-on mahal.</span></h2>
          <p class="body">Iklannya mulai Rp99rb/bln, tapi begitu butuh potong stok resep tambah Rp100rb, layar dapur tambah Rp100rb lagi.</p>
          <div class="card-surface">
            <div class="data-table">
              <div class="data-row"><span>Paket Dasar POS</span><span class="mono muted">Rp150.000/bln</span></div>
              <div class="data-row"><span>Add-on Stok &amp; Resep</span><span class="mono bad">+ Rp75.000/bln</span></div>
              <div class="data-row"><span>Add-on Layar Dapur (KDS)</span><span class="mono bad">+ Rp75.000/bln</span></div>
              <div class="data-row total"><span>Total Diam-Diam</span><span class="mono bad">Rp300.000 / bln</span></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "KESALAHAN 02",
        rightTag: "MODE OFFLINE",
        html: `
          <div class="step-num">02</div>
          <h2 class="h2-slide">Tidak cek apakah kasir jalan <span class="serif">saat Wi-Fi mati.</span></h2>
          <p class="body">Jam makan siang antrean 10 orang, tiba-tiba internet gangguan. Kalau kasir ikut blank, antrean langsung bubar dan nota berantakan.</p>
          <div class="solution-card">
            <div class="mono-label teal">STANDAR WAJIB POS</div>
            <div class="sol-title">Offline-First &amp; Auto-Sync</div>
            <p class="sol-desc">Pastikan transaksi tunai &amp; cetak struk tetap jalan walau sinyal putus, lalu otomatis sinkron saat internet menyala kembali.</p>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "KESALAHAN 03",
        rightTag: "HARDWARE LOCK",
        html: `
          <div class="step-num">03</div>
          <h2 class="h2-slide">Beli mesin khusus jutaan <span class="serif">yang terkunci.</span></h2>
          <p class="body">Banyak mesin kasir Rp4–6 juta hanya bisa dipakai untuk 1 aplikasi tertentu. Kalau suatu saat pindah sistem, mesin jadi rongsokan.</p>
          <div class="note-card">
            <strong>Lebih aman:</strong> Pilih POS yang jalan di HP, tablet Android/iPad, atau laptop biasa + printer Bluetooth standar 58/80mm.
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "KESALAHAN 04 & 05",
        rightTag: "KONTROL & KOMISI",
        html: `
          <h2 class="h2-slide">Lupa cek <span class="serif">kunci staf &amp; komisi.</span></h2>
          <div class="list-card">
            <div class="mode-block">
              <div class="mode-head"><span class="badge-num bad">04</span><strong>Tanpa Kunci Akses &amp; Log Void</strong></div>
              <p class="card-text">Kasir bisa hapus transaksi sesuka hati dan melihat omzet bulanan outlet tanpa batasan peran.</p>
            </div>
            <div class="mode-block">
              <div class="mode-head"><span class="badge-num bad">05</span><strong>Potongan Komisi per Transaksi</strong></div>
              <p class="card-text">Terlihat kecil di awal, tapi saat omzet naik, potongan persenan justru jauh lebih mahal dari biaya flat bulanan.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "TRANSPARAN SEJAK HARI PERTAMA",
        rightTag: "TUMPU PRO",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">ALL-IN · Rp0 KOMISI</span>
            <h1 class="h1-cover dark">Satu harga jelas: <span class="serif-dark">Rp49rb/outlet/bln.</span></h1>
            <p class="lead dark">Offline-ready, KDS, Auto Stok &amp; HPP, RBAC staf, jalan di HP/tablet Anda. Atau mulai dari Starter Rp0 selamanya.</p>
            <div class="cta-btn">Coba Demo Gratis di tumpu.biz.id</div>
            <div class="cta-sub">Komen <strong>"DEMO"</strong> untuk kirim link langsung ke DM</div>
          </div>
        `,
      },
    ],
  },
];
