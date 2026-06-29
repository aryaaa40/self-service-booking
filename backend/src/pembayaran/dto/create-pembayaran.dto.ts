import { IsNumber, IsPositive } from 'class-validator';

export class CreatePembayaranDto {
  @IsNumber()
  booking_id!: number;

  @IsNumber()
  @IsPositive()
  jumlah!: number;
}
