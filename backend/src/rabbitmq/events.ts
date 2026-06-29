export interface BookingCreatedEvent {
  bookingId: number;
  jadwalId: number;
  jumlahSeharusnya: number;
}

export interface BookingCancelledEvent {
  bookingId: number;
}

export interface PaymentProcessedEvent {
  bookingId: number;
  jumlahDibayar: number;
}

export interface BookingConfirmedEvent {
  bookingId: number;
}
