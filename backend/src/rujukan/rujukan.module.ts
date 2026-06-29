import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rujukan } from './rujukan.entity';
import { Pasien } from '../pasien/pasien.entity';
import { RujukanService } from './rujukan.service';
import { RujukanController } from './rujukan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rujukan, Pasien])],
  controllers: [RujukanController],
  providers: [RujukanService],
  exports: [TypeOrmModule],
})
export class RujukanModule {}
