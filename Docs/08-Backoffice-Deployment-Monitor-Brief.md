# Feature Brief: Back Office Deployment Monitor

**Status:** Draft / Ready for Implementation  
**Owner:** DevOps & Platform Engineering  
**Target Apps:** `apps/backoffice`, `apps/admin-api`, `kassa-webhook` (Host VM `kassa`), `docker/deploy.sh`

---

## 1. Tujuan

Memberikan visibilitas penuh bagi **Superadmin** di Back Office (`https://admin.kassa.biz.id/deployments`) untuk:
- Memantau proses auto-deploy dari GitHub (`push` ke `main`) secara real-time.
- Melihat log build & health check setiap deployment langsung dari dashboard.
- Mengecek status kesehatan seluruh 5 layanan produksi & container Docker.
- Memicu deployment manual (smart rebuild atau force rebuild all) tanpa perlu akses terminal/SSH.

---

## 2. Arsitektur Integrasi (Tanpa Expose Docker Socket ke Container)

Karena `admin-api` berjalan di dalam container Docker sedangkan `docker/deploy.sh` dan `kassa-webhook` berjalan di host VM `kassa`:

```text
GitHub Push (main)
   │ (HMAC-SHA256 via https://deploy.kassa.biz.id/webhook)
   ▼
[Host VM: kassa-webhook :9000]  ◄──(Internal Bearer Token)──►  [Container: admin-api :4001]
   ├── Jalankan docker/deploy.sh                                     │ (Platform Superadmin JWT)
   ├── Simpan metadata per run (history.json)                        ▼
   └── Simpan log per run (logs/<runId>.log)                  [Back Office Web: /deployments]
```

### Perubahan Infrastruktur Minimal
1. Tambahkan `extra_hosts` pada service `admin-api` di `docker/docker-compose.prod.yml`:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```
2. Tambahkan env var berikut pada `admin-api` dan `/home/boxd/kassa-webhook/.env`:
   - `DEPLOY_AGENT_URL=http://host.docker.internal:9000`
   - `DEPLOY_INTERNAL_TOKEN=<random-32-byte-hex>`

---

## 3. Scope Fitur di UI (`apps/backoffice`)

Tambahkan menu **"Deployments"** di sidebar Back Office dengan route:
`apps/backoffice/src/app/(dashboard)/deployments/page.tsx`

### 3.1. Current Status & Quick Actions (Header)
- **Live Status Badge:** `IDLE`, `DEPLOYING` (pulse indicator), `SUCCESS`, atau `FAILED`.
- **Active Production Commit:** short SHA (link ke commit GitHub), commit message, author, timestamp deploy terakhir, dan durasi.
- **Manual Actions** (dengan modal konfirmasi):
  - **Deploy Latest (`main`)** — pull commit terbaru & rebuild hanya service yang berubah.
  - **Force Rebuild All** — rebuild ulang seluruh 5 service secara berurutan (`api`, `admin-api`, `web`, `landing`, `backoffice`).
  - Kedua tombol otomatis **disabled** saat status sedang `DEPLOYING`.

### 3.2. Service Health & Container Status Strip
Kartu ringkas status 5 layanan + infra:
- **Landing Page** (`https://kassa.biz.id`)
- **POS Web** (`https://app.kassa.biz.id`)
- **POS API** (`https://app-api.kassa.biz.id/health`)
- **Back Office** (`https://admin.kassa.biz.id`)
- **Admin API** (`https://admin-api.kassa.biz.id/health`)
- **Infra:** `mysql` (healthy), `redis`, `nginx`

Setiap kartu menampilkan HTTP status (`200 OK` / error) dan status/uptime container (`Up Xh`).

### 3.3. Deployment History Table
Menampilkan 30 riwayat deployment terakhir dengan kolom:
- **Run ID & Waktu** (WIB/WITA)
- **Trigger** (`github-push` / `manual-backoffice`)
- **Commit** (short SHA + link GitHub + ringkasan commit message)
- **Services Rebuilt** (badge: `api`, `admin-api`, `web`, `landing`, `backoffice`, atau `none`)
- **Durasi** (mis. `42s`)
- **Status** (`running` / `success` / `failed`)

### 3.4. Live Log Viewer (Drawer / Panel)
- Klik salah satu baris riwayat → buka panel terminal (monospace, dark theme).
- Jika run berstatus `running`, lakukan polling tiap **2 detik** menggunakan incremental byte `offset` + auto-scroll ke baris terbaru hingga status selesai.
- Sediakan tombol **Copy Log** dan **Refresh**.

