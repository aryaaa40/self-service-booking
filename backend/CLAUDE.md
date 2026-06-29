# Project: Sistem Booking & Rekonsiliasi Klinik

## Referensi

Studi kasus **Halodoc** (platform kesehatan digital, 20M+ pengguna aktif bulanan).
Pola arsitektur yang dipelajari dari Halodoc Engineering Blog:

- Auth scaling dengan JWT (bottleneck connection pooling)
- Event-driven architecture menggunakan Kafka (versi mini: RabbitMQ)
- Sistem rekonsiliasi finansial async dengan event processing

## Stack

- **Runtime**: Node.js v22 + TypeScript
- **Framework**: NestJS 11
- **Database**: PostgreSQL 16 (via Docker)
- **ORM**: TypeORM 1.0.0
- **Cache**: Redis 7 (via Docker) — aktif di Topik 3
- **Queue**: RabbitMQ 3 (via Docker) — aktif di Topik 5
- **Validation**: class-validator + class-transformer
- **Config**: @nestjs/config + dotenv

## Data Model

```
dokter        (id, nama, spesialisasi, klinik_id)
jadwal_dokter (id, dokter_id, tanggal, jam_mulai, jam_selesai, kapasitas)
pasien        (id, nama, nik[unique], jenis_pasien[bpjs|umum], gender[laki_laki|perempuan],
                no_bpjs[nullable,unique], no_hp[nullable], email[nullable])
rujukan       (id, pasien_id, spesialisasi_tujuan, rs_asal, tanggal_berlaku, tanggal_expired,
                status[aktif|expired])
booking       (id, pasien_id, jadwal_dokter_id, status, nomor_antrian[nullable], created_at)
                status: pending | confirmed | cancelled
pembayaran    (id, booking_id, jumlah, status, created_at)
                status: pending | success | failed
rekonsiliasi  (id, booking_id, jumlah_seharusnya, jumlah_dibayar, selisih, status)
                status: match | selisih | pending
```

## API Endpoints (CRUD Dasar)

```
GET    /dokter              Semua dokter
GET    /dokter/:id          Detail dokter
POST   /dokter              Tambah dokter

GET    /pasien              Semua pasien
GET    /pasien/:id          Detail pasien
POST   /pasien              Tambah pasien

GET    /jadwal              Jadwal tersedia (query: ?tanggal=&dokter_id=&spesialisasi=&dari_tanggal=)
GET    /jadwal/:id          Detail jadwal
POST   /jadwal              Tambah jadwal

GET    /booking             Semua booking
GET    /booking/:id         Detail booking
POST   /booking             Buat booking (cek kapasitas + validasi rujukan BPJS)
PATCH  /booking/:id/cancel  Cancel booking

GET    /kiosk/cari          Cari pasien via kiosk (query: ?nik=&no_bpjs=)

POST   /rujukan             Tambah rujukan baru (admin)
GET    /rujukan/:pasien_id  Lihat semua rujukan pasien
PATCH  /rujukan/:id/perpanjang  Perpanjang rujukan expired
```

## Response Format (API Envelope)

```json
// Success
{ "meta": { "success": true, "message": "...", "statusCode": 200 }, "data": {} }

// Error
{ "meta": { "success": false, "message": "...", "statusCode": 400 }, "data": null }
```

Diimplementasi via `TransformInterceptor` + `HttpExceptionFilter` (global).

## Roadmap Belajar (urutan wajib)

- [x] 1. Database design & optimization (index, constraint, EXPLAIN ANALYZE)
- [x] 2. Database connection pooling (pool size, load test dengan k6)
- [x] 3. Caching strategy (Redis, cache-aside, TTL, cache invalidation)
- [x] 4. Rate limiting & throttling (per user/IP, SELECT FOR UPDATE, race condition)
- [x] 5. Message queue & async processing (RabbitMQ, event ordering, rekonsiliasi)

