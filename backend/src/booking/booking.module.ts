import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { JadwalDokter } from '../jadwal/jadwal-dokter.entity';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Pasien } from '../pasien/pasien.entity';
import { Rujukan } from '../rujukan/rujukan.entity';
import { BookingConsumer } from './booking.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, JadwalDokter, Pasien, Rujukan])],
  controllers: [BookingController],
  providers: [BookingService, BookingConsumer],
})
export class BookingModule {}
