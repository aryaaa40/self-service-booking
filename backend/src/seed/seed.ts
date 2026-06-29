import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Dokter } from '../dokter/dokter.entity';
import { JadwalDokter } from '../jadwal/jadwal-dokter.entity';
import { Pasien, JenisPasien, Gender } from '../pasien/pasien.entity';
import { Rujukan, RujukanStatus } from '../rujukan/rujukan.entity';
import { Booking } from '../booking/booking.entity';
import { Pembayaran } from '../pembayaran/pembayaran.entity';
import { Rekonsiliasi } from '../rekonsiliasi/rekonsiliasi.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5435),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'klinik_db',
  entities: [
    Dokter,
    JadwalDokter,
    Pasien,
    Rujukan,
    Booking,
    Pembayaran,
    Rekonsiliasi,
  ],
  synchronize: true,
});

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Sesi = { jam_mulai: string; jam_selesai: string; kapasitas: number };
type SpesConfig = {
  nama: string;
  kode: string;
  jumlah_dokter: number;
  hari: number[]; // 0=Sun,1=Mon,...,6=Sat
  sesi: Sesi[];
};

const SESI_PAGI: Sesi = {
  jam_mulai: '08:00',
  jam_selesai: '12:00',
  kapasitas: 0,
};
const SESI_SIANG: Sesi = {
  jam_mulai: '13:00',
  jam_selesai: '17:00',
  kapasitas: 0,
};
const SESI_SORE: Sesi = {
  jam_mulai: '17:00',
  jam_selesai: '20:00',
  kapasitas: 0,
};

function pagi(k: number): Sesi {
  return { ...SESI_PAGI, kapasitas: k };
}
function siang(k: number): Sesi {
  return { ...SESI_SIANG, kapasitas: k };
}
function sore(k: number): Sesi {
  return { ...SESI_SORE, kapasitas: k };
}

// Hari: 1=Sen,2=Sel,3=Rab,4=Kam,5=Jum,6=Sab
const SPESIALISASI: SpesConfig[] = [
  {
    nama: 'Penyakit Dalam',
    kode: 'Sp.PD',
    jumlah_dokter: 2,
    hari: [1, 3, 5],
    sesi: [pagi(15), siang(12), sore(8)],
  },
  {
    nama: 'Anak',
    kode: 'Sp.A',
    jumlah_dokter: 2,
    hari: [1, 3, 5],
    sesi: [pagi(15), siang(12), sore(8)],
  },
  {
    nama: 'Obstetri & Ginekologi',
    kode: 'Sp.OG',
    jumlah_dokter: 2,
    hari: [2, 4, 6],
    sesi: [pagi(12), siang(10)],
  },
  {
    nama: 'Jantung & Pembuluh Darah',
    kode: 'Sp.JP',
    jumlah_dokter: 2,
    hari: [1, 3, 5],
    sesi: [pagi(12), siang(10)],
  },
  {
    nama: 'Saraf',
    kode: 'Sp.N',
    jumlah_dokter: 2,
    hari: [2, 4, 6],
    sesi: [pagi(12), siang(10)],
  },
  {
    nama: 'Mata',
    kode: 'Sp.M',
    jumlah_dokter: 1,
    hari: [1, 3, 5],
    sesi: [pagi(15), siang(12)],
  },
  {
    nama: 'THT-KL',
    kode: 'Sp.THT-KL',
    jumlah_dokter: 1,
    hari: [2, 4, 6],
    sesi: [pagi(12), siang(10)],
  },
  {
    nama: 'Kulit & Kelamin',
    kode: 'Sp.DVE',
    jumlah_dokter: 1,
    hari: [2, 4, 5],
    sesi: [pagi(12), siang(10), sore(6)],
  },
  {
    nama: 'Paru',
    kode: 'Sp.P',
    jumlah_dokter: 1,
    hari: [2, 5],
    sesi: [pagi(12), siang(10)],
  },
  {
    nama: 'Bedah Umum',
    kode: 'Sp.B',
    jumlah_dokter: 1,
    hari: [1, 4],
    sesi: [pagi(10)],
  },
  {
    nama: 'Ortopedi & Traumatologi',
    kode: 'Sp.OT',
    jumlah_dokter: 1,
    hari: [3, 6],
    sesi: [pagi(10), siang(8)],
  },
  {
    nama: 'Urologi',
    kode: 'Sp.U',
    jumlah_dokter: 1,
    hari: [2, 6],
    sesi: [pagi(10)],
  },
  {
    nama: 'Kedokteran Jiwa',
    kode: 'Sp.KJ',
    jumlah_dokter: 1,
    hari: [3, 5],
    sesi: [pagi(8), siang(6)],
  },
  {
    nama: 'Kedokteran Fisik & Rehabilitasi',
    kode: 'Sp.KFR',
    jumlah_dokter: 1,
    hari: [1, 4],
    sesi: [pagi(10)],
  },
  {
    nama: 'Bedah Saraf',
    kode: 'Sp.BS',
    jumlah_dokter: 1,
    hari: [3],
    sesi: [pagi(8), siang(6)],
  },
  {
    nama: 'Gizi Klinik',
    kode: 'Sp.GK',
    jumlah_dokter: 1,
    hari: [6],
    sesi: [pagi(10)],
  },
  {
    nama: 'Anestesiologi',
    kode: 'Sp.An',
    jumlah_dokter: 1,
    hari: [1],
    sesi: [pagi(6)],
  },
  {
    nama: 'Radiologi',
    kode: 'Sp.Rad',
    jumlah_dokter: 1,
    hari: [2],
    sesi: [pagi(8)],
  },
  {
    nama: 'Patologi Klinik',
    kode: 'Sp.PK',
    jumlah_dokter: 1,
    hari: [3],
    sesi: [pagi(6)],
  },
  {
    nama: 'Patologi Anatomi',
    kode: 'Sp.PA',
    jumlah_dokter: 1,
    hari: [4],
    sesi: [pagi(6)],
  },
];