> Cara kerja sesi: setiap topik/fase selesai → CLAUDE.md diupdate → `/clear` → sesi baru dimulai dengan prompt:
> - Topik 1–5: "lanjut ke topik X, cek CLAUDE.md dulu"
> - Fase 1–4: "lanjut ke Fase X pengembangan lanjutan, cek CLAUDE.md dan baca pengembangan-lanjutan-brief-v1.md dulu"

## Progress & Keputusan Penting

### Skeleton (selesai)

- TypeORM 1.0.0: breaking change — `relations` harus object `{ dokter: true }`, bukan array `['dokter']`
- Port PostgreSQL dipindah ke **5435** karena konflik: port 5432 dipakai PostgreSQL lokal Windows, 5433 & 5434 dipakai project lain
- ESLint `no-unsafe-assignment` pada `Not()` dari TypeORM — root cause: `FindOperator` mengandung `any` di internal type-nya. Solusi: eslint-disable per baris
- Docker volume harus di-reset kalau ganti `POSTGRES_PASSWORD` — env var hanya dibaca saat inisialisasi pertama

### Topik 1 — Database Design & Optimization (selesai)

- **Apa yang ditambahkan:**
  - `@Index` decorator pada semua entity: `booking`, `jadwal_dokter`, `pembayaran`, `rekonsiliasi`
  - `@Unique(['pasien_id', 'jadwal_dokter_id'])` di `booking` sebagai business rule anti-double booking
  - Fix N+1 di `jadwal.service.ts` `findTersedia()`: dari `Promise.all` + loop query → `createQueryBuilder` dengan correlated subquery COUNT, sehingga dari N+1 queries menjadi 1 query

- **Keputusan penting & alasannya:**
  - Composite index `(jadwal_dokter_id, status)` di booking — karena `POST /booking` selalu query keduanya bersamaan saat cek kapasitas slot; kolom paling selektif (`jadwal_dokter_id`) ditaruh pertama
  - Composite index `(tanggal, dokter_id)` di jadwal_dokter — karena `GET /jadwal` selalu filter by `tanggal` dan opsional `dokter_id`; `tanggal` duluan karena lebih sering dipakai sendiri tanpa `dokter_id`
  - Index pada FK (`pasien_id`, `booking_id`, dll.) ditambah manual — TypeORM hanya buat constraint FK, bukan index-nya

- **Pitfall yang perlu diingat:**
  - Seq Scan pada tabel kecil adalah perilaku **benar dan optimal** — PostgreSQL cost-based optimizer pilih strategi termurah; index scan baru menang saat data besar karena random I/O (cost ×4) kalah efisien vs sequential I/O untuk tabel kecil
  - `!=` (`<>`) tidak bisa jadi `Index Cond`, hanya jadi `Filter` — index tetap mempersempit data via kolom lain, lalu filter diterapkan di atas hasilnya
  - `@Unique` di TypeORM adalah class-level decorator, bukan column-level

### Topik 2 — Database Connection Pooling (selesai)

- **Apa yang ditambahkan:**
  - Konfigurasi explicit pool di `app.module.ts` via `extra: { max, min, idleTimeoutMillis, connectionTimeoutMillis }`
  - `DB_POOL_MAX` dan `DB_POOL_MIN` di `.env` agar pool size bisa dikonfigurasi tanpa hardcode
  - Load test script `load-test/booking.js` menggunakan k6
  - Fix `booking.service.ts`: tangkap `QueryFailedError` dengan `driverError.code === '23505'` → throw `ConflictException` (409)

- **Hasil load test (GET /booking):**
  - Pool=2, 20 VUs, sleep 0.1s → p(95)=20.94ms, 0 error, 181 req/s
  - Pool=10, 50 VUs, no sleep → p(95)=165.44ms, 0 error, 442 req/s

