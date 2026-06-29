import { IsOptional, IsString } from 'class-validator';

export class QueryKioskDto {
  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsString()
  no_bpjs?: string;
}
