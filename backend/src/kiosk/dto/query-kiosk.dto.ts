import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryKioskDto {
  @ApiPropertyOptional({
    example: '3201010101010001',
    description: 'Nomor Induk Kependudukan (16 digit)',
  })
  @IsOptional()
  @IsString()
  nik?: string;

  @ApiPropertyOptional({
    example: '0001234567890',
    description: 'Nomor kartu BPJS',
  })
  @IsOptional()
  @IsString()
  no_bpjs?: string;
}
