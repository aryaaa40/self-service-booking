import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PerpanjangRujukanDto {
  @ApiProperty({
    example: '2026-12-01',
    description: 'Tanggal expired baru (Format: YYYY-MM-DD)',
  })
  @IsDateString()
  tanggal_expired!: string;
}