const NAMA_DOKTER = [
  'Andi Wijaya',
  'Budi Santoso',
  'Citra Dewi',
  'Dian Kusuma',
  'Eko Prasetyo',
  'Farida Hanum',
  'Galih Nugroho',
  'Hana Pertiwi',
  'Irwan Setiawan',
  'Juliana Rahmat',
  'Kevin Hartono',
  'Laila Azhar',
  'Maulana Rizki',
  'Nadia Putri',
  'Oscar Firmansyah',
  'Putri Lestari',
  'Qodir Mansyur',
  'Rina Susanti',
  'Satria Budi',
  'Tari Anggraini',
  'Usman Hakim',
  'Vira Natasya',
  'Wahyu Hidayat',
  'Xena Marlina',
  'Yudi Pratama',
];

const NAMA_PASIEN_BPJS = [
  'Ahmad Fauzi',
  'Bagas Wicaksono',
  'Cici Amalia',
  'Doni Saputra',
  'Elisa Rahayu',
  'Fajri Maulana',
  'Gita Puspita',
  'Hendra Gunawan',
  'Intan Permata',
  'Joko Widodo',
  'Kartika Sari',
  'Lukman Hakim',
  'Maya Indah',
  'Nanda Pratiwi',
  'Opik Sopian',
  'Priya Utama',
  'Qila Nuraini',
  'Rendi Kurniawan',
  'Sinta Maharani',
  'Tono Wahyudi',
  // 5 expired
  'Umi Kalsum',
  'Veri Saputra',
  'Winda Lestari',
  'Xander Budiman',
  'Yanti Sari',
  // 3 no rujukan
  'Zaki Ramadhan',
  'Amel Purnama',
  'Bayu Setiawan',
];

const NAMA_PASIEN_UMUM = [
  'Candra Wijaya',
  'Dewi Anggraeni',
  'Eka Nurhayati',
  'Fajar Bimantara',
  'Gilang Ramadhan',
  'Hesti Pramudita',
  'Ivan Kurniawan',
  'Jasmine Putri',
  'Koko Santoso',
  'Lina Marliani',
  'Mutiara Safira',
  'Nanang Subekti',
  'Okta Surya',
  'Pendi Rustam',
  'Qorina Fadilah',
];

// -------- main -----------------------------------------------------------

