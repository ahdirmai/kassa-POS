# 07 — Panduan Deployment Produksi Lengkap — Tumpu (`tumpu.biz.id` & `pos.tumpu.biz.id`)

Dokumen ini adalah panduan operasional teknis yang rinci untuk men-deploy **Tumpu POS (Next.js 15 + Express + Prisma + MySQL 8 + Redis + Socket.IO)** dengan arsitektur dual-domain:
- **`tumpu.biz.id`** → Landing Page & Marketing Page (folder terpisah: `landing/`)
- **`pos.tumpu.biz.id`** → Aplikasi POS, KDS Kanban, Admin Back-Office, API `/api/v1`, & Socket.IO `/socket.io/`

---

## 1. Spesifikasi Server & Prasyarat

| Aspek | Cloud VPS (1–3 Outlet) | On-Premise Mini PC (1 Outlet) |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU | Intel N100 / Core i3 (4 core) |
| **RAM** | 4 GB (+ 2 GB Swap) | 8 GB |
| **Storage** | 40 GB SSD / NVMe | 256 GB SSD |
| **OS** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS |
| **Domain** | Diperlukan untuk HTTPS (mis. `pos.kopisenja.id`) | Tidak wajib (pakai IP LAN statis mis. `192.168.1.50`) |
| **Akses** | SSH root / sudo + Port 80 & 443 terbuka | Kabel LAN ke router Wi-Fi outlet |

---

## 2. Tahap 1 — Persiapan Server & Hardening Awal (Ubuntu)

Masuk ke server via SSH (`ssh root@IP_SERVER`) lalu jalankan langkah berikut secara berurutan:

### 2.1 Update Sistem & Set Timezone WIB (`Asia/Jakarta`)
```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Jakarta
timedatectl status
```

### 2.2 Tambah Swap 2 GB (Sangat Disarankan untuk VPS RAM 4 GB saat Build Next.js)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### 2.3 Konfigurasi Firewall (UFW)
Hanya buka SSH (22), HTTP (80), dan HTTPS (443). **Jangan pernah membuka port MySQL (3306) atau Redis (6379) ke internet publik.**
```bash
sudo apt install -y ufw fail2ban
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

### 2.4 Instalasi Docker Engine & Docker Compose v2
```bash
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

# Verifikasi instalasi
docker --version
docker compose version
```

---

## 3. Tahap 2 — Clone Repository & Konfigurasi Environment Produksi

### 3.1 Clone Kode ke `/opt/cadra-pos`
```bash
sudo mkdir -p /opt/cadra-pos
sudo chown -R $USER:$USER /opt/cadra-pos
git clone <URL_REPOSITORY_ANDA> /opt/cadra-pos
cd /opt/cadra-pos
```

### 3.2 Generate Secret Acak yang Kuat
Jalankan perintah ini untuk menghasilkan secret unik (catat hasilnya untuk dimasukkan ke `docker/.env`):
```bash
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9')"
echo "MYSQL_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9')"
```

### 3.3 Buat File `docker/.env`
```bash
nano /opt/cadra-pos/docker/.env
```
Isi dengan nilai produksi Anda:
```env
# Database MySQL 8 (hanya diakses internal jaringan Docker)
MYSQL_ROOT_PASSWORD=<hasil_openssl_root>
MYSQL_DATABASE=pos_cafe
MYSQL_USER=pos_user
MYSQL_PASSWORD=<hasil_openssl_user>

# Domain Publik Produksi (Tumpu)
CORS_ORIGIN=https://pos.tumpu.biz.id
NEXT_PUBLIC_API_URL=https://pos.tumpu.biz.id/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pos.tumpu.biz.id

