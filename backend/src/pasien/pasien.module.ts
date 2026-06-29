import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pasien } from './pasien.entity';
import { PasienService } from './pasien.service';
import { PasienController } from './pasien.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pasien])],
  controllers: [PasienController],
  providers: [PasienService],
})
export class PasienModule {}
