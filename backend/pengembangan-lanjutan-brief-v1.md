# Pengembangan Lanjutan v1 — Sistem Booking & Rekonsiliasi Klinik

Dokumen ini adalah kelanjutan dari `project-brief-booking-klinik.md` setelah 5 topik inti selesai.
Fokus: memperkuat sistem yang sudah ada menjadi lebih realistis dan end-to-end.

---

## Gambaran Umum Perubahan

Sistem sebelumnya menggunakan `email` sebagai identifier pasien dan tidak membedakan
jenis pasien. Pengembangan ini mensimulasikan alur kiosk rumah sakit nyata:

- Pasien **BPJS** → input NIK/No.BPJS → sistem cek rujukan → pilih jadwal → booking confirmed otomatis
- Pasien **Umum** → input NIK → pilih jadwal → booking pending → bayar → confirmed

Tidak ada integrasi BPJS asli. Rujukan diinput manual oleh admin klinik (simulasi internal).

---

## Fase 1 — Redesign Data Model & Seed Data

### 1A. Perubahan Entity `pasien`

**Sebelum:**
```
pasien (id, nama, email[unique], no_hp)
```

**Sesudah:**
```
pasien (id, nama, nik[unique], jenis_pasien, gender, no_bpjs[nullable,unique], no_hp[nullable], email[nullable])
  jenis_pasien: bpjs | umum
  no_bpjs     : wajib ada kalau jenis_pasien = bpjs, null kalau umum
  gender      : laki_laki | perempuan
```

Alasan: sistem kiosk mengidentifikasi pasien via NIK atau No. BPJS, bukan email.
Email dan no_hp tetap ada tapi diisi admin, tidak wajib untuk proses kiosk.

### 1B. Entity Baru: `rujukan`

```
rujukan (id, pasien_id, spesialisasi_tujuan, rs_asal,
         tanggal_berlaku, tanggal_expired, status)
  status: aktif | expired
```

- Diinput oleh admin klinik (bukan pasien)
- Satu pasien bisa punya banyak rujukan (untuk spesialisasi berbeda atau perpanjangan)
- Yang dianggap valid: status = aktif AND tanggal_expired >= hari ini
- `POST /booking` untuk pasien BPJS wajib ada rujukan aktif yang spesialisasi-nya cocok dengan dokter yang dipilih

### 1C. Perubahan Entity `booking`

Tambah kolom:
```
booking (... kolom existing ..., nomor_antrian[nullable])
```

`nomor_antrian` di-assign otomatis saat status berubah ke `confirmed`.
Nomor urut per jadwal — pasien pertama di jadwal tersebut = 1, berikutnya = 2, dst.

### 1D. Seed Data Generator

Buat script `seed/seed.ts` (dijalankan manual via `ts-node seed/seed.ts`).

#### Dokter & Jadwal per Spesialisasi

Jadwal dibuat untuk **30 hari ke depan** dari tanggal seed dijalankan.
Sesi: **Pagi (08:00–12:00)**, **Siang (13:00–17:00)**, **Sore (17:00–20:00)**.