# Keamanan JWT (WAJIB berbeda antara access & refresh)
JWT_ACCESS_SECRET=<64_hex_acak_1>
JWT_REFRESH_SECRET=<64_hex_acak_2>
```
Kunci izin file agar hanya bisa dibaca pemilik server:
```bash
chmod 600 /opt/cadra-pos/docker/.env
```

---

## 4. Tahap 3 — Build & Jalankan Container Produksi

### 4.1 Proses Build Multi-Stage (`Dockerfile.api` & `Dockerfile.web`)
File `docker/docker-compose.prod.yml` akan otomatis:
1. Menjalankan `mysql:8.0` (`utf8mb4_unicode_ci`) dengan volume persisten `mysql_prod_data` dan healthcheck.
2. Menjalankan `redis:7-alpine` dengan volume persisten `redis_prod_data`.
3. Mem-build `@pos/shared` → generate Prisma Client → compile `@pos/api` (`dist/index.js`).
4. Mem-build `@pos/web` (Next.js production bundle) dengan `NEXT_PUBLIC_API_URL` & `NEXT_PUBLIC_SOCKET_URL`.
5. Menjalankan `nginx` yang merutekan `/`, `/api/`, `/socket.io/`, dan `/health`.

Jalankan perintah build & start:
```bash
cd /opt/cadra-pos
docker compose --env-file docker/.env -f docker/docker-compose.prod.yml up -d --build
```

### 4.2 Verifikasi Semua Container Sehat
```bash
docker compose -f docker/docker-compose.prod.yml ps
```
Pastikan ke-5 container (`cadra_pos_mysql_prod`, `cadra_pos_redis_prod`, `cadra_pos_api_prod`, `cadra_pos_web_prod`, `cadra_pos_nginx_prod`) berstatus **`Up` / `healthy`**. Cek health check API:
```bash
curl -s http://localhost/health
# Output diharapkan: {"status":"ok","service":"cadra-pos-api","timestamp":"..."}
```

---

## 5. Tahap 4 — Inisialisasi Database & Pengamanan Akun Awal

### 5.1 Push Skema Database & Seed Master Awal
```bash
# 1. Buat seluruh tabel MySQL 8 dari prisma/schema.prisma
docker exec -it cadra_pos_api_prod npx prisma db push

# 2. Seed Role, 17 Permission, Outlet, Pengaturan PB1/Service, & Akun Awal
docker exec -it cadra_pos_api_prod pnpm db:seed
```

### 5.2 Ganti Password & PIN Default (WAJIB SEBELUM GO-LIVE)
1. Buka `https://pos.kopisenja.id/login` dan login sebagai Owner (`owner@senja.id` / `password123` atau PIN `1111`).
2. Masuk ke **`/admin/rbac`** → tab **Daftar Staf**.
3. Klik ikon pensil (**Edit Akun**) pada setiap staf, ganti **Password** dan **PIN 4–6 digit** ke kredensial asli outlet, atau hapus akun demo yang tidak dipakai.
4. Masuk ke **`/admin/settings`** → perbarui **Nama Bisnis**, **Alamat**, **Telepon**, **Footer Struk**, serta verifikasi tarif **PB1 (10%)**, **Service Charge (5%)**, dan **Pembulatan (Rp100)**.

---

## 6. Tahap 5 — Setup Domain & HTTPS (SSL Let's Encrypt)

### 6.1 Arahkan DNS Domain (`tumpu.biz.id` & `pos.tumpu.biz.id`)
Di panel DNS domain Anda (Cloudflare / Niagahoster / Rumahweb), buat **2 A Record**:
- **Host/Name:** `@` (untuk `tumpu.biz.id` — Landing Page) → `IP_PUBLIK_VPS_ANDA` (atau CNAME ke Vercel/Cloudflare Pages)
- **Host/Name:** `pos` (untuk `pos.tumpu.biz.id` — Aplikasi Tumpu POS) → `IP_PUBLIK_VPS_ANDA`

Verifikasi DNS sudah mengarah ke VPS:
```bash
dig +short tumpu.biz.id pos.tumpu.biz.id
```

