import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Pasien, JenisPasien } from '../pasien/pasien.entity';
import { Rujukan, RujukanStatus } from '../rujukan/rujukan.entity';
import { QueryKioskDto } from './dto/query-kiosk.dto';

@Injectable()
export class KioskService {
  constructor(
    @InjectRepository(Pasien)
    private readonly pasienRepo: Repository<Pasien>,
    @InjectRepository(Rujukan)
    private readonly rujukanRepo: Repository<Rujukan>,
  ) {}

  async cari(query: QueryKioskDto) {
    if (!query.nik && !query.no_bpjs) {
      throw new BadRequestException('Masukkan NIK atau No. BPJS!');
    }

    const pasien = await this.pasienRepo.findOne({
      where: query.nik ? { nik: query.nik } : { no_bpjs: query.no_bpjs },
    });

    if (!pasien) throw new NotFoundException('Pasien tidak ditemukan.');

    const pasienData = {
      id: pasien.id,
      nama: pasien.nama,
      nik: pasien.nik,
      jenis_pasien: pasien.jenis_pasien,
    };

    if (pasien.jenis_pasien === JenisPasien.UMUM) {
      return { pasien: pasienData, rujukan: null };
    }

    // BPJS — cari rujukan aktif yang belum expired
    const today = new Date().toISOString().slice(0, 10);
    const rujukan = await this.rujukanRepo.findOne({
      where: {
        pasien_id: pasien.id,
        status: RujukanStatus.AKTIF,
        tanggal_expired: MoreThanOrEqual(today),
      },
    });

    if (!rujukan) {
      return {
        pasien: pasienData,
        rujukan: null,
        pesan:
          'Tidak ada rujukan aktif. Silakan ke loket admin untuk memperbarui rujukan.',
      };
    }

    return {
      pasien: pasienData,
      rujukan: {
        id: rujukan.id,
        status: rujukan.status,
        spesialisasi_tujuan: rujukan.spesialisasi_tujuan,
        rs_asal: rujukan.rs_asal,
        berlaku_sampai: rujukan.tanggal_expired,
      },
    };
  }
}
