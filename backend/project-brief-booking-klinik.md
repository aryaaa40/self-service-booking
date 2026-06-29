# Project Brief: Sistem Booking & Rekonsiliasi Klinik

Studi kasus referensi: **Halodoc** (platform kesehatan digital terbesar di Indonesia, 20+ juta pengguna aktif bulanan). Proyek ini adalah versi sederhana dari pola arsitektur nyata yang dipakai Halodoc, diskalakan agar bisa dikerjakan sendiri sebagai portofolio.

Setiap bagian di bawah menyebutkan eksplisit: apa yang Halodoc lakukan di skala asli, dan apa yang kamu bangun di versi mini.

---

## 1. Gambaran Umum Sistem

Pasien bisa booking jadwal dokter di klinik. Setelah booking, sistem harus:

- Mencegah dua pasien rebutan slot yang sama (race condition)
- Memproses notifikasi & invoice tanpa membuat pasien menunggu
- Mencatat rekonsiliasi pembayaran untuk laporan keuangan
- Tetap responsif walau jadwal dokter sering dicek banyak orang

Lima topik backend yang kamu pelajari (Database design, Connection pooling, Caching, Rate limiting, Message queue) semuanya punya peran natural di sistem ini — tidak dipaksakan.

---

## 2. Referensi Nyata dari Halodoc

| Auth & database scaling | Migrasi sistem autentikasi dari access/refresh token ke JWT, karena masalah bottleneck skalabilitas | Halodoc Engineering Blog — "Scalable Auth service with JWT" |
| Event-driven architecture | Membangun sistem berbasis event menggunakan Kafka, dengan prinsip scalability, reliability, maintainability sebagai tiga pilar utama | Halodoc Engineering Blog — "Event-driven architecture using Kafka" |
| Rekonsiliasi async | Sistem rekonsiliasi finansial memproses volume transaksi besar setiap hari secara paralel lewat event processing, di-scale dengan menambah partition Kafka | Halodoc Engineering Blog — "Scaling the Reconciliation system" |
| Ordering masalah | Satu order menghasilkan banyak event (order_confirmed, payment_success, shipped, cancelled) — kalau tersebar ke partition berbeda, event bisa terproses di urutan acak | Halodoc Engineering Blog — "Scaling the Reconciliation system" |
| Skala infrastruktur | 150+ microservices di atas Kubernetes (Amazon EKS), menangani 20 juta+ pengguna aktif bulanan dengan uptime 99.99% | Halodoc Engineering Blog / AWS Case Study |

**Catatan penting**: Kamu tidak perlu Kafka atau Kubernetes untuk versi mini ini. RabbitMQ + Docker Compose sudah cukup untuk menunjukkan pola yang sama di skala kecil. Yang penting dipahami adalah **pola dan masalahnya**, bukan tools-nya secara harfiah.

---

## 3. Data Model Inti

```
dokter (id, nama, spesialisasi, klinik_id)
jadwal_dokter (id, dokter_id, tanggal, jam_mulai, jam_selesai, kapasitas)
pasien (id, nama, email, no_hp)
booking (id, pasien_id, jadwal_dokter_id, status, created_at)
  -- status: pending, confirmed, cancelled
pembayaran (id, booking_id, jumlah, status, created_at)
  -- status: pending, success, failed
rekonsiliasi (id, booking_id, jumlah_seharusnya, jumlah_dibayar, selisih, status)
```

---

## 4. Pemetaan Topik ke Implementasi

### A. Database design & optimization

**Masalah nyata**: Banyak pasien mengecek jadwal dokter bersamaan, terutama jam-jam sibuk (pagi sebelum kerja, jam istirahat siang).

**Implementasi**:

- Index pada `jadwal_dokter (dokter_id, tanggal)` — query yang paling sering dipanggil adalah "cek jadwal dokter X di tanggal Y"
- Index pada `booking (jadwal_dokter_id, status)` — buat ngecek sisa kapasitas slot
- Constraint `UNIQUE` pada kombinasi tertentu untuk mencegah double booking di level database, bukan cuma di level aplikasi

**Cara uji**: Generate ribuan baris data jadwal & booking dummy, bandingkan waktu query dengan dan tanpa index (pakai `EXPLAIN ANALYZE` di PostgreSQL).

---

### B. Database connection pooling

**Masalah nyata**: Mirip dengan masalah auth Halodoc — kalau tiap request buka koneksi baru ke database, sistem akan macet duluan sebelum traffic-nya benar-benar besar.