### 6.2 Pasang Reverse Proxy HTTPS dengan Caddy (Dual-Domain SSL Otomatis)
Jika ingin SSL otomatis tanpa ribet konfigurasi manual Certbot:
1. Ubah port Nginx di `docker/docker-compose.prod.yml` menjadi `127.0.0.1:8080:80` (untuk `pos.tumpu.biz.id`) dan jalankan `landing/` di port `3005` (atau deploy `landing/` ke Vercel/Cloudflare Pages).
2. Install Caddy di host Ubuntu:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install -y caddy
   ```
3. Edit `/etc/caddy/Caddyfile`:
   ```caddyfile
   tumpu.biz.id, www.tumpu.biz.id {
       encode gzip zstd
       reverse_proxy 127.0.0.1:3005
   }

   pos.tumpu.biz.id {
       encode gzip zstd
       reverse_proxy 127.0.0.1:8080
   }
   ```
4. Reload Caddy:
   ```bash
   sudo systemctl reload caddy
   ```
   Caddy otomatis menerbitkan sertifikat SSL Let's Encrypt, mengaktifkan HTTPS (443), HTTP/2, dan WebSocket (`/socket.io/`) untuk KDS!

### 6.3 Konfigurasi Cloudflare DNS & SSL/TLS (`tumpu.biz.id`)
Karena nameserver `tumpu.biz.id` sudah diarahkan ke **Cloudflare**, `docker/nginx.conf` telah dikonfigurasi agar mempertahankan IP asli pengunjung (`CF-Connecting-IP` → `$client_real_ip` untuk rate-limit auth yang akurat) dan protokol HTTPS (`X-Forwarded-Proto`).

1. **DNS Records di Cloudflare Dashboard** (arahkan semua ke `IP_PUBLIK_VPS_ANDA` dengan status **Proxied / Awan Oranye ON**):
   - `A` `@` (`tumpu.biz.id`) → Landing Page
   - `A` `www` (`www.tumpu.biz.id`) → Landing Page
   - `A` `pos` (`pos.tumpu.biz.id`) → Tumpu POS Web App
   - `A` `app-api` (`app-api.tumpu.biz.id`) → POS API + Socket.IO KDS
   - `A` `admin` (`admin.tumpu.biz.id`) → Back Office Web
   - `A` `admin-api` (`admin-api.tumpu.biz.id`) → Back Office API
2. **Pengaturan SSL/TLS & Network di Cloudflare:**
   - **SSL/TLS Encryption Mode:** Pilih **`Flexible`** jika origin VPS hanya membuka port `80` (Nginx container), atau **`Full (Strict)`** jika Anda memasang **Cloudflare Origin Certificate** / Caddy di port `443`.
   - **Always Use HTTPS:** `ON`
   - **Network → WebSockets:** Pastikan **`ON`** agar real-time Socket.IO pada `app-api.tumpu.biz.id/socket.io/` berjalan lancar ke layar KDS.

---

## 7. Opsi B — Deployment On-Premise (Mini PC di Outlet / LAN Lokal)

Untuk cafe/rumah makan yang menginginkan **0% ketergantungan internet** antara Kasir Tablet dan Layar Dapur KDS:

1. **Koneksi Kabel LAN:** Colokkan Mini PC (Ubuntu Server) langsung ke port LAN router Wi-Fi outlet.
2. **Atur Static IP di Router (DHCP Reservation):** Kunci MAC Address Mini PC ke IP statis, misalnya `192.168.1.50`.
3. **Konfigurasi `docker/.env` untuk LAN:**
   ```env
   CORS_ORIGIN=http://192.168.1.50
   NEXT_PUBLIC_API_URL=http://192.168.1.50/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://192.168.1.50
   ```
4. **Jalankan Docker Compose Produksi:**
   ```bash
   cd /opt/cadra-pos
   docker compose --env-file docker/.env -f docker/docker-compose.prod.yml up -d --build
   docker exec -it cadra_pos_api_prod npx prisma db push
   docker exec -it cadra_pos_api_prod pnpm db:seed
   ```
5. **Pasang di Perangkat Outlet (PWA Fullscreen):**
   - **Tablet Kasir (iPad/Android):** Sambungkan ke Wi-Fi outlet → buka `http://192.168.1.50/pos` di Chrome/Safari → pilih **Add to Home Screen** agar tampil fullscreen layaknya aplikasi native.
   - **Layar Dapur / Bar (KDS):** Buka `http://192.168.1.50/kds` → login PIN Dapur (`5678`) → pilih stasiun (`Bar & Kopi` / `Dapur Panas` / `Pastry`) → tekan `F11` (fullscreen).

---

## 8. Otomasi Backup Harian & Prosedur Restore

### 8.1 Buat Script Backup (`/opt/cadra-pos/scripts/backup.sh`)
```bash
mkdir -p /opt/cadra-pos/scripts /var/backups/cadra-pos
cat <<'EOF' > /opt/cadra-pos/scripts/backup.sh
#!/usr/bin/env bash
set -euo pipefail
source /opt/cadra-pos/docker/.env
STAMP=$(date +%F_%H%M)
OUT="/var/backups/cadra-pos/pos-${STAMP}.sql.gz"

docker exec cadra_pos_mysql_prod mysqldump \
  --single-transaction --routines --triggers \
  -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" | gzip > "${OUT}"

# Hapus backup lebih lama dari 30 hari
find /var/backups/cadra-pos -name "pos-*.sql.gz" -type f -mtime +30 -delete
echo "[OK] Backup tersimpan: ${OUT}"
EOF
chmod +x /opt/cadra-pos/scripts/backup.sh
```

