import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RekonsiliasisService } from './rekonsiliasi.service';
import type {
  BookingCreatedEvent,
  BookingCancelledEvent,
  PaymentProcessedEvent,
} from '../rabbitmq/events';

const DLX_ARGS = { 'x-dead-letter-exchange': 'klinik.dlx' };

@Injectable()
export class RekonsiliasisConsumer {
  constructor(private readonly service: RekonsiliasisService) {}

  @RabbitSubscribe({
    exchange: 'klinik.exchange',
    routingKey: 'booking.created',
    queue: 'booking.created.q',
    queueOptions: { durable: true, arguments: DLX_ARGS },
  })
  async onBookingCreated(payload: BookingCreatedEvent): Promise<void> {
    console.log(
      `[MQ] RECEIVED booking.created → bookingId: ${payload.bookingId}, jumlah: ${payload.jumlahSeharusnya}`,
    );
    await this.service.handleBookingCreated(payload);
  }

  @RabbitSubscribe({
    exchange: 'klinik.exchange',
    routingKey: 'booking.cancelled',
    queue: 'booking.cancelled.q',
    queueOptions: { durable: true, arguments: DLX_ARGS },
  })
  async onBookingCancelled(payload: BookingCancelledEvent): Promise<void> {
    console.log(
      `[MQ] RECEIVED booking.cancelled → bookingId: ${payload.bookingId}`,
    );
    await this.service.handleBookingCancelled(payload.bookingId);
  }

  @RabbitSubscribe({
    exchange: 'klinik.exchange',
    routingKey: 'payment.processed',
    queue: 'payment.processed.q',
    queueOptions: { durable: true, arguments: DLX_ARGS },
  })
  async onPaymentProcessed(payload: PaymentProcessedEvent): Promise<void> {
    console.log(
      `[MQ] RECEIVED payment.processed → bookingId: ${payload.bookingId}, dibayar: ${payload.jumlahDibayar}`,
    );
    await this.service.handlePaymentProcessed(payload);
  }
}
