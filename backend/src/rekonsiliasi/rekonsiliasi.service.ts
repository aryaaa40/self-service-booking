import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Rekonsiliasi, RekonsiliasisStatus } from './rekonsiliasi.entity';
import { BookingCreatedEvent, PaymentProcessedEvent } from '../rabbitmq/events';

@Injectable()
export class RekonsiliasisService {
  constructor(
    @InjectRepository(Rekonsiliasi)
    private readonly repo: Repository<Rekonsiliasi>,
    private readonly amqp: AmqpConnection,
  ) {}

  findAll() {
    return this.repo.find({ relations: { booking: true } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: { booking: true } });
  }

  async handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
    console.log(
      `[REKONSILIASI] Membuat rekonsiliasi untuk bookingId: ${event.bookingId}`,
    );
    const rekonsiliasi = this.repo.create({
      booking_id: event.bookingId,
      jumlah_seharusnya: event.jumlahSeharusnya,
      jumlah_dibayar: 0,
      selisih: event.jumlahSeharusnya,
      status: RekonsiliasisStatus.PENDING,
    });

    try {
      await this.repo.save(rekonsiliasi);
      console.log(
        `[REKONSILIASI] Tersimpan → rekonsiliasi #${rekonsiliasi.id} (status: pending)`,
      );
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const driverError = err.driverError as { code?: string };
        if (driverError?.code === '23505') {
          console.log(
            `[REKONSILIASI] Skip duplikat bookingId: ${event.bookingId}`,
          );
          return; // idempotent: sudah ada, skip
        }
      }
      throw err;
    }
  }

  async handleBookingCancelled(bookingId: number): Promise<void> {
    console.log(
      `[REKONSILIASI] Hapus rekonsiliasi untuk bookingId: ${bookingId}`,
    );
    await this.repo.delete({ booking_id: bookingId });
    // idempotent: kalau tidak ada, delete no-op
  }

  async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    const rekonsiliasi = await this.repo.findOne({
      where: { booking_id: event.bookingId },
    });

    if (!rekonsiliasi) {
      console.log(
        `[REKONSILIASI] Skip → booking #${event.bookingId} sudah cancel sebelum bayar`,
      );
      return;
    }

    // TypeORM baca decimal dari PostgreSQL sebagai string — konversi dulu
    const seharusnya = Number(rekonsiliasi.jumlah_seharusnya);
    const dibayar = Number(event.jumlahDibayar);
    const selisih = seharusnya - dibayar;

    rekonsiliasi.jumlah_dibayar = dibayar;
    rekonsiliasi.selisih = Math.abs(selisih);
    rekonsiliasi.status =
      selisih === 0 ? RekonsiliasisStatus.MATCH : RekonsiliasisStatus.SELISIH;

    await this.repo.save(rekonsiliasi);
    console.log(
      `[REKONSILIASI] Updated → status: ${rekonsiliasi.status}, selisih: ${selisih}`,
    );

    console.log(
      `[MQ] PUBLISH booking.confirmed → bookingId: ${event.bookingId} (trigger dari payment)`,
    );
    await this.amqp.publish('klinik.exchange', 'booking.confirmed', {
      bookingId: event.bookingId,
    });
  }
}
