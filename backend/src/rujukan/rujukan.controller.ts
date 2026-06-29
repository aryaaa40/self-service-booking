import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RujukanService } from './rujukan.service';
import { CreateRujukanDto } from './dto/create-rujukan.dto';
import { PerpanjangRujukanDto } from './dto/perpanjang-rujukan.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Rujukan (Admin)')
@Controller('rujukan')
export class RujukanController {
  constructor(private readonly rujukanService: RujukanService) {}

  @Post()
  @ApiOperation({ summary: 'Tambah rujukan baru untuk pasien BPJS' })
  @ApiResponse({ status: 201, description: 'Rujukan berhasil ditambahkan.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan.' })
  @ResponseMessage('Rujukan berhasil ditambahkan.')
  create(@Body() dto: CreateRujukanDto) {
    return this.rujukanService.create(dto);
  }

  @Get(':pasien_id')
  @ApiOperation({ summary: 'Lihat semua rujukan milik pasien' })
  @ApiParam({ name: 'pasien_id', type: Number })
  @ApiResponse({ status: 200, description: 'Daftar rujukan pasien.' })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan.' })
  @ResponseMessage('Data rujukan berhasil diambil.')
  findByPasien(@Param('pasien_id', ParseIntPipe) pasienId: number) {
    return this.rujukanService.findByPasien(pasienId);
  }

  @Patch(':id/perpanjang')
  @ApiOperation({
    summary: 'Perpanjang rujukan yang expired',
    description: 'Update tanggal_expired dan set status kembali ke aktif.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Rujukan berhasil diperpanjang.' })
  @ApiResponse({ status: 404, description: 'Rujukan tidak ditemukan.' })
  @ResponseMessage('Rujukan berhasil diperpanjang.')
  perpanjang(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PerpanjangRujukanDto,
  ) {
    return this.rujukanService.perpanjang(id, dto);
  }
}
