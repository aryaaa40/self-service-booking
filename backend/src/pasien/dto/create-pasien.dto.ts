import { IsString, IsEnum, IsOptional, IsEmail, Length } from 'class-validator';
import { JenisPasien, Gender } from '../pasien.entity';

export class CreatePasienDto {
  @IsString()
  nama!: string;

  @IsString()
  @Length(16, 16)
  nik!: string;

  @IsEnum(JenisPasien)
  jenis_pasien!: JenisPasien;

  @IsEnum(Gender)
  gender!: Gender;

  @IsOptional()
  @IsString()
  no_bpjs?: string;

  @IsOptional()
  @IsString()
  no_hp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
