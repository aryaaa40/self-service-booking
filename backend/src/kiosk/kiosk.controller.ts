import { Controller, Get, Query } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { QueryKioskDto } from './dto/query-kiosk.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Get('cari')
  @ResponseMessage('Data pasien berhasil ditemukan.')
  cari(@Query() query: QueryKioskDto) {
    return this.kioskService.cari(query);
  }
}
