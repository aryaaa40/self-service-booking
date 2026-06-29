import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rujukan, RujukanStatus } from './rujukan.entity';
import { Pasien, JenisPasien } from '../pasien/pasien.entity';
import { CreateRujukanDto } from './dto/create-rujukan.dto';
import { PerpanjangRujukanDto } from './dto/perpanjang-rujukan.dto';

@Injectable()
export class RujukanService {
  constructor(
    @InjectRepository(Rujukan)
    private readonly rujukanRepo: Repository<Rujukan>,
    @InjectRepository(Pasien)
    private readonly pasienRepo: Repository<Pasien>,
  ) {}

  async create(dto: CreateRujukanDto) {
    const pasien = await this.pasienRepo.findOne({
      where: { id: dto.pasien_id },
    });
    if (!pasien)
      throw new NotFoundException(`Pasien #${dto.pasien_id} tidak ditemukan`);
    if (pasien.jenis_pasien !== JenisPasien.BPJS) {
      throw new BadRequestException('Rujukan hanya untuk pasien BPJS');
    }

    const rujukan = this.rujukanRepo.create({
      ...dto,
      status: RujukanStatus.AKTIF,
    });
    return this.rujukanRepo.save(rujukan);
  }

  async findByPasien(pasienId: number) {
    const rujukan = await this.rujukanRepo.find({
      where: { pasien_id: pasienId },
      order: { id: 'DESC' },
    });
    return rujukan;
  }

  async perpanjang(id: number, dto: PerpanjangRujukanDto) {
    const rujukan = await this.rujukanRepo.findOne({ where: { id } });
    if (!rujukan) throw new NotFoundException(`Rujukan #${id} tidak ditemukan`);

    rujukan.tanggal_expired = dto.tanggal_expired;
    rujukan.status = RujukanStatus.AKTIF;
    return this.rujukanRepo.save(rujukan);
  }
}
