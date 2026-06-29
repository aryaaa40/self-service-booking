import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JadwalDokter } from './jadwal-dokter.entity';
import { Booking } from '../booking/booking.entity';
import { JadwalService } from './jadwal.service';
import { JadwalController } from './jadwal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JadwalDokter, Booking])],
  controllers: [JadwalController],
  providers: [JadwalService],
})
export class JadwalModule {}
