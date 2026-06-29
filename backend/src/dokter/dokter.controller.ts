import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DokterService } from './dokter.service';
import { CreateDokterDto } from './dto/create-dokter.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Dokter')
@Controller('dokter')
export class DokterController {
  constructor(private readonly dokterService: DokterService) {}

  @Get()
  @ApiOperation({ summary: 'Mengambil semua data dokter.' })
  @ApiResponse({ status: 200, description: 'Daftar semua dokter.' })
  @ResponseMessage('Data dokter berhasil diambil.')
  findAll() {
    return this.dokterService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil data detail dokter berdasarkan ID.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail dokter.' })
  @ApiResponse({ status: 404, description: 'Dokter tidak ditemukan.' })
  @ResponseMessage('Detail dokter berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dokterService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan dokter baru.' })
  @ApiResponse({ status: 201, description: 'Dokter berhasil ditambahkan.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ResponseMessage('Dokter berhasil ditambahkan.')
  create(@Body() dto: CreateDokterDto) {
    return this.dokterService.create(dto);
  }
}
