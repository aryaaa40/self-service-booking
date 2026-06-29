import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pasien } from './pasien.entity';
import { CreatePasienDto } from './dto/create-pasien.dto';

@Injectable()
export class PasienService {
  constructor(
    @InjectRepository(Pasien)
    private readonly pasienRepo: Repository<Pasien>,
  ) {}

  findAll() {
    return this.pasienRepo.find();
  }

  async findOne(id: number) {
    const pasien = await this.pasienRepo.findOne({ where: { id } });
    if (!pasien) throw new NotFoundException(`Pasien #${id} tidak ditemukan`);
    return pasien;
  }

  create(dto: CreatePasienDto) {
    const pasien = this.pasienRepo.create(dto);
    return this.pasienRepo.save(pasien);
  }
}
