import { IsString, IsEnum, IsOptional, IsEmail, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JenisPasien, Gender } from '../pasien.entity';

export class CreatePasienDto {
  @ApiProperty({ example: 'Andi Pratama' })
  @IsString()
  nama!: string;

  @ApiProperty({ example: '3201010101010001', description: 'NIK 16 digit' })
  @IsString()
  @Length(16, 16)
  nik!: string;

  @ApiProperty({ enum: JenisPasien, example: JenisPasien.UMUM })
  @IsEnum(JenisPasien)
  jenis_pasien!: JenisPasien;

  @ApiProperty({ enum: Gender, example: Gender.LAKI_LAKI })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiPropertyOptional({
    example: '0001234567890',
    description: 'Wajib diisi jika jenis_pasien = bpjs',
  })
  @IsOptional()
  @IsString()
  no_bpjs?: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  no_hp?: string;

  @ApiPropertyOptional({ example: 'andi@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
