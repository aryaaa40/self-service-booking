import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Booking } from '../booking/booking.entity';

export enum PembayaranStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('pembayaran')
@Index(['booking_id'])
@Index(['status'])
@Index(['created_at'])
export class Pembayaran {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  booking_id!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  jumlah!: number;

  @Column({
    type: 'enum',
    enum: PembayaranStatus,
    default: PembayaranStatus.PENDING,
  })
  status!: PembayaranStatus;

  @CreateDateColumn()
  created_at!: Date;

  @OneToOne(() => Booking, (booking) => booking.pembayaran)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;
}
