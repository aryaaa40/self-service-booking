import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RekonsiliasisService } from './rekonsiliasi.service';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Rekonsiliasi')
@Controller('rekonsiliasi')
export class RekonsiliasisController {
  constructor(private readonly service: RekonsiliasisService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil semua data rekonsiliasi pembayaran' })
  @ApiResponse({ status: 200, description: 'Daftar rekonsiliasi.' })
  @ResponseMessage('Data rekonsiliasi berhasil diambil')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail rekonsiliasi berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail rekonsiliasi.' })
  @ApiResponse({ status: 404, description: 'Rekonsiliasi tidak ditemukan.' })
  @ResponseMessage('Detail rekonsiliasi berhasil diambil')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
