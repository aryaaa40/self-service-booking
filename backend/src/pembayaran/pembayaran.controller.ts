import { Controller, Post, Body } from '@nestjs/common';
import { PembayaranService } from './pembayaran.service';
import { CreatePembayaranDto } from './dto/create-pembayaran.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('pembayaran')
export class PembayaranController {
  constructor(private readonly service: PembayaranService) {}

  @Post()
  @ResponseMessage('Pembayaran berhasil diproses.')
  create(@Body() dto: CreatePembayaranDto) {
    return this.service.create(dto);
  }
}
