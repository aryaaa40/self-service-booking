import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDokterDto {
  @ApiProperty({ example: 'dr. Budi Santoso, Sp.PD' })
  @IsString()
  nama!: string;

  @ApiProperty({ example: 'Penyakit Dalam' })
  @IsString()
  spesialisasi!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  klinik_id!: number;
}
