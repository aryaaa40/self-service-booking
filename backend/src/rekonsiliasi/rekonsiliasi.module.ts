import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rekonsiliasi } from './rekonsiliasi.entity';
import { RekonsiliasisService } from './rekonsiliasi.service';
import { RekonsiliasisConsumer } from './rekonsiliasi.consumer';
import { RekonsiliasisController } from './rekonsiliasi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rekonsiliasi])],
  controllers: [RekonsiliasisController],
  providers: [RekonsiliasisService, RekonsiliasisConsumer],
})
export class RekonsiliasisModule {}
