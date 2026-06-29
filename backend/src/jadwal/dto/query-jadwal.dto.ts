import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryJadwalDto {
  @IsOptional()
  @IsString()
  tanggal?: string;

  @IsOptional()
  @IsNumberString()
  dokter_id?: string;

  @IsOptional()
  @IsString()
  spesialisasi?: string;

  @IsOptional()
  @IsString()
  dari_tanggal?: string;
}