- **Keputusan penting & alasannya:**
  - Pool exhaustion tidak terlihat di GET endpoint karena query <10ms dan koneksi langsung dilepas — dampak nyata baru muncul di query lambat atau transaksi panjang (akan terlihat di Topik 4 dengan `SELECT FOR UPDATE`)
  - Rule of thumb pool size: `(jumlah core × 2) + 1` sebagai starting point, lalu tune berdasarkan hasil load test
  - `connectionTimeoutMillis: 3000` — request yang tidak dapat koneksi dalam 3s akan throw error, bukan antri selamanya

- **Pitfall yang perlu diingat:**
  - TypeORM tidak mengatur pool secara eksplisit tanpa `extra` — ukuran pool bergantung default `pg-pool` (10) yang tidak terlihat di kode
  - Pool exhaustion lebih berbahaya saat ada transaksi panjang, bukan sekedar query SELECT cepat
  - k6 menghitung semua non-2xx sebagai `http_req_failed` — hindari threshold ini kalau endpoint bisa return 4xx yang valid (misal 409)

### Topik 3 — Caching Strategy (selesai)

- **Apa yang ditambahkan:**
  - `CacheModule.registerAsync()` dengan `@keyv/redis` di `app.module.ts` (`isGlobal: true`)
  - Cache-aside di `dokter.service.ts`: `GET /dokter` → TTL 5 menit, invalidate saat `POST /dokter`; `GET /dokter/:id` → TTL 5 menit
  - Cache-aside di `jadwal.service.ts`: `GET /jadwal` → TTL 60 detik (TTL only); `GET /jadwal/:id` → TTL 5 menit
  - Cross-module invalidation di `booking.service.ts`: `POST /booking` dan `PATCH /cancel` → `cache.del('klinik:jadwal:detail:{id}')`
  - Env vars baru: `REDIS_HOST`, `REDIS_PORT`

- **Keputusan penting & alasannya:**
  - `GET /jadwal` (list tersedia) pakai TTL only 60 detik — cache key bergantung kombinasi query params (`tanggal` + `dokter_id`), BookingService tidak bisa tahu kombinasi mana yang sudah di-cache; stale 60 detik acceptable karena booking tetap validasi ulang ke DB
  - `GET /dokter` pakai explicit invalidation saat `POST /dokter` — cache key predictable (`klinik:dokter:all`), stale data mengganggu UX admin yang baru tambah dokter
  - BookingService bertanggung jawab invalidate cache jadwal — prinsip: yang mengubah data yang bertanggung jawab membersihkan cache terdampak (sama dengan prinsip event emitter di Topik 5)
  - Key naming convention: `klinik:{entity}:{subtype}:{id_atau_params}` — prefix `klinik:` memudahkan `KEYS klinik:*` saat debugging

- **Pitfall yang perlu diingat:**
  - `cache-manager` v6 TTL dalam **milliseconds** — `cache.set(key, val, 300)` artinya 300ms, bukan 300 detik; `300_000` = 5 menit
  - Redis `TTL` command return **detik**, bukan ms — Keyv konversi otomatis saat set ke Redis
  - Keyv simpan value sebagai JSON `{"value":...,"expires":...}` di Redis — `GET key` di redis-cli tidak return plain value
  - Cache baru terisi setelah request pertama (lazy populate) — Redis kosong sebelum ada API call adalah perilaku normal, bukan error

- **Apa yang sengaja di luar scope topik ini:**
  - Cache untuk `GET /booking` dan `GET /pasien` — booking sering berubah dan relasi nested kompleks; pasien tidak ada use case high-traffic
  - Pattern-based invalidation (`SCAN` + `DEL`) untuk jadwal tersedia — diputuskan TTL lebih practical
  - Cache stampede / dogpile prevention — relevan di traffic sangat tinggi, bukan fokus topik ini

### Topik 4 — Rate Limiting & Throttling (selesai)

