import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePembayaranDto {
  @ApiProperty({ example: 1, description: 'ID booking yang akan dibayar' })
  @IsNumber()
  booking_id!: number;

  @ApiProperty({
    example: 150000,
    description: 'Jumlah pembayaran dalam rupiah',
  })
  @IsNumber()
  @IsPositive()
  jumlah!: number;
}
