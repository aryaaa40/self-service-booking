import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Pembayaran')
@Controller('pembayaran')
export class PembayaranController {
  constructor(private readonly service: PembayaranService) {}

  @Post()
  @ApiOperation({
    summary: 'Proses pembayaran booking',
    description:
      'Hanya untuk pasien Umum. Setelah pembayaran diproses, rekonsiliasi diupdate dan booking otomatis confirmed + dapat nomor antrian.',
  })
  @ApiResponse({ status: 201, description: 'Pembayaran berhasil diproses.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({ status: 404, description: 'Booking tidak ditemukan.' })
  @ResponseMessage('Pembayaran berhasil diproses.')
  create(@Body() dto: CreatePembayaranDto) {
    return this.service.create(dto);
  }
}