| Spesialisasi | Kode | Frekuensi | Hari | Sesi | Dokter | Kapasitas/Sesi |
|---|---|---|---|---|---|---|
| Penyakit Dalam | Sp.PD | 3x/minggu | Senin, Rabu, Jumat | Pagi + Siang + Sore | 2 | P:15, S:12, Sr:8 |
| Anak | Sp.A | 3x/minggu | Senin, Rabu, Jumat | Pagi + Siang + Sore | 2 | P:15, S:12, Sr:8 |
| Obstetri & Ginekologi | Sp.OG | 3x/minggu | Selasa, Kamis, Sabtu | Pagi + Siang | 2 | P:12, S:10 |
| Jantung & Pembuluh Darah | Sp.JP | 3x/minggu | Senin, Rabu, Jumat | Pagi + Siang | 2 | P:12, S:10 |
| Saraf / Neurologi | Sp.N | 3x/minggu | Selasa, Kamis, Sabtu | Pagi + Siang | 2 | P:12, S:10 |
| Mata | Sp.M | 3x/minggu | Senin, Rabu, Jumat | Pagi + Siang | 1 | P:15, S:12 |
| THT-KL | Sp.THT-KL | 3x/minggu | Selasa, Kamis, Sabtu | Pagi + Siang | 1 | P:12, S:10 |
| Kulit & Kelamin | Sp.DVE | 3x/minggu | Selasa, Kamis, Jumat | Pagi + Siang + Sore | 1 | P:12, S:10, Sr:6 |
| Paru | Sp.P | 2x/minggu | Selasa, Jumat | Pagi + Siang | 1 | P:12, S:10 |
| Bedah Umum | Sp.B | 2x/minggu | Senin, Kamis | Pagi | 1 | P:10 |
| Ortopedi & Traumatologi | Sp.OT | 2x/minggu | Rabu, Sabtu | Pagi + Siang | 1 | P:10, S:8 |
| Urologi | Sp.U | 2x/minggu | Selasa, Sabtu | Pagi | 1 | P:10 |
| Kedokteran Jiwa / Psikiatri | Sp.KJ | 2x/minggu | Rabu, Jumat | Pagi + Siang | 1 | P:8, S:6 |
| Kedokteran Fisik & Rehabilitasi | Sp.KFR | 2x/minggu | Senin, Kamis | Pagi | 1 | P:10 |
| Bedah Saraf | Sp.BS | 1x/minggu | Rabu | Pagi + Siang | 1 | P:8, S:6 |
| Gizi Klinik | Sp.GK | 1x/minggu | Sabtu | Pagi | 1 | P:10 |
| Anestesiologi | Sp.An | 1x/minggu | Senin | Pagi | 1 | P:6 |
| Radiologi | Sp.Rad | 1x/minggu | Selasa | Pagi | 1 | P:8 |
| Patologi Klinik | Sp.PK | 1x/minggu | Rabu | Pagi | 1 | P:6 |
| Patologi Anatomi | Sp.PA | 1x/minggu | Kamis | Pagi | 1 | P:6 |

Estimasi total jadwal yang di-generate: **±400–500 baris** dalam 30 hari.

#### Pasien Sample

```
20 pasien BPJS  → masing-masing punya rujukan aktif (spesialisasi berbeda-beda)
5  pasien BPJS  → rujukan expired (untuk test case kiosk error)
3  pasien BPJS  → belum punya rujukan sama sekali (untuk test case)
15 pasien Umum  → tanpa rujukan
```

---

## Fase 2 — Endpoint Kiosk & Update Logika Booking

### 2A. Endpoint Baru: Kiosk

```
GET /kiosk/cari?nik=3201xxxx
GET /kiosk/cari?no_bpjs=0001xxxx
```

Response pasien BPJS dengan rujukan aktif:
```json
{
  "pasien": { "id": 1, "nama": "Budi Santoso", "jenis_pasien": "bpjs", "nik": "3201xxxx" },
  "rujukan": {
    "id": 3,
    "status": "aktif",
    "spesialisasi_tujuan": "Jantung & Pembuluh Darah",
    "rs_asal": "RSUD Koja",
    "berlaku_sampai": "2026-09-01"
  }
}
```

Response pasien BPJS tanpa rujukan / expired:
```json
{
  "pasien": { "id": 2, "nama": "Sari Dewi", "jenis_pasien": "bpjs" },
  "rujukan": null,
  "pesan": "Tidak ada rujukan aktif. Silakan ke loket admin untuk memperbarui rujukan."
}
```

Response pasien Umum:
```json
{
  "pasien": { "id": 3, "nama": "Andi Pratama", "jenis_pasien": "umum" },
  "rujukan": null
}
```

### 2B. Update `GET /jadwal`

Tambah query params baru:

```
GET /jadwal?spesialisasi=Jantung%20%26%20Pembuluh%20Darah&dari_tanggal=2026-06-23
```

- `spesialisasi` → filter join ke tabel `dokter`, cocokkan `dokter.spesialisasi`
- `dari_tanggal` → tampilkan jadwal mulai tanggal ini ke depan (bukan hanya hari ini)
- Tetap filter hanya jadwal yang masih ada sisa kuota
- Default urutan: tanggal ASC, jam_mulai ASC

Untuk pasien BPJS: `spesialisasi` otomatis dari `rujukan.spesialisasi_tujuan` (diisi frontend).
Untuk pasien Umum: bisa pilih spesialisasi sendiri atau lihat semua.

### 2C. Update `POST /booking` — Validasi Rujukan & Nomor Antrian

Alur baru:

```
POST /booking { pasien_id, jadwal_dokter_id }

1. Ambil data pasien → cek jenis_pasien

2. Kalau jenis_pasien = 'bpjs':
   - Cari rujukan aktif pasien yang spesialisasi_tujuan cocok dengan dokter jadwal ini
   - Kalau tidak ada → 400 "Tidak ada rujukan aktif untuk poli ini"
   - Kalau ada tapi expired → 400 "Rujukan expired, perbarui ke admin"

3. Cek kapasitas slot (SELECT FOR UPDATE — sudah ada dari Topik 4)

4. Simpan booking
   - Kalau bpjs: status langsung 'confirmed'
   - Kalau umum: status 'pending'

5. Assign nomor antrian (hanya kalau status = 'confirmed'):
   - SELECT MAX(nomor_antrian) WHERE jadwal_dokter_id = X
   - nomor_antrian = MAX + 1 (atau 1 kalau belum ada)

6. Publish event ke RabbitMQ:
   - bpjs  → 'booking.confirmed' (rekonsiliasi tidak dibuat)
   - umum  → 'booking.created'  (rekonsiliasi dibuat, status pending)

7. Return booking dengan nomor_antrian
```

### 2D. Flow Booking Confirmed untuk Pasien Umum (via RabbitMQ)

Tambah event baru: `booking.confirmed`

```
POST /pembayaran { booking_id, jumlah }
  → simpan pembayaran
  → publish 'payment.processed'

Consumer onPaymentProcessed:
  → update rekonsiliasi → status 'match'
  → publish 'booking.confirmed' { bookingId }

Consumer baru onBookingConfirmed (di BookingConsumer):
  → SELECT MAX(nomor_antrian) WHERE jadwal_dokter_id = X
  → UPDATE booking SET status = 'confirmed', nomor_antrian = MAX + 1
```

### 2E. Endpoint Admin Rujukan

```
POST   /rujukan              Tambah rujukan baru untuk pasien
GET    /rujukan/:pasien_id   Lihat semua rujukan pasien
PATCH  /rujukan/:id/perpanjang  Perpanjang rujukan (update tanggal_expired, status kembali aktif)
```

---

## Fase 3 — Validasi & Testing

### 3A. EXPLAIN ANALYZE dengan Data Volume Realistis

Setelah seed data selesai (±400 baris jadwal, ratusan booking):
- Jalankan query-query utama dengan `EXPLAIN ANALYZE`
- Verifikasi index benar-benar dipakai (Index Scan, bukan Seq Scan)
- Bandingkan query time sebelum vs sesudah index (dokumentasikan hasilnya)

Target query yang diuji:
```sql
-- Query kiosk: cari jadwal spesialisasi tertentu mulai hari ini
EXPLAIN ANALYZE
SELECT j.*, d.nama, d.spesialisasi FROM jadwal_dokter j
JOIN dokter d ON j.dokter_id = d.id
WHERE d.spesialisasi = 'Jantung & Pembuluh Darah'
AND j.tanggal >= CURRENT_DATE
ORDER BY j.tanggal, j.jam_mulai;
```

### 3B. Load Test Cache (`GET /jadwal`)

k6 script baru: `load-test/jadwal-cache.js`

```
Skenario:
  - 50 VU, durasi 30 detik
  - GET /jadwal?spesialisasi=Jantung&dari_tanggal=hari_ini
  - Round 1: Redis kosong (cache cold) → catat p(95)
  - Round 2: Redis sudah terisi (cache warm) → catat p(95)
  - Ekspektasi: response time cache warm < 20% dari cold
```

### 3C. Test Case Kiosk (Manual / Postman)

```
✓ Pasien BPJS dengan rujukan aktif → bisa booking, langsung confirmed + nomor antrian
✓ Pasien BPJS dengan rujukan expired → 400 "Rujukan expired"
✓ Pasien BPJS tanpa rujukan → 400 "Tidak ada rujukan aktif"
✓ Pasien BPJS, spesialisasi dokter tidak cocok rujukan → 400
✓ Pasien Umum → bisa booking semua spesialisasi, status pending
✓ Pasien Umum bayar → rekonsiliasi match → booking confirmed + nomor antrian
✓ Pasien Umum bayar kurang → rekonsiliasi selisih (booking tetap confirmed)
✓ Booking cancel → rekonsiliasi dihapus, nomor antrian dibebaskan
✓ Dua pasien booking slot terakhir bersamaan → hanya 1 berhasil (SELECT FOR UPDATE)
```