- **Apa yang ditambahkan:**
  - `@nestjs/throttler` — global rate limiting (100 req/menit per IP) via `ThrottlerModule.forRoot()` + `ThrottlerGuard` sebagai `APP_GUARD` di `app.module.ts`
  - Per-route override `@Throttle({ global: { ttl: 60_000, limit: 5 } })` di `POST /booking` — lebih ketat karena endpoint costly
  - Refactor `POST /booking` di `booking.service.ts`: dari repository biasa → `QueryRunner` dengan `lock: { mode: 'pessimistic_write' }` (SELECT FOR UPDATE) untuk mencegah race condition
  - Load test `load-test/concurrent-booking.js` — 9 VU serentak ke slot kapasitas 1; terbukti hanya 1 berhasil (201), sisanya 400

- **Keputusan penting & alasannya:**
  - Global limiter (100/menit) sebagai baseline protection infrastruktur — berlapis dengan per-route limiter, tidak saling menggantikan
  - Per-route limit lebih ketat di `POST /booking` (5/menit) — endpoint costly dan tidak masuk akal dipanggil cepat oleh user normal
  - `SELECT FOR UPDATE` (`pessimistic_write`) dipilih daripada optimistic lock — booking klinik butuh kepastian slot, bukan retry; transaksi cukup cepat (<300ms) sehingga blocking tidak jadi masalah latency
  - Cache invalidation dilakukan setelah `commitTransaction()` — kalau rollback terjadi setelah invalidate, cache jadi stale tanpa data baru

- **Pitfall yang perlu diingat:**
  - Load test rate limiter dari 1 IP akan blok semua VU seolah 1 user — di production tiap user punya IP sendiri, behavior benar; test rate limiting dan SELECT FOR UPDATE harus dipisah
  - PostgreSQL sequence tidak ikut rollback — id booking loncat jauh setelah banyak transaksi gagal; ini normal, id hanya perlu unique bukan sequential
  - `QueryRunner` harus selalu di-`release()` di `finally` — kalau tidak, koneksi tidak kembali ke pool → pool exhaustion
  - ESLint `no-unsafe-call` pada `@Throttle()` dan `ThrottlerModule.forRoot()` — root cause: internal type `any` di library; solusi: `eslint-disable-next-line` per baris (sama dengan `Not()` dari Topik 1)

- **Apa yang sengaja di luar scope topik ini:**
  - Distributed rate limiting via Redis (untuk multi-instance deployment)
  - Custom key generator (rate limit per user ID dari JWT, bukan per IP)
  - Optimistic locking — relevan untuk use case yang toleran terhadap retry
  - Distributed lock (Redis SETNX) — overkill untuk skala klinik ini

### Topik 5 — Message Queue & Async Processing (selesai)

- **Apa yang ditambahkan:**
  - `@golevelup/nestjs-rabbitmq` sebagai NestJS wrapper untuk RabbitMQ
  - `RabbitmqModule` (`@Global()`) di `src/rabbitmq/` — sekali daftar di `app.module.ts`, `AmqpConnection` tersedia di seluruh app tanpa re-import
  - `src/rabbitmq/events.ts` — interface payload: `BookingCreatedEvent`, `BookingCancelledEvent`, `PaymentProcessedEvent`
  - Exchange `klinik.exchange` (direct) + `klinik.dlx` (Dead Letter Exchange)
  - 3 queue durable: `booking.created.q`, `booking.cancelled.q`, `payment.processed.q` — semua dengan `x-dead-letter-exchange: klinik.dlx`
  - `RekonsiliasisConsumer` — 3 handler `@RabbitSubscribe` untuk tiap event type
  - `RekonsiliasisService` — logic idempotent: catch `23505` saat insert duplikat, no-op saat delete yang tidak ada
  - `RekonsiliasisController` — `GET /rekonsiliasi` dan `GET /rekonsiliasi/:id`
  - `PembayaranService` + `POST /pembayaran` — simulasi pembayaran yang publish `payment.processed`
  - `BookingService` — publish `booking.created` dan `booking.cancelled` setelah commit/save
  - `HttpThrottlerGuard` di `src/common/guards/` — extend `ThrottlerGuard`, skip throttling untuk non-HTTP context

