import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Pembayaran, PembayaranStatus } from './pembayaran.entity';
import { Booking } from '../booking/booking.entity';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';

@Injectable()
export class PembayaranService {
  constructor(
    @InjectRepository(Pembayaran)
    private readonly repo: Repository<Pembayaran>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly amqp: AmqpConnection,
  ) {}

  async create(dto: CreatePembayaranDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.booking_id },
    });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    const pembayaran = this.repo.create({
      booking_id: dto.booking_id,
      jumlah: dto.jumlah,
      status: PembayaranStatus.SUCCESS,
    });
    const saved = await this.repo.save(pembayaran);

    await this.amqp.publish('klinik.exchange', 'payment.processed', {
      bookingId: dto.booking_id,
      jumlahDibayar: dto.jumlah,
    });

    return saved;
  }
}