async function main() {
  await AppDataSource.initialize();
  console.log('DB connected');

  const dokterRepo = AppDataSource.getRepository(Dokter);
  const jadwalRepo = AppDataSource.getRepository(JadwalDokter);
  const pasienRepo = AppDataSource.getRepository(Pasien);
  const rujukanRepo = AppDataSource.getRepository(Rujukan);

  // --- Dokter ---
  const dokterList: Dokter[] = [];
  let nameCursor = 0;
  for (const sp of SPESIALISASI) {
    for (let i = 0; i < sp.jumlah_dokter; i++) {
      const d = dokterRepo.create({
        nama: `Dr. ${NAMA_DOKTER[nameCursor++]}, ${sp.kode}`,
        spesialisasi: sp.nama,
        klinik_id: 1,
      });
      dokterList.push(d);
    }
  }
  await dokterRepo.save(dokterList);
  console.log(`Dokter: ${dokterList.length} saved`);

  // --- Jadwal (30 hari ke depan) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jadwalList: JadwalDokter[] = [];

  // build map: spesialisasi nama → dokter list
  const spesMap = new Map<string, Dokter[]>();
  for (const d of dokterList) {
    if (!spesMap.has(d.spesialisasi)) spesMap.set(d.spesialisasi, []);
    spesMap.get(d.spesialisasi)!.push(d);
  }

  for (const sp of SPESIALISASI) {
    const docs = spesMap.get(sp.nama) ?? [];
    for (let day = 0; day < 30; day++) {
      const date = addDays(today, day);
      const jsDay = date.getDay(); // 0=Sun,...,6=Sat
      if (!sp.hari.includes(jsDay)) continue;
      for (const doc of docs) {
        for (const sesi of sp.sesi) {
          jadwalList.push(
            jadwalRepo.create({
              dokter_id: doc.id,
              tanggal: toDateStr(date),
              jam_mulai: sesi.jam_mulai,
              jam_selesai: sesi.jam_selesai,
              kapasitas: sesi.kapasitas,
            }),
          );
        }
      }
    }
  }
  await jadwalRepo.save(jadwalList);
  console.log(`Jadwal: ${jadwalList.length} saved`);

  // --- Pasien ---
  const pasienBpjsAktif: Pasien[] = [];
  for (let i = 0; i < 20; i++) {
    pasienBpjsAktif.push(
      pasienRepo.create({
        nama: NAMA_PASIEN_BPJS[i],
        nik: `320100000000${String(i + 1).padStart(4, '0')}`,
        jenis_pasien: JenisPasien.BPJS,
        gender: i % 2 === 0 ? Gender.LAKI_LAKI : Gender.PEREMPUAN,
        no_bpjs: `000100000${String(i + 1).padStart(5, '0')}`,
        no_hp: `0812${String(10000000 + i)}`,
      }),
    );
  }

  const pasienBpjsExpired: Pasien[] = [];
  for (let i = 20; i < 25; i++) {
    pasienBpjsExpired.push(
      pasienRepo.create({
        nama: NAMA_PASIEN_BPJS[i],
        nik: `320100000001${String(i + 1).padStart(4, '0')}`,
        jenis_pasien: JenisPasien.BPJS,
        gender: i % 2 === 0 ? Gender.LAKI_LAKI : Gender.PEREMPUAN,
        no_bpjs: `000200000${String(i + 1).padStart(5, '0')}`,
      }),
    );
  }

  const pasienBpjsNoRujukan: Pasien[] = [];
  for (let i = 25; i < 28; i++) {
    pasienBpjsNoRujukan.push(
      pasienRepo.create({
        nama: NAMA_PASIEN_BPJS[i],
        nik: `320100000002${String(i + 1).padStart(4, '0')}`,
        jenis_pasien: JenisPasien.BPJS,
        gender: Gender.LAKI_LAKI,
        no_bpjs: `000300000${String(i + 1).padStart(5, '0')}`,
      }),
    );
  }

  const pasienUmum: Pasien[] = [];
  for (let i = 0; i < 15; i++) {
    pasienUmum.push(
      pasienRepo.create({
        nama: NAMA_PASIEN_UMUM[i],
        nik: `320200000000${String(i + 1).padStart(4, '0')}`,
        jenis_pasien: JenisPasien.UMUM,
        gender: i % 2 === 0 ? Gender.LAKI_LAKI : Gender.PEREMPUAN,
        no_hp: `0813${String(10000000 + i)}`,
        email: `pasienumum${i + 1}@email.com`,
      }),
    );
  }

  await pasienRepo.save([
    ...pasienBpjsAktif,
    ...pasienBpjsExpired,
    ...pasienBpjsNoRujukan,
    ...pasienUmum,
  ]);
  console.log(
    `Pasien: ${pasienBpjsAktif.length + pasienBpjsExpired.length + pasienBpjsNoRujukan.length + pasienUmum.length} saved`,
  );

  // --- Rujukan ---
  const rujukanList: Rujukan[] = [];
  const todayStr = toDateStr(today);
  const expiredStr = toDateStr(addDays(today, -10));
  const futureStr = toDateStr(addDays(today, 90));

  // 20 pasien BPJS aktif → masing-masing 1 spesialisasi berbeda (20 spesialisasi)
  for (let i = 0; i < 20; i++) {
    rujukanList.push(
      rujukanRepo.create({
        pasien_id: pasienBpjsAktif[i].id,
        spesialisasi_tujuan: SPESIALISASI[i].nama,
        rs_asal: [
          'RSUD Koja',
          'RSUD Tarakan',
          'Puskesmas Penjaringan',
          'RSUD Pasar Minggu',
        ][i % 4],
        tanggal_berlaku: todayStr,
        tanggal_expired: futureStr,
        status: RujukanStatus.AKTIF,
      }),
    );
  }

  // 5 pasien BPJS expired → rujukan expired
  for (let i = 0; i < 5; i++) {
    rujukanList.push(
      rujukanRepo.create({
        pasien_id: pasienBpjsExpired[i].id,
        spesialisasi_tujuan: SPESIALISASI[i % 5].nama,
        rs_asal: 'RSUD Koja',
        tanggal_berlaku: toDateStr(addDays(today, -60)),
        tanggal_expired: expiredStr,
        status: RujukanStatus.EXPIRED,
      }),
    );
  }

  await rujukanRepo.save(rujukanList);
  console.log(`Rujukan: ${rujukanList.length} saved`);

  await AppDataSource.destroy();
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
