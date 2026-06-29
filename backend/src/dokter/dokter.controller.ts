import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { DokterService } from './dokter.service';
import { CreateDokterDto } from './dto/create-dokter.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('dokter')
export class DokterController {
  constructor(private readonly dokterService: DokterService) {}

  @Get()
  @ResponseMessage('Data dokter berhasil diambil.')
  findAll() {
    return this.dokterService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Detail dokter berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dokterService.findOne(id);
  }

  @Post()
  @ResponseMessage('Dokter berhasil ditambahkan.')
  create(@Body() dto: CreateDokterDto) {
    return this.dokterService.create(dto);
  }
}
