import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pasien } from '../pasien/pasien.entity';
import { Rujukan } from '../rujukan/rujukan.entity';
import { KioskService } from './kiosk.service';
import { KioskController } from './kiosk.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pasien, Rujukan])],
  controllers: [KioskController],
  providers: [KioskService],
})
export class KioskModule {}