**Implementasi**:

- Setup connection pool (lewat Prisma, atau PgBouncer kalau mau lebih dalam) dengan `min` dan `max` connection yang masuk akal
- Simulasikan beban: jalankan banyak request booking bersamaan (pakai tool seperti `k6` atau `autocannon`), amati apa yang terjadi kalau pool terlalu kecil (request menunggu/timeout) vs terlalu besar (database kelebihan beban)

**Cara uji**: Load test dengan pool size berbeda-beda, catat response time dan error rate-nya.

---

### C. Caching strategy

**Masalah nyata**: Jadwal dokter untuk hari tertentu jarang berubah dalam hitungan detik, tapi dicek berulang-ulang oleh banyak pasien yang sedang memilih slot.

**Implementasi**:

- Cache hasil query "jadwal dokter tersedia" di Redis dengan TTL pendek (misal 30-60 detik)
- Invalidate cache begitu ada booking baru masuk untuk jadwal tersebut (supaya kapasitas yang ditampilkan tidak basi)
- Strategi: cache-aside (aplikasi cek cache dulu, kalau kosong baru query DB lalu simpan ke cache)

**Cara uji**: Bandingkan response time endpoint "cek jadwal" dengan dan tanpa cache di kondisi banyak request bersamaan.

---

### D. Rate limiting & throttling

**Masalah nyata**: Slot dokter terbatas (misal 10 pasien per sesi). Kalau banyak pasien menekan tombol "booking" berkali-kali dengan cepat (entah sengaja atau karena UI lambat), bisa terjadi race condition atau spam request yang membebani sistem.

**Implementasi**:

- Rate limit per user/IP untuk endpoint booking (misal maksimal 5 request per menit)
- Kombinasikan dengan database-level locking (`SELECT ... FOR UPDATE` atau optimistic locking) supaya dua request yang lolos rate limit tetap tidak bisa double-booking slot yang sama

**Cara uji**: Simulasikan beberapa request booking bersamaan untuk slot yang sama, pastikan hanya satu yang berhasil.

---

### E. Message queue & async processing (prioritas tinggi)

**Masalah nyata**: Ini yang paling mirip dengan apa yang Halodoc bangun di sistem rekonsiliasi mereka. Setelah booking berhasil, ada beberapa hal yang harus terjadi tapi _tidak boleh_ membuat pasien menunggu response API:

- Kirim email/notifikasi konfirmasi
- Generate invoice
- Catat ke sistem rekonsiliasi pembayaran

**Implementasi**:

- Setelah booking tersimpan, publish event `booking_created` ke RabbitMQ
- Consumer terpisah menangani: pengiriman notifikasi, generate invoice, dan pencatatan rekonsiliasi — masing-masing bisa jadi consumer/queue yang berbeda
- **Tangani masalah ordering** (ini pelajaran konkret dari kasus Halodoc): kalau ada event `booking_created` lalu `booking_cancelled` untuk booking yang sama, pastikan consumer tidak memproses `cancelled` sebelum `created` selesai diproses. Solusi sederhana: gunakan satu queue per booking_id, atau sertakan timestamp/versi di payload event untuk validasi urutan di sisi consumer.

**Cara uji**: Trigger booking, lalu cancel booking itu hampir bersamaan. Pastikan hasil akhirnya konsisten (tidak ada invoice yang terbuat untuk booking yang sudah dibatalkan).

---

## 5. Urutan Implementasi yang Disarankan

1. Bangun CRUD dasar (dokter, jadwal, pasien, booking) tanpa optimasi apapun dulu
2. Tambahkan Database design & optimization (index, constraint)
3. Tambahkan Connection pooling, load test buat lihat bedanya
4. Tambahkan Caching untuk endpoint jadwal
5. Tambahkan Rate limiting + locking di endpoint booking
6. Tambahkan Message queue untuk notifikasi, invoice, rekonsiliasi
7. (Opsional, lanjutan) Tambahkan Monitoring/logging untuk lihat apa yang terjadi di tiap layer ini saat sistem dibebani

---

## 6. Sumber Referensi

- Halodoc Engineering Blog: blogs.halodoc.io (artikel tentang Kafka, event-driven architecture, JWT auth scaling, reconciliation system)
- AWS Case Study: Halodoc Graviton3 migration & Enterprise Support case study
