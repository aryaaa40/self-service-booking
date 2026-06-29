import { IsNumber, IsString } from 'class-validator';

export class CreateJadwalDto {
  @IsNumber()
  dokter_id!: number;

  @IsString()
  tanggal!: string;

  @IsString()
  jam_mulai!: string;

  @IsString()
  jam_selesai!: string;

  @IsNumber()
  kapasitas!: number;
}
