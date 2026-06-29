import { IsNumber, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRujukanDto {
  @ApiProperty({ example: 1, description: 'ID pasien BPJS' })
  @IsNumber()
  pasien_id!: number;

  @ApiProperty({
    example: 'Jantung & Pembuluh Darah',
    description: 'Harus cocok dengan spesialisasi dokter yang akan dipilih',
  })
  @IsString()
  spesialisasi_tujuan!: string;

  @ApiProperty({ example: 'RSUD Koja' })
  @IsString()
  rs_asal!: string;

  @ApiProperty({ example: '2026-06-01', description: 'Format: YYYY-MM-DD' })
  @IsDateString()
  tanggal_berlaku!: string;

  @ApiProperty({ example: '2026-09-01', description: 'Format: YYYY-MM-DD' })
  @IsDateString()
  tanggal_expired!: string;
}
