import { IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateRujukanDto {
  @IsNumber()
  pasien_id!: number;

  @IsString()
  spesialisasi_tujuan!: string;

  @IsString()
  rs_asal!: string;

  @IsDateString()
  tanggal_berlaku!: string;

  @IsDateString()
  tanggal_expired!: string;
}
