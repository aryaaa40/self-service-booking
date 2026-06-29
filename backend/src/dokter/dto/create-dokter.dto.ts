import { IsString, IsNumber } from 'class-validator';

export class CreateDokterDto {
  @IsString()
  nama!: string;

  @IsString()
  spesialisasi!: string;

  @IsNumber()
  klinik_id!: number;
}
