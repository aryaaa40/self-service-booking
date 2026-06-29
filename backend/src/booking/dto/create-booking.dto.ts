import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: 'ID pasien' })
  @IsNumber()
  pasien_id!: number;

  @ApiProperty({ example: 1, description: 'ID jadwal dokter' })
  @IsNumber()
  jadwal_dokter_id!: number;
}