---

## Fase 4 — Dokumentasi & Frontend

### 4A. Swagger / OpenAPI

Setup `@nestjs/swagger` — endpoint bisa diexplore langsung di browser.
Endpoint kiosk dan rujukan harus terdokumentasi dengan contoh request/response.

### 4B. README

Isi minimal:
- Arsitektur diagram (5 layer: DB → Pool → Cache → Rate Limit → Queue)
- Cara run (`docker compose up -d` + `npm run start:dev`)
- Daftar endpoint
- Lessons learned per topik

### 4C. Frontend (Opsional — karena user sudah familiar frontend)

Dua halaman utama:

**Halaman Kiosk (pasien):**
```
Input NIK / No. BPJS
  → tampil nama + status rujukan
  → tampil jadwal tersedia (filter otomatis by spesialisasi kalau BPJS)
  → pilih jadwal → konfirmasi booking
  → tampil nomor antrian
```

**Halaman Admin:**
```
Daftar pasien + tambah pasien baru
Input rujukan untuk pasien BPJS
Perpanjang rujukan yang expired
Lihat rekonsiliasi pembayaran
```

---

## Urutan Pengerjaan yang Disarankan

```
Fase 1: [x] 1A. Update entity pasien (tambah nik, jenis_pasien, gender, no_bpjs)
        [x] 1B. Buat entity & module rujukan
        [x] 1C. Tambah kolom nomor_antrian di booking
        [x] 1D. Buat seed script (dokter, jadwal 30 hari, pasien sample, rujukan)

Fase 2: [x] 2A. Buat KioskModule + GET /kiosk/cari
        [x] 2B. Update GET /jadwal (filter spesialisasi + dari_tanggal)
        [x] 2C. Update POST /booking (validasi rujukan + nomor antrian + auto-confirmed BPJS)
        [ ] 2D. Tambah event booking.confirmed (BookingConsumer baru)
        [x] 2E. Endpoint admin rujukan (POST, GET, PATCH perpanjang)

Fase 3: [x] 3A. EXPLAIN ANALYZE dengan data volume realistis
        [x] 3B. k6 load test cache jadwal
        [x] 3C. Manual test semua skenario kiosk

Fase 4: [ ] 4A. Swagger
        [ ] 4B. README
        [ ] 4C. Frontend (kiosk + admin)
```

---

## Catatan Implementasi

### Fase 1
- Seed script ada di `src/seed/seed.ts`, bukan `seed/seed.ts`
- Seed DataSource pakai `synchronize: true` agar bisa buat tabel sendiri tanpa perlu jalankan app dulu
- NIK di seed pakai prefix berbeda per grup (aktif/expired/no-rujukan/umum) agar mudah dibedakan saat testing — tidak realistis, acceptable untuk portofolio
- Reset Docker volume (`docker compose down -v`) wajib sebelum jalankan app pertama kali setelah ubah entity pasien (karena kolom `email` berubah dari NOT NULL ke nullable)

### Fase 2
- `RujukanModule` awalnya dibuat minimal (entity only), controller + service ditambah saat implementasi 2E
- `BookingModule` perlu import entity `Pasien` dan `Rujukan` untuk validasi rujukan di dalam `BookingService`
- Validasi rujukan BPJS dilakukan SEBELUM transaksi dimulai (read-only, tidak butuh lock) — lock hanya untuk jadwal saat cek kapasitas
- `BookingConfirmedEvent` ditambahkan ke `src/rabbitmq/events.ts`
- Event `booking.confirmed` di-publish oleh `BookingService` untuk pasien BPJS (langsung confirmed saat create), dan nanti juga dari `RekonsiliasisConsumer` setelah pembayaran pasien Umum sukses (2D)

---

## Yang Sengaja Tidak Diimplementasi

- Integrasi API BPJS Kesehatan — simulasi internal sudah cukup untuk pembelajaran
- Sistem pemanggilan antrian real-time (layar display nomor) — butuh WebSocket, di luar scope REST API
- IGD / Rawat Inap — flow emergency berbeda total, tidak menggunakan sistem jadwal
- JWT Authentication — bisa ditambah setelah Fase 4 sebagai pengembangan v2
- Multi-klinik / multi-cabang — satu klinik sudah cukup untuk portofolio ini
