import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ResponseMessage('Data booking berhasil diambil.')
  findAll() {
    return this.bookingService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Detail booking berhasil diambil.')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @Post()
  @ResponseMessage('Booking berhasil ditambahkan.')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  @Patch(':id/cancel')
  @ResponseMessage('Booking berhasil dibatalkan.')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancel(id);
  }
}
