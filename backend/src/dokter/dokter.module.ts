import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dokter } from './dokter.entity';
import { DokterService } from './dokter.service';
import { DokterController } from './dokter.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dokter])],
  controllers: [DokterController],
  providers: [DokterService],
})
export class DokterModule {}
