import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JadwalDokter } from './jadwal-dokter.entity';
import { Booking } from '../booking/booking.entity';
import { QueryJadwalDto } from './dto/query-jadwal.dto';
import { CreateJadwalDto } from './dto/create-jadwal.dto';

const TTL_60S = 60_000;
const TTL_5_MIN = 5 * 60 * 1000;

@Injectable()
export class JadwalService {
  constructor(
    @InjectRepository(JadwalDokter)
    private readonly jadwalRepo: Repository<JadwalDokter>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findTersedia(query: QueryJadwalDto) {
    const tanggal = query.tanggal ?? 'all';
    const dokterId = query.dokter_id ?? 'all';
    const spesialisasi = query.spesialisasi ?? 'all';
    const dariTanggal = query.dari_tanggal ?? 'all';
    const key = `klinik:jadwal:tersedia:${tanggal}:${dokterId}:${spesialisasi}:${dariTanggal}`;

    const cached = await this.cache.get(key);
    if (cached) {
      console.log(`[CACHE] HIT ${key}`);
      return cached;
    }

    console.log(`[CACHE] MISS ${key} → query ke DB`);

    const qb = this.jadwalRepo
      .createQueryBuilder('jadwal')
      .leftJoinAndSelect('jadwal.dokter', 'dokter')
      .addSelect(
        `(SELECT COUNT(*) FROM booking b 
        WHERE b.jadwal_dokter_id = jadwal.id 
        AND b.status != 'cancelled')`,
        'slot_terisi',
      );

    if (query.tanggal) {
      qb.andWhere('jadwal.tanggal = :tanggal', { tanggal: query.tanggal });
    }
    if (query.dokter_id) {
      qb.andWhere('jadwal.dokter_id = :dokter_id', {
        dokter_id: Number(query.dokter_id),
      });
    }

    if (query.spesialisasi) {
      qb.andWhere('dokter.spesialisasi = :spesialisasi', {
        spesialisasi: query.spesialisasi,
      });
    }
    if (query.dari_tanggal) {
      qb.andWhere('jadwal.tanggal >= :dari_tanggal', {
        dari_tanggal: query.dari_tanggal,
      });
    }

    qb.orderBy('jadwal.tanggal', 'ASC').addOrderBy('jadwal.jam_mulai', 'ASC');

    const { entities, raw } = await qb.getRawAndEntities();

    const result = entities
      .map((jadwal, i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const slotTerisi = Number(raw[i].slot_terisi);
        return {
          ...jadwal,
          slot_terisi: slotTerisi,
          slot_tersedia: jadwal.kapasitas - slotTerisi,
        };
      })
      .filter((j) => j.slot_tersedia > 0);

    await this.cache.set(key, result, TTL_60S);
    console.log(
      `[CACHE] SET ${key} → ${result.length} jadwal tersedia (TTL 60 detik)`,
    );
    return result;
  }

  async findOne(id: number) {
    const key = `klinik:jadwal:detail:${id}`;
    const cached = await this.cache.get(key);
    if (cached) {
      console.log(`[CACHE] HIT ${key}`);
      return cached;
    }

    console.log(`[CACHE] MISS ${key} → query ke DB`);

    const jadwal = await this.jadwalRepo.findOne({
      where: { id },
      relations: { dokter: true },
    });
    if (!jadwal) throw new NotFoundException(`Jadwal #${id} tidak ditemukan`);

    await this.cache.set(key, jadwal, TTL_5_MIN);
    console.log(`[CACHE] SET ${key} (TTL 5 menit)`);
    return jadwal;
  }

  async create(dto: CreateJadwalDto) {
    const jadwal = this.jadwalRepo.create(dto);
    const saved = await this.jadwalRepo.save(jadwal);
    // List jadwal expire otomatis via TTL — tidak ada explicit invalidation
    // karena variasi key-nya tergantung query params yang tidak diketahui di sini
    return this.jadwalRepo.findOne({
      where: { id: saved.id },
      relations: { dokter: true },
    });
  }
}