---

## 4. Kontrak API

### 4.1. Host Agent (`kassa-webhook` port `9000`)
Semua endpoint `/internal/*` wajib menyertakan header `Authorization: Bearer <DEPLOY_INTERNAL_TOKEN>` dan hanya menerima request dari loopback / Docker bridge (`127.0.0.1`, `::1`, `172.16.0.0/12`):

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/internal/status` | Status deploy aktif, `HEAD` commit saat ini, health 5 service, status container (`docker compose ps --format json`). |
| `GET` | `/internal/deployments?limit=30` | Daftar riwayat deploy terbaru dari `/home/boxd/kassa-webhook/history.json`. |
| `GET` | `/internal/deployments/:id/logs?offset=0` | Potongan log dari `/home/boxd/kassa-webhook/logs/<id>.log` mulai byte `offset`, plus `nextOffset` dan `status`. |
| `POST` | `/internal/deploy` | Body: `{ "rebuildAll": boolean, "triggeredBy": string }`. Return `202 Accepted` + `{ "runId": "..." }`, atau `409 Conflict` jika sedang ada deploy berjalan. |

#### Skema Metadata Run (`history.json`)
```json
{
  "id": "dep_20261121_173428_fbc2eb3",
  "trigger": "github-push",
  "triggeredBy": "ahdirmai",
  "branch": "main",
  "fromSha": "20695ab",
  "toSha": "fbc2eb3",
  "commitMessage": "feat(web): offline-first PWA sync engine",
  "servicesRebuilt": ["web"],
  "status": "success",
  "startedAt": "2026-11-21T17:33:11Z",
  "finishedAt": "2026-11-21T17:34:28Z",
  "durationSec": 77,
  "exitCode": 0
}
```

### 4.2. Back Office API (`apps/admin-api/src/modules/backoffice/`)
Semua endpoint diproteksi middleware **Platform Superadmin JWT**:

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/backoffice/deployments/status` | Proxy ke `/internal/status`. |
| `GET` | `/api/v1/backoffice/deployments` | Proxy ke `/internal/deployments`. |
| `GET` | `/api/v1/backoffice/deployments/:id/logs` | Proxy ke `/internal/deployments/:id/logs`. |
| `POST` | `/api/v1/backoffice/deployments/trigger` | Proxy ke `/internal/deploy` + tulis log ke `PlatformAuditLog` (`action: "TRIGGER_DEPLOY"`). |

---

## 5. Keamanan & Guardrails

- **Layered Auth:** Browser → `admin-api` (Platform Superadmin JWT) → `kassa-webhook` (`DEPLOY_INTERNAL_TOKEN` + IP allowlist lokal/Docker bridge).
- **Publik Terisolasi:** Request publik ke `https://deploy.kassa.biz.id/internal/*` selalu ditolak (`401`/`403`). Endpoint publik yang diizinkan hanya `GET /health` dan `POST /webhook` (dengan verifikasi HMAC-SHA256 GitHub).
- **Concurrency Safety:** Tetap gunakan `flock` di `docker/deploy.sh` + in-memory/file lock di `kassa-webhook` agar tidak pernah terjadi dua build bersamaan.
- **Log Retention:** Simpan maksimal **50 file log** terakhir di `/home/boxd/kassa-webhook/logs/` (auto-prune log tertua setiap run baru dimulai).
- **Secret Redaction:** Pastikan `deploy.sh` tidak pernah mencetak isi `.env`, token, atau password ke stdout/stderr.

---

## 6. Acceptance Criteria (Definition of Done)

- [ ] Push ke branch `main` otomatis muncul di halaman `/deployments` dengan status `running`, log mengalir live via polling incremental, lalu berubah ke `success` atau `failed` beserta durasi & daftar service yang di-rebuild.
- [ ] Klik **"Deploy Latest"** atau **"Force Rebuild All"** dari Back Office berhasil memicu deploy di host VM `kassa` dan tercatat di `PlatformAuditLog`.
- [ ] Saat deploy sedang berjalan, request trigger kedua mengembalikan `409 Conflict` dan tombol trigger di UI otomatis nonaktif.
- [ ] Request ke `https://deploy.kassa.biz.id/internal/*` dari internet publik atau tanpa `DEPLOY_INTERNAL_TOKEN` valid selalu ditolak (`401`/`403`).
- [ ] Status health 5 service (`kassa.biz.id`, `app`, `app-api`, `admin`, `admin-api`) tampil akurat di halaman `/deployments`.
