import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RekonsiliasisService } from './rekonsiliasi.service';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('rekonsiliasi')
export class RekonsiliasisController {
  constructor(private readonly service: RekonsiliasisService) {}

  @Get()
  @ResponseMessage('Data rekonsiliasi berhasil diambil')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ResponseMessage('Detail rekonsiliasi berhasil diambil')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
