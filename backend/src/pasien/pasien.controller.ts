import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { PasienService } from './pasien.service';
import { CreatePasienDto } from './dto/create-pasien.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('pasien')
export class PasienController {
  constructor(private readonly pasienService: PasienService) {}

  @Get()
  @ResponseMessage('Data pasien berhasil diambil.')
  findAll() {
    return this.pasienService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Detail pasien berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pasienService.findOne(id);
  }

  @Post()
  @ResponseMessage('Pasien berhasil ditambahkan')
  create(@Body() dto: CreatePasienDto) {
    return this.pasienService.create(dto);
  }
}
