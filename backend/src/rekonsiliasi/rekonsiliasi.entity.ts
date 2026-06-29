import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from '../booking/booking.entity';

export enum RekonsiliasisStatus {
  MATCH = 'match',
  SELISIH = 'selisih',
  PENDING = 'pending',
}

@Entity('rekonsiliasi')
@Index(['booking_id'])
@Index(['status'])
export class Rekonsiliasi {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  booking_id!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  jumlah_seharusnya!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  jumlah_dibayar!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  selisih!: number;

  @Column({
    type: 'enum',
    enum: RekonsiliasisStatus,
    default: RekonsiliasisStatus.PENDING,
  })
  status!: RekonsiliasisStatus;

  @OneToOne(() => Booking, (booking) => booking.rekonsiliasi)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;
}