- **Keputusan penting & alasannya:**
  - Publish event SETELAH `commitTransaction()` dan `cache.del()` — kalau publish sebelum commit dan transaksi rollback, consumer memproses event untuk data yang tidak ada di DB
  - `jumlahSeharusnya: 150000` di-hardcode di `BookingService` sebagai simulasi biaya konsultasi — di production nilainya dari field `biaya` di tabel jadwal atau tarif dokter
  - `handleBookingCancelled` menghapus record rekonsiliasi (bukan set status cancelled) — menghindari perlu ALTER ENUM PostgreSQL yang tidak trivial dengan `synchronize: true`
  - `RabbitmqModule` dibuat `@Global()` agar `AmqpConnection` tidak perlu di-import ulang di tiap module yang butuh publish event

- **Pitfall yang perlu diingat:**
  - `APP_GUARD` global di NestJS berlaku untuk SEMUA handler termasuk RabbitMQ consumer — guard yang butuh HTTP context (ThrottlerGuard) harus di-override dengan cek `context.getType() !== 'http'`; solusinya `HttpThrottlerGuard`
  - `@golevelup/nestjs-rabbitmq` default: NACK + requeue saat consumer throw error — pesan tidak hilang, tapi bisa infinite retry loop (poison message); DLX mencegah ini
  - At-least-once delivery: consumer bisa menerima pesan yang sama lebih dari sekali — idempotency wajib, bukan opsional
  - TypeORM membaca kolom `decimal` PostgreSQL sebagai `string` di runtime meski type TypeScript `number` — wajib `Number()` sebelum operasi aritmatika, kalau tidak jadi string concatenation
  - Queue baru ter-deklarasi saat ada consumer aktif (`@RabbitSubscribe`) — queue tidak muncul di Management UI sebelum app pertama kali dijalankan

- **Apa yang sengaja di luar scope topik ini:**
  - Flow `booking → confirmed` setelah pembayaran sukses — data model menyebut status `confirmed` tapi belum diimplementasi (masuk Fase 1 pengembangan lanjutan)
  - Outbox pattern — solusi proper untuk "publish setelah commit" yang lebih reliable
  - Retry dengan exponential backoff — butuh RabbitMQ plugin delay queue
  - Saga pattern — untuk transaksi terdistribusi multi-service

### Fase 1 — Redesign Data Model & Seed Data (selesai)

- **Apa yang ditambahkan:**
  - Entity `pasien` diupdate: hapus `email` NOT NULL, tambah `nik` (unique), `jenis_pasien` (enum: bpjs|umum), `gender` (enum: laki_laki|perempuan), `no_bpjs` (nullable unique), `no_hp` & `email` jadi nullable
  - Entity baru `rujukan` + `RujukanModule` di `src/rujukan/`
  - Kolom `nomor_antrian` (nullable int) ditambah ke entity `booking`
  - Seed script `src/seed/seed.ts` — 25 dokter (20 spesialisasi), ±400 jadwal 30 hari, 43 pasien, 25 rujukan

- **Keputusan penting & alasannya:**
  - Seed pakai `synchronize: true` agar bisa buat tabel sendiri tanpa perlu jalankan app dulu
  - NIK di seed pakai prefix berbeda per grup (aktif/expired/no-rujukan/umum) untuk kemudahan testing — tidak realistis, acceptable untuk portofolio
  - Reset Docker volume (`docker compose down -v`) wajib sebelum jalankan app pertama kali setelah ubah entity pasien

### Fase 2 — Endpoint Kiosk & Update Logika Booking (selesai)

