import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KioskService } from './kiosk.service';
import { QueryKioskDto } from './dto/query-kiosk.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Kiosk')
@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Get('cari')
  @ApiOperation({
    summary: 'Mencari data pasien via kiosk.',
    description:
      'Input salah satu: nik atau no_bpjs. Pasien BPJS akan disertai status rujukan aktif. Gunakan spesialisasi dari rujukan untuk filter GET /jadwal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pasien ditemukan beserta status rujukan.',
  })
  @ApiResponse({ status: 400, description: 'Harus input nik atau no_bpjs.' })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan.' })
  @ResponseMessage('Data pasien berhasil ditemukan.')
  cari(@Query() query: QueryKioskDto) {
    return this.kioskService.cari(query);
  }
}
