import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Not,
  QueryFailedError,
  MoreThanOrEqual,
  DataSource,
} from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { JadwalDokter } from '../jadwal/jadwal-dokter.entity';
import { Pasien, JenisPasien } from '../pasien/pasien.entity';
import { Rujukan, RujukanStatus } from '../rujukan/rujukan.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(JadwalDokter)
    private readonly jadwalRepo: Repository<JadwalDokter>,
    @InjectRepository(Pasien)
    private readonly pasienRepo: Repository<Pasien>,
    @InjectRepository(Rujukan)
    private readonly rujukanRepo: Repository<Rujukan>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly dataSource: DataSource,
    private readonly amqp: AmqpConnection,
  ) {}

  findAll() {
    return this.bookingRepo.find({
      relations: { pasien: true, jadwal: true },
    });
  }

  async findOne(id: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: { pasien: true, jadwal: true },
    });
    if (!booking) throw new NotFoundException(`Booking #${id} tidak ditemukan`);
    return booking;
  }

  async create(dto: CreateBookingDto) {
    // 1. Ambil pasien
    const pasien = await this.pasienRepo.findOne({
      where: { id: dto.pasien_id },
    });
    if (!pasien) throw new NotFoundException('Pasien tidak ditemukan.');

    // 2. Ambil jadwal beserta dokter (untuk validasi spesialisasi)
    const jadwal = await this.jadwalRepo.findOne({
      where: { id: dto.jadwal_dokter_id },
      relations: { dokter: true },
    });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan.');

    // 3. Validasi rujukan untuk pasien BPJS
    const isBpjs = pasien.jenis_pasien === JenisPasien.BPJS;
    if (isBpjs) {
      const today = new Date().toISOString().slice(0, 10);
      const rujukan = await this.rujukanRepo.findOne({
        where: {
          pasien_id: pasien.id,
          spesialisasi_tujuan: jadwal.dokter.spesialisasi,
          status: RujukanStatus.AKTIF,
          tanggal_expired: MoreThanOrEqual(today),
        },
      });
      if (!rujukan) {
        throw new BadRequestException(
          `Tidak ada rujukan aktif untuk poli ${jadwal.dokter.spesialisasi}.`,
        );
      }
    }

    // 4. Masuk transaksi — lock jadwal, cek kapasitas, simpan booking
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.findOne(JadwalDokter, {
        where: { id: dto.jadwal_dokter_id },
        lock: { mode: 'pessimistic_write' },
      });

      const slotTerisi = await queryRunner.manager.count(Booking, {
        where: {
          jadwal_dokter_id: dto.jadwal_dokter_id,
          status: Not(BookingStatus.CANCELLED),
        },
      });
      if (slotTerisi >= jadwal.kapasitas) {
        throw new BadRequestException('Maaf slot sudah penuh.');
      }

      const status = isBpjs ? BookingStatus.CONFIRMED : BookingStatus.PENDING;

      // 5. Assign nomor antrian kalau langsung confirmed (BPJS)
      let nomorAntrian: number | null = null;
      if (status === BookingStatus.CONFIRMED) {
        const raw = await queryRunner.manager
          .createQueryBuilder(Booking, 'b')
          .select('MAX(b.nomor_antrian)', 'max')
          .where('b.jadwal_dokter_id = :id', { id: dto.jadwal_dokter_id })
          .getRawOne<{ max: string | null }>();
        nomorAntrian =
          raw?.max !== null && raw?.max !== undefined ? Number(raw.max) + 1 : 1;
      }

      const booking = queryRunner.manager.create(Booking, {
        pasien_id: dto.pasien_id,
        jadwal_dokter_id: dto.jadwal_dokter_id,
        status,
        nomor_antrian: nomorAntrian,
      });

      const saved = await queryRunner.manager.save(booking);
      await queryRunner.commitTransaction();

      console.log(
        `[CACHE] DEL klinik:jadwal:detail:${dto.jadwal_dokter_id} → invalidasi setelah booking`,
      );
      await this.cache.del(`klinik:jadwal:detail:${dto.jadwal_dokter_id}`);

      // 6. Publish event berbeda berdasarkan jenis pasien
      if (isBpjs) {
        console.log(
          `[MQ] PUBLISH booking.confirmed → bookingId: ${saved.id} (BPJS, langsung confirmed)`,
        );
        await this.amqp.publish('klinik.exchange', 'booking.confirmed', {
          bookingId: saved.id,
        });
      } else {
        console.log(
          `[MQ] PUBLISH booking.created → bookingId: ${saved.id} (Umum, menunggu bayar)`,
        );
        await this.amqp.publish('klinik.exchange', 'booking.created', {
          bookingId: saved.id,
          jadwalId: dto.jadwal_dokter_id,
          jumlahSeharusnya: 150000,
        });
      }

      return this.bookingRepo.findOne({
        where: { id: saved.id },
        relations: { pasien: true, jadwal: { dokter: true } },
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();

      if (err instanceof QueryFailedError) {
        const driverError = err.driverError as { code?: string };
        if (driverError?.code === '23505') {
          throw new ConflictException(
            'Pasien sudah memiliki booking untuk jadwal ini.',
          );
        }
      }

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(id: number) {
    const booking = await this.findOne(id);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking sudah dibatalkan');
    }
    booking.status = BookingStatus.CANCELLED;
    const saved = await this.bookingRepo.save(booking);

    console.log(
      `[CACHE] DEL klinik:jadwal:detail:${booking.jadwal_dokter_id} → invalidasi setelah cancel`,
    );
    await this.cache.del(`klinik:jadwal:detail:${booking.jadwal_dokter_id}`);

    console.log(`[MQ] PUBLISH booking.cancelled → bookingId: ${id}`);
    await this.amqp.publish('klinik.exchange', 'booking.cancelled', {
      bookingId: id,
    });

    return saved;
  }

  async confirmFromPayment(bookingId: number): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking || booking.status === BookingStatus.CONFIRMED) {
      console.log(
        `[BOOKING] Skip → booking #${bookingId} sudah confirmed (BPJS atau event duplikat)`,
      );
      return;
    }

    const raw = await this.bookingRepo
      .createQueryBuilder('b')
      .select('MAX(b.nomor_antrian)', 'max')
      .where('b.jadwal_dokter_id = :id', { id: booking.jadwal_dokter_id })
      .getRawOne<{ max: string | null }>();

    const nomorAntrian =
      raw?.max !== null && raw?.max !== undefined ? Number(raw.max) + 1 : 1;

    console.log(
      `[BOOKING] Confirm booking #${bookingId} → nomor antrian: ${nomorAntrian}`,
    );
    await this.bookingRepo.update(bookingId, {
      status: BookingStatus.CONFIRMED,
      nomor_antrian: nomorAntrian,
    });
  }
}