- **Apa yang ditambahkan (2A, 2B, 2C, 2D, 2E):**
  - `KioskModule` + `GET /kiosk/cari?nik=&no_bpjs=` — return pasien + rujukan aktif (jika BPJS)
  - `GET /jadwal` diupdate dengan filter `spesialisasi` (join ke dokter) dan `dari_tanggal` (range >=), plus `ORDER BY tanggal, jam_mulai ASC`
  - `POST /booking` diupdate: validasi rujukan BPJS, status langsung `confirmed` + assign `nomor_antrian` untuk BPJS, tetap `pending` untuk Umum; publish event berbeda (`booking.confirmed` vs `booking.created`)
  - `RujukanModule` dilengkapi controller + service: `POST /rujukan`, `GET /rujukan/:pasien_id`, `PATCH /rujukan/:id/perpanjang`
  - `BookingConfirmedEvent` ditambahkan ke `src/rabbitmq/events.ts`
  - `BookingConsumer` + `confirmFromPayment` di `BookingService` — flow pasien Umum: `payment.processed` → rekonsiliasi match → `booking.confirmed` event → booking confirmed + nomor antrian
  - Console.log ditambahkan di semua layer (cache + MQ) untuk observabilitas alur

- **Keputusan penting & alasannya:**
  - Validasi rujukan BPJS dilakukan SEBELUM transaksi dimulai (read-only, tidak butuh lock) — lock hanya untuk jadwal saat cek kapasitas
  - `BookingModule` perlu import entity `Pasien` dan `Rujukan` untuk validasi di `BookingService`
  - `RujukanModule` exports `TypeOrmModule` agar repository bisa dipakai module lain (KioskModule)
  - `confirmFromPayment` idempotent: skip kalau booking sudah `confirmed` — handles BPJS yang sudah confirmed saat create dan event duplikat
  - `booking.confirmed` di-publish dari dua tempat: `BookingService` (BPJS, langsung saat create) dan `RekonsiliasisService` (Umum, setelah payment match)

### Fase 3 — Validasi & Testing (selesai)

- **Apa yang dikerjakan:**
  - 3A: EXPLAIN ANALYZE 5 query utama kiosk dengan data seed realistis
  - 3B: k6 load test cache `GET /jadwal` — cold vs warm Redis
  - 3C: Manual test semua skenario kiosk (BPJS aktif/expired/no-rujukan, Umum, race condition)
  - Fix: tambah `@SkipThrottle({ global: true })` di `GET /jadwal` (`jadwal.controller.ts`)

- **Temuan EXPLAIN ANALYZE:**
  - Semua index dari Topik 1 terbukti dipakai: `(jadwal_dokter_id, status)` di booking, `(pasien_id, status)` di rujukan, unique `nik` di pasien
  - Seq Scan pada `jadwal_dokter` (~500 rows) tetap optimal — 92% baris lolos filter, sequential lebih murah dari random I/O
  - Planner underestimate: estimasi 2 rows, aktual 48 untuk query jadwal by spesialisasi — karena `dokter.spesialisasi` tidak ada index, statistik join selectivity-nya kasar; tidak masalah di skala ini
  - `!=` (`<>`) tidak bisa jadi `Index Cond`, hanya `Filter` — terkonfirmasi di Query 5 (sama dengan catatan Topik 1)
  - Memoize (PostgreSQL 14+): dari 472 Nested Loop iterations, hanya 25 actual Index Scan ke tabel dokter (cache inner result by key)

- **Hasil load test cache (cold vs warm):**
  - Cold: p(95)=283ms, 220 req/s
  - Warm: p(95)=265ms, 307 req/s — throughput naik 40%
  - Cache stampede terlihat nyata: 50 VU serentak cold → semua query DB bersamaan → lebih lambat dari warm

- **Keputusan penting & alasannya:**
  - `@SkipThrottle({ global: true })` ditambahkan permanen di `GET /jadwal` — endpoint read-only publik, rate limit tidak relevan dan justru menghalangi manfaat cache
  - `@SkipThrottle()` tanpa argumen di `@nestjs/throttler` v6 = skip throttler bernama `"default"`, bukan `"global"` — harus eksplisit sebutkan nama throttler

