import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJadwalDto {
  @ApiProperty({ example: 1, description: 'ID dokter' })
  @IsNumber()
  dokter_id!: number;

  @ApiProperty({ example: '2026-07-01', description: 'Format: YYYY-MM-DD' })
  @IsString()
  tanggal!: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  jam_mulai!: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  jam_selesai!: string;

  @ApiProperty({ example: 15, description: 'Jumlah slot pasien' })
  @IsNumber()
  kapasitas!: number;
}
