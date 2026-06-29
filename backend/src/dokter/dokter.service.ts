import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Dokter } from './dokter.entity';
import { CreateDokterDto } from './dto/create-dokter.dto';

const TTL_5_MIN = 5 * 60 * 1000;

@Injectable()
export class DokterService {
  constructor(
    @InjectRepository(Dokter)
    private readonly dokterRepo: Repository<Dokter>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findAll() {
    const cached = await this.cache.get<Dokter[]>('klinik:dokter:all');
    if (cached) {
      console.log('[CACHE] HIT klinik:dokter:all');
      return cached;
    }

    console.log('[CACHE] MISS klinik:dokter:all → query ke DB');
    const data = await this.dokterRepo.find();
    await this.cache.set('klinik:dokter:all', data, TTL_5_MIN);
    console.log(
      `[CACHE] SET klinik:dokter:all → ${data.length} dokter (TTL 5 menit)`,
    );
    return data;
  }

  async findOne(id: number) {
    const key = `klinik:dokter:${id}`;
    const cached = await this.cache.get<Dokter>(key);
    if (cached) {
      console.log(`[CACHE] HIT ${key}`);
      return cached;
    }

    console.log(`[CACHE] MISS ${key} → query ke DB`);
    const dokter = await this.dokterRepo.findOne({ where: { id } });
    if (!dokter) throw new NotFoundException(`Dokter #${id} tidak ditemukan.`);

    await this.cache.set(key, dokter, TTL_5_MIN);
    console.log(`[CACHE] SET ${key} (TTL 5 menit)`);
    return dokter;
  }

  async create(dto: CreateDokterDto) {
    const dokter = this.dokterRepo.create(dto);
    const saved = await this.dokterRepo.save(dokter);
    console.log(
      '[CACHE] DEL klinik:dokter:all → invalidasi setelah tambah dokter baru',
    );
    await this.cache.del('klinik:dokter:all');
    return saved;
  }
}
