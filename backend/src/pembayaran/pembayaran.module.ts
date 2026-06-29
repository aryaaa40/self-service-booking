import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pembayaran } from './pembayaran.entity';
import { Booking } from '../booking/booking.entity';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pembayaran, Booking])],
  controllers: [PembayaranController],
  providers: [PembayaranService],
})
export class PembayaranModule {}
