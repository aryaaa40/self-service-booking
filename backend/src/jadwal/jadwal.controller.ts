import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JadwalService } from './jadwal.service';
import { CreateJadwalDto } from './dto/create-jadwal.dto';
import { QueryJadwalDto } from './dto/query-jadwal.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Jadwal')
@Controller('jadwal')
export class JadwalController {
  constructor(private readonly jadwalService: JadwalService) {}

  @SkipThrottle({ global: true })
  @Get()
  @ApiOperation({
    summary: 'Mengambil data jadwal tersedia.',
    description:
      'Mendukung filter: tanggal, dokter_id, spesialisasi, dari_tanggal. Hanya menampilkan jadwal yang masih ada sisa kuota.',
  })
  @ApiResponse({ status: 200, description: 'Daftar jadwal tersedia.' })
  @ResponseMessage('Data jadwal berhasil diambil.')
  findTersedia(@Query() query: QueryJadwalDto) {
    return this.jadwalService.findTersedia(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil data detail jadwal berdasarkan ID.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail jadwal.' })
  @ApiResponse({ status: 404, description: 'Jadwal tidak ditemukan.' })
  @ResponseMessage('Detail jadwal berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jadwalService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan jadwal baru.' })
  @ApiResponse({ status: 201, description: 'Jadwal berhasil ditambahkan.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ResponseMessage('Jadwal berhasil ditambahkan.')
  create(@Body() dto: CreateJadwalDto) {
    return this.jadwalService.create(dto);
  }
}
