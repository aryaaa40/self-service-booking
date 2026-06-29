import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PasienService } from './pasien.service';
import { CreatePasienDto } from './dto/create-pasien.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Pasien')
@Controller('pasien')
export class PasienController {
  constructor(private readonly pasienService: PasienService) {}

  @Get()
  @ApiOperation({ summary: 'Mengambil semua data pasien.' })
  @ApiResponse({ status: 200, description: 'Daftar semua pasien.' })
  @ResponseMessage('Data pasien berhasil diambil.')
  findAll() {
    return this.pasienService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil data detail pasien berdasarkan ID.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail pasien.' })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan.' })
  @ResponseMessage('Detail pasien berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pasienService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan pasien baru.' })
  @ApiResponse({ status: 201, description: 'Pasien berhasil ditambahkan.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal.' })
  @ApiResponse({
    status: 409,
    description: 'NIK atau No. BPJS sudah terdaftar.',
  })
  @ResponseMessage('Pasien berhasil ditambahkan')
  create(@Body() dto: CreatePasienDto) {
    return this.pasienService.create(dto);
  }
}
