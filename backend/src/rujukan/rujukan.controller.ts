import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { RujukanService } from './rujukan.service';
import { CreateRujukanDto } from './dto/create-rujukan.dto';
import { PerpanjangRujukanDto } from './dto/perpanjang-rujukan.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('rujukan')
export class RujukanController {
  constructor(private readonly rujukanService: RujukanService) {}

  @Post()
  @ResponseMessage('Rujukan berhasil ditambahkan.')
  create(@Body() dto: CreateRujukanDto) {
    return this.rujukanService.create(dto);
  }

  @Get(':pasien_id')
  @ResponseMessage('Data rujukan berhasil diambil.')
  findByPasien(@Param('pasien_id', ParseIntPipe) pasienId: number) {
    return this.rujukanService.findByPasien(pasienId);
  }

  @Patch(':id/perpanjang')
  @ResponseMessage('Rujukan berhasil diperpanjang.')
  perpanjang(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PerpanjangRujukanDto,
  ) {
    return this.rujukanService.perpanjang(id, dto);
  }
}
