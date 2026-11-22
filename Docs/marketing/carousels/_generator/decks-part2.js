// Last 7 Ready-to-Post Instagram Carousel Decks (H16, H18, H20, H23, H25, H27, H29)

module.exports = [
  // =========================================================================
  // 8. H16-studi-kasus-rumah-makan (ig-d16 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d16",
    folder: "H16-studi-kasus-rumah-makan",
    day: 16,
    dayLabel: "Selasa",
    time: "18:30 WIB",
    dmKeyword: "KDS",
    title: "Studi Kasus Rumah Makan: Hemat 40 Menit/Hari Tanpa Bon Kertas",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Banyak yang mengira Layar Dapur (KDS) cuma buat coffee shop modern. Padahal rumah makan dengan 15+ meja saat jam makan siang justru yang paling terasa bedanya!

Satu kertas bon nyelip di bawah piring = 1 keluarga nunggu 35 menit lalu kasih ulasan bintang 1.

Geser buat lihat perbandingan nyata sebelum vs sesudah rumah makan beralih ke Layar Dapur (KDS) Kassa:
• Pramusaji catat order langsung dari HP di meja tamu
• Tiket otomatis muncul di tablet dapur lengkap timer SLA
• Salah menu turun drastis & hemat 40 menit/hari di jam puncak

Komen "KDS" kalau mau coba pasang di tablet bekas dapur kamu, atau cek langsung di kassa.biz.id.

#rumahmakan #posresto #kitchendisplay #operasionalresto #bisniskuliner #kassa`,
    firstComment: `Nggak perlu beli layar dapur mahal—cukup pakai tablet Android lama yang bisa buka browser. Ada yang masih pakai bon kertas di dapur? 👇`,
    stories: [
      "Slide 1 (Poll): \"Di dapur outlet kamu sekarang pakai apa?\" [Kertas bon / Printer dapur / Layar tablet KDS]",
      "Slide 2 (Teaser): Share Slide 1 (Sebelum vs Sesudah KDS Rumah Makan) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Trial Pro 14 Hari · Sudah termasuk KDS\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "STUDI KASUS RUMAH MAKAN",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Hemat 40 menit/hari <span class="serif">tanpa bon kertas.</span></h1>
            <p class="lead">Simulasi alur jam makan siang di rumah makan 15 meja: pindah dari kertas bon ke Layar Dapur (KDS) pakai tablet bekas.</p>
            <div class="metric-split">
              <div class="metric-card">
                <div class="mono-label">SEBELUM (BON KERTAS)</div>
                <div class="metric-big bad">18 mnt</div>
                <div class="metric-sub">Rata-rata tunggu · rawan bon nyelip</div>
              </div>
              <div class="metric-card">
                <div class="mono-label">SESUDAH (KDS KASSA)</div>
                <div class="metric-big good">9 mnt</div>
                <div class="metric-sub">Urutan jelas · 0 tiket hilang</div>
              </div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "MASALAH LAMA",
        rightTag: "JAM MAKAN SIANG",
        html: `
          <span class="pill bad">BOTTLENECK KLASIK</span>
          <h2 class="h2-slide">Pramusaji bolak-balik, <span class="serif">bon numpuk di dapur.</span></h2>
          <div class="list-card">
            <div class="list-row"><span class="badge-num bad">01</span><span>Tulis manual di kertas → tulisan sering susah dibaca koki</span></div>
            <div class="list-row"><span class="badge-num bad">02</span><span>Pramusaji jalan bolak-balik dari meja ke kasir lalu ke dapur</span></div>
            <div class="list-row"><span class="badge-num bad">03</span><span>Bon ketiup kipas atau basah → pesanan meja terlewat</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "ALUR BARU DI KASSA",
        rightTag: "3 LANGKAH",
        html: `
          <h2 class="h2-slide">Catat di meja, <span class="serif">langsung tampil di dapur.</span></h2>
          <div class="stepper-vertical">
            <div class="v-step">
              <span class="badge-num teal">01</span>
              <div><strong>Catat dari HP di Meja Tamu</strong><p class="card-text">Pramusaji pilih nomor meja &amp; catatan pedas/tanpa bawang langsung di HP.</p></div>
            </div>
            <div class="v-step">
              <span class="badge-num teal">02</span>
              <div><strong>Auto-Routing Bar &amp; Dapur</strong><p class="card-text">Es teh &amp; jus otomatis ke layar Bar, makanan panas ke layar Dapur.</p></div>
            </div>
            <div class="v-step">
              <span class="badge-num teal">03</span>
              <div><strong>Timer SLA &amp; Geser Status</strong><p class="card-text">Koki tinggal tap: Masuk → Dimasak → Siap Saji tanpa teriak.</p></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "TAMPILAN NYATA KDS",
        rightTag: "KANBAN DAPUR",
        html: `
          <h2 class="h2-slide">Bersih, kontras tinggi, <span class="serif">bebas salah menu.</span></h2>
          <p class="body-sm">Cukup buka browser di tablet Android lama atau monitor bekas yang sudah ada di dapur.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">app.kassa.biz.id/kds</span>
            </div>
            <img class="device-img" src="{{IMG:03-kds.png}}" alt="Layar Dapur KDS Kassa" />
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "SUDAH TERMASUK DI PRO",
        rightTag: "TANPA ADD-ON",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">TRIAL PRO 14 HARI GRATIS</span>
            <h1 class="h1-cover dark">Dapur lebih tenang, <span class="serif-dark">tamu makin puas.</span></h1>
            <p class="lead dark">Layar Dapur (KDS) sudah termasuk di Kassa Pro Rp49.000/outlet/bulan tanpa biaya add-on tambahan.</p>
            <div class="cta-btn">Coba KDS Gratis di kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"KDS"</strong> untuk kirim demo layar dapur ke DM</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 9. H18-multi-outlet-dashboard (ig-d18 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d18",
    folder: "H18-multi-outlet-dashboard",
    day: 18,
    dayLabel: "Kamis",
    time: "18:30 WIB",
    dmKeyword: "CABANG",
    title: "Punya 2–3 Cabang? Kelola Semua Outlet dalam 1 Dashboard",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Buka cabang ke-2 seharusnya bikin bisnis makin tumbuh—bukan malah bikin owner pusing rekap 3 file laporan terpisah tiap malam.

Di Kassa Pro, semua cabang terpantau rapi dari 1 akun Owner:
• Bandingkan omzet, transaksi, & margin antar cabang dalam 1 layar
• Master menu & resep tersinkron, tapi harga jual tetap bisa disesuaikan per lokasi
• Biaya tetap masuk akal: Rp49.000 / outlet / bulan, Rp0 komisi transaksi

Punya 2 cabang atau sedang persiapan ekspansi tahun ini?
Komen "CABANG" biar tim kami bantu konsultasi setup multi-outlet, atau cek langsung di kassa.biz.id.

#multioutlet #ekspansibisnis #poscafe #ownercafe #manajemenbisnis #kassa`,
    firstComment: `Buat yang sudah punya 2+ cabang, bagian mana yang paling menantang: jaga konsistensi resep, kontrol staf, atau rekap keuangan? 👇`,
    stories: [
      "Slide 1 (Poll): \"Target outlet kamu tahun ini...\" [Rapikan cabang 1 dulu / Buka cabang ke-2+ 🚀]",
      "Slide 2 (Teaser): Share Slide 2 (Dashboard Multi-Outlet) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Multi-Outlet tetap Rp49rb/outlet/bln\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "SKALA MULTI-OUTLET",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Kelola 2–3 cabang <span class="serif">dalam 1 dashboard.</span></h1>
            <p class="lead">Tanda sistem outlet kamu sudah siap ekspansi cabang ke-2: resep terstandar, shift jarang selisih, dan laporan tidak perlu ditagih manual via WA.</p>
            <div class="branch-grid">
              <div class="branch-card"><span class="mono-label">CABANG 01 · PUSAT</span><strong>Rp4,8 jt</strong><span class="pill good">MARGIN 71%</span></div>
              <div class="branch-card"><span class="mono-label">CABANG 02 · KAMPUS</span><strong>Rp3,4 jt</strong><span class="pill good">MARGIN 69%</span></div>
              <div class="branch-card"><span class="mono-label">CABANG 03 · TIMUR</span><strong>Rp2,9 jt</strong><span class="pill teal-soft">LIVE SYNC</span></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PANTAU REALTIME",
        rightTag: "1 AKUN OWNER",
        html: `
          <h2 class="h2-slide">Bandingkan performa cabang <span class="serif">dalam 1 layar.</span></h2>
          <p class="body-sm">Lihat omzet harian, menu terlaris, dan margin kotor tiap cabang langsung dari HP tanpa logout-login akun.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">app.kassa.biz.id/dashboard</span>
            </div>
            <img class="device-img" src="{{IMG:04-dashboard.png}}" alt="Dashboard Multi Outlet Kassa" />
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "STANDARISASI MENU",
        rightTag: "KATALOG & HARGA",
        html: `
          <h2 class="h2-slide">Resep seragam, harga <span class="serif">fleksibel per lokasi.</span></h2>
          <p class="body">Jaga kualitas rasa tetap identik di semua cabang dengan master resep terpusat, tapi tetap leluasa mengatur harga jual sesuai daya beli lokasi.</p>
          <div class="list-card">
            <div class="list-row"><span class="badge-num teal">✓</span><span>Master menu &amp; gramasi HPP tersinkron otomatis</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span>Stok bahan baku tercatat terpisah per gudang cabang</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span>Staf tiap cabang hanya bisa akses outletnya sendiri</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "BIAYA TETAP TERJANGKAU",
        rightTag: "TANPA KOMISI",
        html: `
          <h2 class="h2-slide">Tambah cabang tanpa <span class="serif">biaya meledak.</span></h2>
          <div class="card-surface">
            <div class="data-table">
              <div class="data-row"><span>1 Outlet (Pro All-In)</span><span class="mono bold">Rp49.000 / bln</span></div>
              <div class="data-row"><span>2 Outlet (Pro All-In)</span><span class="mono bold">Rp98.000 / bln</span></div>
              <div class="data-row"><span>3 Outlet (Pro All-In)</span><span class="mono bold">Rp147.000 / bln</span></div>
              <div class="data-row total"><span>Komisi per Transaksi</span><span class="mono good">Rp0 (Gratis)</span></div>
            </div>
          </div>
          <p class="body-sm">Semua cabang otomatis dapat POS Offline, Layar Dapur (KDS), Auto Stok &amp; HPP, serta staf tanpa batas.</p>
        `,
      },
      {
        theme: "dark",
        eyebrow: "SIAP EKSPANSI CABANG?",
        rightTag: "MULTI-OUTLET",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">FREE KONSULTASI SETUP</span>
            <h1 class="h1-cover dark">Satu dashboard untuk <span class="serif-dark">semua cabang Anda.</span></h1>
            <p class="lead dark">Mulai dari 1 outlet dulu atau langsung hubungkan seluruh cabang Anda dengan bantuan tim Kassa.</p>
            <div class="cta-btn">Konsultasi via kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"CABANG"</strong> biar kami kirim panduan setup multi-outlet</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 10. H20-sop-opening-closing (ig-d20 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d20",
    folder: "H20-sop-opening-closing",
    day: 20,
    dayLabel: "Sabtu",
    time: "17:30 WIB",
    dmKeyword: "SOP",
    title: "Checklist SOP Opening & Closing Cafe (Siap Simpan!)",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `SOP yang bagus itu bukan dokumen 50 halaman yang cuma disimpan di laci—tapi checklist 5 menit yang simpel dan benar-benar dijalankan tim setiap hari.

Simpan carousel ini dan kirim langsung ke grup WA staf kasir & barista kamu 📌

Ringkasan 3 fase operasional harian:
• Opening (08:00): Input modal kas awal, cek kertas thermal, cek stok bahan kritis
• Operasional: Login PIN personal, routing KDS, catat setiap kas keluar
• Closing (22:00): Hitung fisik uang laci, cocokkan Z-Report, export laporan harian

Di Kassa, seluruh alur buka-tutup shift dan Z-Report sudah tercatat otomatis dalam 30 detik.

Komen "SOP" kalau mau versi checklist praktisnya, atau coba langsung di kassa.biz.id.

#sopcafe #operasionalfnb #baristaindonesia #manajemencafe #kasircafe #kassa`,
    firstComment: `Tag atau share postingan ini ke partner bisnis & kepala shift outlet kamu biar opening-closing makin rapi! 🙌`,
    stories: [
      "Slide 1 (Shareable): \"Checklist 5 menit Opening & Closing Cafe — langsung screenshot & kirim ke grup WA tim!\"",
      "Slide 2 (Teaser): Share Slide 2 (SOP Opening) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Tutup shift Z-Report cuma 30 detik\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "CHECKLIST OPERASIONAL",
        rightTag: "SIMPAN 📌",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Checklist SOP <span class="serif">Opening &amp; Closing.</span></h1>
            <p class="lead">Panduan 5 menit biar staf buka &amp; tutup outlet tidak pernah kelewat—siap simpan dan bagikan ke grup WA tim kamu.</p>
            <div class="stepper-grid three">
              <div class="step-pill"><span class="mono teal">FASE 01</span><strong>Opening</strong><small>Sebelum buka</small></div>
              <div class="step-pill"><span class="mono teal">FASE 02</span><strong>Shift Jalan</strong><small>Jam ramai</small></div>
              <div class="step-pill"><span class="mono teal">FASE 03</span><strong>Closing</strong><small>Tutup kasir</small></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "FASE 01 · OPENING",
        rightTag: "5 MENIT PAGI",
        html: `
          <div class="step-num">01</div>
          <h2 class="h2-slide">Checklist <span class="serif">Opening Shift</span></h2>
          <div class="check-box-list">
            <div class="check-row"><span class="chk">☐</span><span>Buka shift &amp; input <strong>modal kas awal</strong> (uang kembalian) di POS</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Tes cetak 1 struk di <strong>printer thermal Bluetooth</strong> &amp; cek roll kertas</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Cek <strong>stok bahan kritis</strong> (susu, espresso beans, es batu, cup)</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Pastikan tablet <strong>Layar Dapur (KDS)</strong> menyala &amp; tersambung</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "FASE 02 · OPERASIONAL",
        rightTag: "SAAT BUKA",
        html: `
          <div class="step-num">02</div>
          <h2 class="h2-slide">Checklist <span class="serif">Selama Jam Buka</span></h2>
          <div class="check-box-list">
            <div class="check-row"><span class="chk">☐</span><span>Tiap pergantian shift wajib login pakai <strong>PIN personal</strong></span></div>
            <div class="check-row"><span class="chk">☐</span><span>Setiap pembatalan order (void) wajib <strong>otorisasi PIN Manager</strong></span></div>
            <div class="check-row"><span class="chk">☐</span><span>Catat semua <strong>kas keluar</strong> (beli es/galon/gas) di menu Kasir</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Pantau timer SLA di layar dapur saat <strong>jam makan siang</strong></span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "FASE 03 · CLOSING",
        rightTag: "30 DETIK MALAM",
        html: `
          <div class="step-num">03</div>
          <h2 class="h2-slide">Checklist <span class="serif">Closing &amp; Z-Report</span></h2>
          <div class="check-box-list">
            <div class="check-row"><span class="chk">☐</span><span>Hitung uang fisik laci &amp; pisahkan modal awal untuk besok</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Cocokkan total <strong>Tunai vs QRIS</strong> di Z-Report (target selisih Rp0)</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Cek laporan bahan baku menipis untuk daftar belanja besok</span></div>
            <div class="check-row"><span class="chk">☐</span><span>Tutup shift — laporan otomatis terkirim ke Dashboard Owner</span></div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "OTOMATIS TERCATAT DI KASSA",
        rightTag: "KASSA POS",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">Z-REPORT 30 DETIK</span>
            <h1 class="h1-cover dark">SOP rapi dijalankan, <span class="serif-dark">tutup shift tanpa drama.</span></h1>
            <p class="lead dark">Modal awal, kas keluar, PIN shift, hingga Z-Report otomatis tersedia di Kassa. Mulai gratis hari ini.</p>
            <div class="cta-btn">Coba Gratis di kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"SOP"</strong> atau simpan postingan ini buat tim kamu</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 11. H23-starter-vs-pro (ig-d23 · 4 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d23",
    folder: "H23-starter-vs-pro",
    day: 23,
    dayLabel: "Selasa",
    time: "18:30 WIB",
    dmKeyword: "STARTER",
    title: "Starter Gratis Rp0 vs Pro Rp49rb — Pilih Mana Buat Outlet Kamu?",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Kami nggak maksa kamu langsung bayar. Transparan sejak hari pertama:

• Pilih STARTER (Rp0 / Gratis selamanya) kalau kedai kamu baru buka, 1 outlet, maksimal 3 akun (1 Owner + 2 Staf), dan fokus butuh kasir cepat + mode offline + struk Bluetooth 58/80mm.

• Pilih PRO (Rp49.000/outlet/bulan) begitu outlet makin ramai dan butuh Layar Dapur (KDS), auto potong stok & HPP, staf tanpa batas, laporan CSV, atau mulai buka cabang ke-2.

Nggak ada jebakan kontrak tahunan, dan Rp0 komisi transaksi di kedua paket.

Komen "STARTER" untuk link daftar gratis 2 menit, atau langsung buka kassa.biz.id.

#aplikasikasirgratis #poscafe #umkmindonesia #bisniskuliner #kassa`,
    firstComment: `Bisa mulai dari Starter Rp0 dulu tanpa kartu kredit, lalu aktifkan Trial Pro 14 Hari kapan pun kamu siap ✨`,
    stories: [
      "Slide 1 (Poll): \"Outlet kamu saat ini lebih butuh yang mana?\" [Kasir Cepat + Struk (Rp0) / Full KDS + Stok HPP (Rp49rb)]",
      "Slide 2 (Teaser): Share Slide 1 (Starter Rp0 vs Pro Rp49rb) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Daftar Starter Gratis 2 Menit\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "PERBANDINGAN JUJUR",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Starter Rp0 vs Pro, <span class="serif">pilih mana?</span></h1>
            <p class="lead">Transparan tanpa jebakan fitur tersembunyi. Cek paket mana yang paling pas untuk tahap outlet kamu sekarang.</p>
            <div class="compare-grid">
              <div class="card-surface compact">
                <span class="pill teal-soft">STARTER</span>
                <div class="price-big">Rp0</div>
                <p class="card-text">Gratis selamanya · 1 Outlet · 3 Akun · Khusus POS</p>
              </div>
              <div class="card-surface compact accent-border">
                <span class="pill gold-light">PRO · ALL-IN</span>
                <div class="price-big teal">Rp49rb</div>
                <p class="card-text">/outlet/bulan · Multi-Outlet · KDS, Stok &amp; HPP</p>
              </div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PILIH STARTER (Rp0)",
        rightTag: "GRATIS SELAMANYA",
        html: `
          <span class="pill teal-soft">COCOK UNTUK KEDAI BARU</span>
          <h2 class="h2-slide">Cukup pakai Starter Rp0 <span class="serif">kalau outlet kamu...</span></h2>
          <div class="list-card">
            <div class="list-row"><span class="badge-num teal">✓</span><span>Masih <strong>1 outlet</strong> dengan tim kecil (maksimal <strong>3 akun</strong>: 1 Owner + 2 Staf)</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span>Fokus butuh <strong>Kasir POS cepat</strong> &amp; tetap jalan saat Wi-Fi mati</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span>Butuh cetak <strong>struk thermal 58/80mm</strong> (Bluetooth &amp; USB)</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span>Belum perlu layar dapur (KDS) atau potong stok resep otomatis</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PILIH PRO (Rp49.000/BLN)",
        rightTag: "ALL-IN TANPA ADD-ON",
        html: `
          <span class="pill gold-light">COCOK UNTUK OUTLET TUMBUH</span>
          <h2 class="h2-slide">Upgrade ke Pro Rp49rb <span class="serif">begitu butuh...</span></h2>
          <div class="list-card">
            <div class="list-row"><span class="badge-num good">★</span><span><strong>Layar Dapur (KDS)</strong> &amp; routing otomatis Bar vs Dapur</span></div>
            <div class="list-row"><span class="badge-num good">★</span><span><strong>Auto Potong Stok &amp; HPP</strong> setiap transaksi lunas</span></div>
            <div class="list-row"><span class="badge-num good">★</span><span><strong>Staf tanpa batas</strong> dengan kontrol akses (RBAC) &amp; log void</span></div>
            <div class="list-row"><span class="badge-num good">★</span><span><strong>Multi-Outlet</strong>, Dashboard Laba &amp; Export Laporan CSV</span></div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "FLEKSIBEL TANPA KONTRAK",
        rightTag: "KASSA",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">Rp0 KOMISI TRANSAKSI</span>
            <h1 class="h1-cover dark">Mulai dari Starter Rp0, <span class="serif-dark">upgrade kapan saja.</span></h1>
            <p class="lead dark">Tersedia juga Trial Pro Gratis 14 Hari buat kamu yang mau langsung tes KDS &amp; Auto HPP.</p>
            <div class="cta-btn">Pilih Paket di kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"STARTER"</strong> untuk link daftar langsung ke DM</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 12. H25-4-data-akhir-bulan (ig-d25 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d25",
    folder: "H25-4-data-akhir-bulan",
    day: 25,
    dayLabel: "Kamis",
    time: "18:30 WIB",
    dmKeyword: "MARGIN",
    title: "4 Data Wajib Cek Sebelum Akhir Bulan Biar Margin Naik 15%",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Evaluasi akhir bulan nggak perlu ribet bikin rumus rumit—luangkan 15 menit saja buat cek 4 data inti ini.

Banyak coffee shop & rumah makan bisa menaikkan margin bersih 10–15% bukan dari menaikkan harga, tapi dari memangkas menu yang bahan bakunya sering terbuang dan merapikan jadwal shift.

4 data wajib cek sebelum tanggal 1:
01. Top 5 Menu terlaris vs Bottom 5 Menu (pangkas beban stok)
02. Persentase HPP rata-rata (target sehat 28%–35%)
03. Jam puncak transaksi (atur jadwal shift staf biar efisien)
04. Selisih kas & void bulanan (deteksi kebocoran lebih awal)

Simpan buat agenda evaluasi akhir bulan outlet kamu 📌
Komen "MARGIN" atau lihat dashboard otomatisnya di kassa.biz.id.

#evaluasibisnis #marginfnb #ownercafe #bisniskuliner #dashboardpos #kassa`,
    firstComment: `Dari 4 data ini, mana yang paling sering kamu cek setiap akhir bulan? Tulis angkanya (1–4) di komentar 👇`,
    stories: [
      "Slide 1 (Poll): \"Menjelang akhir bulan, kamu sudah rutin evaluasi menu yang jarang laku?\" [Sudah rutin ✅ / Belum sempat 😅]",
      "Slide 2 (Teaser): Share Slide 1 (4 Data Akhir Bulan) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Semua grafik otomatis jadi di Kassa Pro\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "EVALUASI BULANAN F&B",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">4 data akhir bulan <span class="serif">naikkan margin 15%.</span></h1>
            <p class="lead">Luangkan 15 menit sebelum masuk bulan baru. Keputusan kecil dari 4 angka ini sering berdampak besar ke profit bersih outlet.</p>
            <div class="stepper-grid">
              <div class="step-pill"><span class="mono teal">01</span><strong>Top &amp; Bottom</strong><small>Menu engineering</small></div>
              <div class="step-pill"><span class="mono teal">02</span><strong>Rasio HPP</strong><small>Target &lt;35%</small></div>
              <div class="step-pill"><span class="mono teal">03</span><strong>Jam Puncak</strong><small>Efisiensi shift</small></div>
              <div class="step-pill"><span class="mono teal">04</span><strong>Audit Kas</strong><small>Void &amp; selisih</small></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "DATA 01",
        rightTag: "MENU ENGINEERING",
        html: `
          <div class="step-num">01</div>
          <h2 class="h2-slide">Top 5 Menu vs <span class="serif">Bottom 5 Menu.</span></h2>
          <p class="body">Menu yang jarang dipesan tapi butuh bahan baku khusus adalah sumber utama waste. Pangkas 3–5 menu paling sepi agar modal stok lebih sehat.</p>
          <div class="compare-grid">
            <div class="card-surface compact">
              <span class="pill good">TOP 5 · FOKUS</span>
              <div class="card-title">Dorong Bundling</div>
              <p class="card-text">Jadikan menu unggulan di papan kasir &amp; paket promo jam sepi.</p>
            </div>
            <div class="card-surface compact">
              <span class="pill bad">BOTTOM 5 · EVALUASI</span>
              <div class="card-title">Hapus / Ganti</div>
              <p class="card-text">Kurangi bahan baku mati yang sering kedaluwarsa di kulkas.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "DATA 02",
        rightTag: "KONTROL HPP",
        html: `
          <div class="step-num">02</div>
          <h2 class="h2-slide">Persentase HPP rata-rata <span class="serif">(jaga di &lt;35%).</span></h2>
          <p class="body">Jika HPP rata-rata naik dari 30% ke 40% tanpa kenaikan harga supplier, artinya ada kebocoran takaran atau porsi di bar &amp; dapur.</p>
          <div class="bar-viz">
            <div class="bar-item">
              <div class="bar-label"><span>Coffee Shop Sehat</span><span class="mono good bold">25% – 30%</span></div>
              <div class="bar-track"><div class="bar-fill good" style="width: 30%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label"><span>Rumah Makan / Eatery</span><span class="mono teal bold">30% – 35%</span></div>
              <div class="bar-track"><div class="bar-fill teal" style="width: 35%;"></div></div>
            </div>
            <div class="bar-item">
              <div class="bar-label"><span>Zona Waspada (Perlu Audit)</span><span class="mono bad bold">&gt; 40%</span></div>
              <div class="bar-track"><div class="bar-fill bad" style="width: 55%;"></div></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "DATA 03 & 04",
        rightTag: "JAM PUNCAK & AUDIT",
        html: `
          <h2 class="h2-slide">Jam puncak transaksi &amp; <span class="serif">audit kas bulanan.</span></h2>
          <p class="body-sm">Atur jadwal staf lebih padat di jam puncak (mis. 12:00–14:00 &amp; 19:00–21:00) dan cek total void/selisih kas dari Dashboard Owner.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">app.kassa.biz.id/reports</span>
            </div>
            <img class="device-img" src="{{IMG:04-dashboard.png}}" alt="Dashboard Evaluasi Kassa" />
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "DATA OTOMATIS SIAP BACA",
        rightTag: "KASSA PRO",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">DASHBOARD &amp; EXPORT CSV</span>
            <h1 class="h1-cover dark">Berhenti menebak, <span class="serif-dark">kelola pakai data.</span></h1>
            <p class="lead dark">Semua grafik omzet, margin HPP, menu terlaris, dan laporan Z-Report otomatis tersedia di Kassa Pro Rp49rb/bln.</p>
            <div class="cta-btn">Lihat Dashboard di kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"MARGIN"</strong> untuk kirim demo laporan ke DM</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 13. H27-dinein-takeaway-delivery (ig-d27 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d27",
    folder: "H27-dinein-takeaway-delivery",
    day: 27,
    dayLabel: "Sabtu",
    time: "17:30 WIB",
    dmKeyword: "RESTO",
    title: "Alur Lengkap Dine-In, Takeaway & Delivery Tanpa Antre Kasir",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Salah satu komplain paling sering pas weekend ramai: pesanan tamu makan di tempat malah dibungkus plastik, atau pesanan ojol malah ditaruh di piring!

Solusinya bukan cuma nyuruh dapur "lebih teliti", tapi memastikan jenis order sudah terpisah jelas sejak dari layar kasir.

Di Kassa:
• Dine-In otomatis terhubung ke nomor meja & bisa pindah meja / split bill
• Takeaway & Delivery (Ojol) langsung tampil dengan badge khusus di Layar Dapur (KDS)
• Tim dapur langsung tahu mana yang pakai piring, mana yang pakai kemasan bungkus

Kurangi salah bungkus pas malam Minggu nanti!
Komen "RESTO" atau langsung coba alur mejanya di kassa.biz.id.

#operasionalresto #dinein #takeaway #posresto #bisniscafe #kassa`,
    firstComment: `Pernah ngalamin kejadian pesanan dine-in malah kebungkus pas jam ramai? 😅 Share ceritanya di bawah!`,
    stories: [
      "Slide 1 (Relatable): \"Malam Minggu outlet penuh? Jangan sampai pesanan meja 04 malah dibungkus buat ojol 😅\"",
      "Slide 2 (Teaser): Share Slide 2 (Denah Meja Kassa) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Atur Dine-In, Takeaway & Delivery rapi\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "OPERASIONAL WEEKEND",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">Dine-In &amp; Takeaway <span class="serif">rapi tanpa ketukar.</span></h1>
            <p class="lead">Pisahkan label pesanan sejak dari layar kasir—dapur langsung tahu mana yang disajikan di piring dan mana yang dibungkus.</p>
            <div class="stepper-grid three">
              <div class="step-pill"><span class="pill teal-soft">DINE-IN</span><strong>Meja 04</strong><small>Denah &amp; Split Bill</small></div>
              <div class="step-pill"><span class="pill warn">TAKEAWAY</span><strong>Bungkus</strong><small>Kemasan &amp; antrean</small></div>
              <div class="step-pill"><span class="pill good">DELIVERY</span><strong>Ojol</strong><small>Prioritas kurir</small></div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "TIPE ORDER 01 · DINE-IN",
        rightTag: "DENAH MEJA",
        html: `
          <h2 class="h2-slide">Terhubung langsung ke <span class="serif">denah nomor meja.</span></h2>
          <p class="body-sm">Pantau meja terisi, pindah meja, atau split bill rombongan hanya dalam beberapa tap tanpa bikin antrean kasir macet.</p>
          <div class="device-frame">
            <div class="device-bar">
              <span class="d-dot"></span><span class="d-dot"></span><span class="d-dot"></span>
              <span class="device-url">app.kassa.biz.id/tables</span>
            </div>
            <img class="device-img" src="{{IMG:06-tables.png}}" alt="Manajemen Meja Kassa" />
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "TIPE ORDER 02 & 03",
        rightTag: "TAKEAWAY & DELIVERY",
        html: `
          <h2 class="h2-slide">Badge khusus di <span class="serif">Layar Dapur (KDS).</span></h2>
          <p class="body">Order bungkus dan ojol tidak perlu nomor meja—cukup pilih tipe order, tiket di dapur langsung menampilkan penanda warna yang kontras.</p>
          <div class="ticket-row">
            <div class="kds-mock">
              <div class="kds-top"><span class="mono bold">#108</span><span class="pill teal-soft">DINE-IN · MEJA 04</span></div>
              <div class="kds-item">2× Nasi Goreng Spesial</div>
              <div class="kds-note">Catatan: 1 tidak pedas</div>
            </div>
            <div class="kds-mock warn-b">
              <div class="kds-top"><span class="mono bold">#109</span><span class="pill warn">TAKEAWAY · OJOL</span></div>
              <div class="kds-item">3× Es Kopi Susu Aren</div>
              <div class="kds-note">Catatan: Es dipisah, segel rapat</div>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "DAMPAK KE TIM DAPUR",
        rightTag: "ZERO SALAH BUNGKUS",
        html: `
          <h2 class="h2-slide">Dapur lebih fokus, <span class="serif">antrean lebih cepat.</span></h2>
          <div class="list-card">
            <div class="list-row"><span class="badge-num good">01</span><span><strong>Zero salah kemasan</strong> — piring vs paper bowl langsung jelas</span></div>
            <div class="list-row"><span class="badge-num good">02</span><span><strong>Laporan terpisah</strong> — tahu porsi omzet Dine-In vs Takeaway vs Ojol</span></div>
            <div class="list-row"><span class="badge-num good">03</span><span><strong>Kasir tidak teriak</strong> — catatan khusus terbaca jelas di layar dapur</span></div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "SIAP HADAPI WEEKEND RUSH?",
        rightTag: "KASSA POS",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">DENAH MEJA + KDS</span>
            <h1 class="h1-cover dark">Malam Minggu penuh, <span class="serif-dark">alur tetap mulus.</span></h1>
            <p class="lead dark">Kelola Dine-In, Takeaway, dan Delivery dalam satu sistem rapi. Starter Rp0 atau Pro Rp49.000/bln All-In.</p>
            <div class="cta-btn">Coba Gratis di kassa.biz.id</div>
            <div class="cta-sub">Komen <strong>"RESTO"</strong> untuk kirim demo manajemen meja &amp; KDS</div>
          </div>
        `,
      },
    ],
  },

  // =========================================================================
  // 14. H29-faq-lengkap-kassa (ig-d29 · 5 slides · Light Editorial + Dark CTA)
  // =========================================================================
  {
    id: "ig-d29",
    folder: "H29-faq-lengkap-kassa",
    day: 29,
    dayLabel: "Senin",
    time: "18:30 WIB",
    dmKeyword: "KASSA",
    title: "FAQ Lengkap Kassa: Offline, Printer, Multi-Outlet & Keamanan Data",
    themeLabel: "Light Editorial + Dark CTA",
    caption: `Masih ada keraguan sebelum mulai pakai Kassa? Kami rangkum 4 pertanyaan yang paling sering masuk ke DM dari owner coffee shop & rumah makan:

Q1: Benar tetap jalan kalau Wi-Fi mati?
→ Ya! Transaksi tunai & cetak struk tetap jalan offline, lalu otomatis sinkron saat internet balik.

Q2: Harus beli mesin kasir khusus?
→ Tidak perlu. Jalan di HP Android, iPhone, iPad, & laptop + printer thermal Bluetooth/USB 58mm & 80mm.

Q3: Ada potongan komisi per transaksi?
→ Rp0 komisi. Starter gratis selamanya (1 outlet, 3 akun), Pro flat Rp49.000/outlet/bulan all-in.

Q4: Bagaimana keamanan data & akses staf?
→ Tiap staf punya PIN personal, akses menu terkunci per peran (RBAC), dan data tersimpan aman di cloud.

Masih ada pertanyaan lain soal outlet kamu? Drop di kolom komentar atau komen "KASSA" biar kami bantu langsung di DM 👇

#faqkassa #aplikasikasir #bisniskuliner #poscafe #posresto #kassa`,
    firstComment: `Ada pertanyaan lain soal pindah data menu dari POS lama atau kompatibilitas printer? Tulis di bawah ya, kami balas satu-satu! 🙌`,
    stories: [
      "Slide 1 (Question Sticker): \"Open Q&A soal Kassa! Mau tanya soal printer Bluetooth, mode offline, atau harga? Drop di sini 👇\"",
      "Slide 2 (Teaser): Share Slide 1 (FAQ Lengkap Kassa) ke Story",
      "Slide 3 (CTA): Link kassa.biz.id — \"Coba gratis 2 menit tanpa kartu kredit\"",
    ],
    slides: [
      {
        theme: "light",
        eyebrow: "TANYA JAWAB CEPAT",
        rightTag: "SWIPE →",
        html: `
          <div class="cover-stack">
            <h1 class="h1-cover">FAQ Kassa: <span class="serif">Semua jawaban cepat.</span></h1>
            <p class="lead">Semua pertanyaan yang paling sering masuk ke DM dari owner coffee shop &amp; rumah makan—kami jawab transparan di sini.</p>
            <div class="pill-row">
              <span class="chip">Mode Offline</span>
              <span class="chip">Printer 58/80mm</span>
              <span class="chip">Harga &amp; Komisi</span>
              <span class="chip">Keamanan Staf</span>
            </div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERTANYAAN 01",
        rightTag: "MODE OFFLINE",
        html: `
          <span class="pill teal-soft">Q1 · INTERNET MATI</span>
          <h2 class="h2-slide">Apakah kasir benar tetap jalan <span class="serif">saat Wi-Fi mati?</span></h2>
          <div class="solution-card">
            <div class="mono-label good">YA, 100% OFFLINE-READY</div>
            <div class="sol-title">Transaksi Tunai &amp; Struk Tetap Jalan</div>
            <p class="sol-desc">Katalog menu tersimpan di perangkat. Saat Wi-Fi putus, transaksi tetap tercatat dengan nomor antrean offline (mis. OFF-042) dan otomatis sinkron tanpa dobel saat sinyal kembali.</p>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERTANYAAN 02",
        rightTag: "PERANGKAT & PRINTER",
        html: `
          <span class="pill teal-soft">Q2 · HARDWARE</span>
          <h2 class="h2-slide">Bisa pakai HP, tablet, &amp; <span class="serif">printer apa saja?</span></h2>
          <div class="list-card">
            <div class="list-row"><span class="badge-num teal">✓</span><span><strong>Perangkat:</strong> Android, iPhone, iPad, laptop Windows/Mac (lewat browser/PWA)</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span><strong>Printer Struk:</strong> Semua printer thermal standar 58mm &amp; 80mm (Bluetooth &amp; USB)</span></div>
            <div class="list-row"><span class="badge-num teal">✓</span><span><strong>Layar Dapur:</strong> Cukup pakai tablet bekas atau monitor browser</span></div>
          </div>
        `,
      },
      {
        theme: "light",
        eyebrow: "PERTANYAAN 03 & 04",
        rightTag: "HARGA & KEAMANAN",
        html: `
          <h2 class="h2-slide">Soal komisi transaksi &amp; <span class="serif">keamanan data.</span></h2>
          <div class="list-card">
            <div class="mode-block">
              <div class="mode-head"><strong>Q3 · Ada potongan komisi per transaksi?</strong><span class="pill good">Rp0 KOMISI</span></div>
              <p class="card-text">Tidak ada potongan persenan sama sekali. Starter Rp0 selamanya, Pro flat Rp49.000/outlet/bulan All-In.</p>
            </div>
            <div class="mode-block">
              <div class="mode-head"><strong>Q4 · Bagaimana keamanan data &amp; staf?</strong><span class="pill teal-soft">CLOUD + RBAC</span></div>
              <p class="card-text">Tiap staf pakai PIN personal, menu omzet/stok terkunci dari kasir, dan seluruh transaksi tersimpan aman di server cloud.</p>
            </div>
          </div>
        `,
      },
      {
        theme: "dark",
        eyebrow: "MASIH ADA PERTANYAAN LAIN?",
        rightTag: "KASSA SUPPORT",
        html: `
          <div class="cta-stack">
            <span class="pill gold-dark">RESPON CEPAT VIA DM &amp; WA</span>
            <h1 class="h1-cover dark">Coba langsung 2 menit, <span class="serif-dark">rasakan bedanya.</span></h1>
            <p class="lead dark">Daftar Starter Gratis Rp0 atau aktifkan Trial Pro 14 Hari tanpa kartu kredit di kassa.biz.id.</p>
            <div class="cta-btn">Mulai Gratis di kassa.biz.id</div>
            <div class="cta-sub">Tulis pertanyaan di komentar atau komen <strong>"KASSA"</strong></div>
          </div>
        `,
      },
    ],
  },
];
