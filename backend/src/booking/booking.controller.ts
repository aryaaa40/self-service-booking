import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'Menampilkan data semua booking.' })
  @ApiResponse({ status: 200, description: 'Daftar semua booking.' })
  @ResponseMessage('Data booking berhasil diambil.')
  findAll() {
    return this.bookingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil data detail booking berdasarkan ID.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail booking.' })
  @ApiResponse({ status: 404, description: 'Booking tidak ditemukan.' })
  @ResponseMessage('Detail booking berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post()
  @ApiOperation({
    summary: 'Membuat booking baru.',
    description:
      'Pasien BPJS: wajib ada rujukan aktif yang cocok dengan spesialisasi dokter, status langsung confirmed + nomor antrian. Pasien Umum: status pending, confirmed setelah pembayaran.',
  })
  @ApiResponse({ status: 201, description: 'Booking berhasil dibuat.' })
  @ApiResponse({
    status: 400,
    description: 'Tidak ada rujukan aktif / slot penuh.',
  })
  @ApiResponse({ status: 409, description: 'Pasien sudah booking jadwal ini.' })
  @ApiResponse({
    status: 429,
    description: 'Terlalu banyak request (rate limit 5/menit).',
  })
  @ResponseMessage('Booking berhasil ditambahkan.')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan booking.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Booking berhasil dibatalkan.' })
  @ApiResponse({ status: 404, description: 'Booking tidak ditemukan.' })
  @ResponseMessage('Booking berhasil dibatalkan.')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancel(id);
  }
}
