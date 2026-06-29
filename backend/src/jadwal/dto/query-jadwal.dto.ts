import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryJadwalDto {
  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Filter jadwal pada tanggal tertentu (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  tanggal?: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Filter berdasarkan ID dokter',
  })
  @IsOptional()
  @IsNumberString()
  dokter_id?: string;

  @ApiPropertyOptional({
    example: 'Jantung & Pembuluh Darah',
    description: 'Filter berdasarkan spesialisasi dokter',
  })
  @IsOptional()
  @IsString()
  spesialisasi?: string;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Tampilkan jadwal mulai tanggal ini ke depan (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  dari_tanggal?: string;
}