- **Pitfall yang perlu diingat:**
  - `APP_GUARD` global menangkap semua endpoint termasuk yang tidak perlu di-throttle — endpoint read-only publik perlu dikecualikan manual dengan `@SkipThrottle`
  - TTL 60 detik terlalu pendek untuk load test 2 ronde — cache expired sebelum Ronde 2 mulai; naikkan TTL sementara atau jalankan Ronde 2 langsung setelah Ronde 1
  - `@nestjs/throttler` v6: nama throttler harus eksplisit di semua decorator (`@Throttle({ global: ... })`, `@SkipThrottle({ global: true })`)

## Status Sekarang

**Semua 5 topik roadmap selesai.** Pengembangan lanjutan sedang berjalan di Fase 4.

**Pengembangan lanjutan:** lihat `pengembangan-lanjutan-brief-v1.md` untuk roadmap lengkap Fase 1–4.

Ringkasan fase:
- **Fase 1** ✅ — Redesign data model (pasien + rujukan + nomor antrian) + seed data 30 hari
- **Fase 2** ✅ — Endpoint kiosk, update logika booking, event booking.confirmed
- **Fase 3** ✅ — EXPLAIN ANALYZE 5 query kiosk, k6 load test cache, manual test skenario kiosk
- **Fase 4** 🔄 — Swagger ✅, README (belum), Frontend 🔄

**Topik aktif**: Fase 4 — lanjut 4C Frontend (halaman kiosk + halaman admin)

### Fase 4 — Progress Detail

#### 4A Swagger ✅
- `@nestjs/swagger` terinstall
- Setup di `backend/src/main.ts` — docs tersedia di `http://localhost:3000/api/docs`
- Semua controller diberi `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Semua DTO diberi `@ApiProperty` / `@ApiPropertyOptional`

#### 4C Frontend 🔄 — Setup selesai, belum ada komponen
- Stack: React + Vite + TypeScript + Tailwind v4 + React Router + TanStack Query + Axios
- Folder: `frontend/` sejajar dengan `backend/` di root project
- Frontend rules ada di `frontend/frontend-rules.md` — wajib diikuti (feature-based folder, custom hooks, container/presentational)
- Path alias belum dikonfigurasi (TODO: tambah `@/` alias di `vite.config.ts` + `tsconfig`)

**Struktur yang sudah dibuat:**
```
frontend/src/
  app/
    App.tsx           — root component (Providers + RouterProvider)
    providers.tsx     — QueryClientProvider
    router.tsx        — route: / → KioskPage, /admin → AdminPage
  features/
    kiosk/pages/KioskPage.tsx     — placeholder
    admin/pages/AdminPage.tsx     — placeholder
  shared/
    lib/apiClient.ts  — axios instance (baseURL: http://localhost:3000)
    types/api.ts      — ApiResponse<T> generic type
  index.css           — hanya @import "tailwindcss"
  main.tsx            — mount App
```

**Yang belum dibuat (urutan pengerjaan):**
1. Path alias `@/` di vite.config.ts + tsconfig.app.json
2. Shared components: `Spinner`, `Badge`, `Button`, `Input`
3. Feature Kiosk (urutan alur):
   - `PasienSearch` — input NIK atau No.BPJS, hit `GET /kiosk/cari`
   - `RujukanInfo` — tampil nama pasien + status rujukan
   - `JadwalList` — hit `GET /jadwal?spesialisasi=...`, tampil kartu jadwal
   - `BookingConfirm` — modal konfirmasi, hit `POST /booking`
   - `NomorAntrian` — tampil nomor antrian setelah booking confirmed
4. Feature Admin:
   - `PasienTable` + form tambah pasien baru
   - `RujukanForm` — input rujukan untuk pasien BPJS
   - `PerpanjangRujukanModal` — perpanjang rujukan expired
   - `RekonsiliasiTable` — lihat status rekonsiliasi pembayaran

#### 4B README (belum)
- Dikerjakan terakhir setelah frontend selesai
