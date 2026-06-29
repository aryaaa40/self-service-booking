import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BookingService } from './booking.service';
import type { BookingConfirmedEvent } from '../rabbitmq/events';

const DLX_ARGS = { 'x-dead-letter-exchange': 'klinik.dlx' };

@Injectable()
export class BookingConsumer {
  constructor(private readonly service: BookingService) {}

  @RabbitSubscribe({
    exchange: 'klinik.exchange',
    routingKey: 'booking.confirmed',
    queue: 'booking.confirmed.q',
    queueOptions: { durable: true, arguments: DLX_ARGS },
  })
  async onBookingConfirmed(payload: BookingConfirmedEvent): Promise<void> {
    console.log(
      `[MQ] RECEIVED booking.confirmed → bookingId: ${payload.bookingId}`,
    );
    await this.service.confirmFromPayment(payload.bookingId);
  }
}
