import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JadwalService } from './jadwal.service';
import { CreateJadwalDto } from './dto/create-jadwal.dto';
import { QueryJadwalDto } from './dto/query-jadwal.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('jadwal')
export class JadwalController {
  constructor(private readonly jadwalService: JadwalService) {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @SkipThrottle({ global: true })
  @Get()
  @ResponseMessage('Data jadwal berhasil diambil.')
  findTersedia(@Query() query: QueryJadwalDto) {
    return this.jadwalService.findTersedia(query);
  }

  @Get(':id')
  @ResponseMessage('Detail jadwal berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jadwalService.findOne(id);
  }

  @Post()
  @ResponseMessage('Jadwal berhasil ditambahkan.')
  create(@Body() dto: CreateJadwalDto) {
    return this.jadwalService.create(dto);
  }
}