### 8.2 Jadwalkan Cron Harian (02:30 WIB)
```bash
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/cadra-pos/scripts/backup.sh >> /var/log/cadra-backup.log 2>&1") | crontab -
```
> **Best Practice Off-Site:** Tambahkan `rclone copy /var/backups/cadra-pos gdrive:Backup-Cadra-POS` di akhir `backup.sh` agar salinan backup selalu aman di luar server jika SSD rusak.

### 8.3 Prosedur Restore dari Backup
```bash
# 1. Hentikan API sementara agar tidak ada transaksi masuk saat restore
docker stop cadra_pos_api_prod

# 2. Restore file .sql.gz pilihan Anda
source /opt/cadra-pos/docker/.env
gunzip -c /var/backups/cadra-pos/pos-2026-11-20_0230.sql.gz | \
  docker exec -i cadra_pos_mysql_prod mysql -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}"

# 3. Nyalakan kembali API & verifikasi /health
docker start cadra_pos_api_prod
curl -fsS http://localhost/health
```

---

## 9. Prosedur Update Rilis & Rollback

### 9.1 Update Rilis Baru (Lakukan di Luar Jam Operasional)
```bash
# 1. Backup wajib sebelum update
/opt/cadra-pos/scripts/backup.sh

# 2. Tarik kode terbaru & rebuild container
cd /opt/cadra-pos
git pull origin main
docker compose --env-file docker/.env -f docker/docker-compose.prod.yml up -d --build

# 3. Sinkronisasi skema database (jika ada perubahan prisma/schema.prisma)
docker exec -it cadra_pos_api_prod npx prisma db push

# 4. Verifikasi health check & log
curl -fsS http://localhost/health
docker compose -f docker/docker-compose.prod.yml logs --tail=30 api web
```

### 9.2 Rollback Cepat Jika Terjadi Kendala
```bash
cd /opt/cadra-pos
git log --oneline -n 5
git checkout <COMMIT_SEBELUMNYA>
docker compose --env-file docker/.env -f docker/docker-compose.prod.yml up -d --build
# Jika perlu, restore database dari backup langkah 9.1 (lihat Bagian 8.3)
```

---

## 10. Monitoring & Troubleshooting Produksi

| Gejala | Perintah Diagnosa | Solusi |
| :--- | :--- | :--- |
| **502 Bad Gateway** | `docker compose -f docker/docker-compose.prod.yml ps` & `logs --tail=50 api web` | Pastikan `api` & `web` sudah `Up`; jika crash karena OOM saat build, pastikan swap 2 GB aktif. |
| **KDS tidak update realtime** | Cek DevTools → Network → WS `/socket.io/` | Pastikan `NEXT_PUBLIC_SOCKET_URL` cocok dengan domain HTTPS dan reverse proxy mengizinkan header `Upgrade: websocket`. |
| **Error CORS di browser** | Cek log browser & `docker/.env` | Pastikan `CORS_ORIGIN` sama persis (termasuk `https://`, tanpa trailing slash `/`) dengan URL browser. |
| **MySQL tidak mau start** | `df -h` & `docker logs cadra_pos_mysql_prod` | Cek sisa ruang disk SSD dan bersihkan image Docker lama dengan `docker image prune -f`. |
| **Log audit & transaksi harian** | `docker exec -it cadra_pos_api_prod npx prisma studio` (sementara) atau `/admin/settings` | Cek tab Audit Log di dashboard Owner. |

---

## 11. Checklist Final Go-Live
- [ ] Seluruh password & PIN default sudah diganti melalui `/admin/rbac`.
- [ ] `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET` acak 64-karakter dan `docker/.env` berizin `600`.
- [ ] Firewall UFW aktif (hanya port 22, 80, 443 terbuka; MySQL & Redis tertutup dari publik).
- [ ] HTTPS aktif & terverifikasi (gembok hijau di browser, WebSocket KDS tersambung `wss://`).
- [ ] Cron backup harian berjalan & minimal 1 kali uji restore berhasil.
- [ ] Uji cetak struk thermal 58/80mm + uji transaksi offline (matikan Wi-Fi → bayar tunai `OFF-` → nyalakan Wi-Fi → ter-sync otomatis).
