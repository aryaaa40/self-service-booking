import { IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsNumber()
  pasien_id!: number;

  @IsNumber()
  jadwal_dokter_id!: number;
}
