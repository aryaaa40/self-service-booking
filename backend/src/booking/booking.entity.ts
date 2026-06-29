import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Pasien } from '../pasien/pasien.entity';
import { JadwalDokter } from '../jadwal/jadwal-dokter.entity';
import { Pembayaran } from '../pembayaran/pembayaran.entity';
import { Rekonsiliasi } from '../rekonsiliasi/rekonsiliasi.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('booking')
@Index(['pasien_id'])
@Index(['status'])
@Index(['created_at'])
@Index(['jadwal_dokter_id', 'status'])
@Unique(['pasien_id', 'jadwal_dokter_id'])
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pasien_id!: number;

  @Column()
  jadwal_dokter_id!: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ nullable: true, type: 'int' })
  nomor_antrian!: number | null;

  @ManyToOne(() => Pasien, (pasien) => pasien.bookings)
  @JoinColumn({ name: 'pasien_id' })
  pasien!: Pasien;

  @ManyToOne(() => JadwalDokter, (jadwal) => jadwal.bookings)
  @JoinColumn({ name: 'jadwal_dokter_id' })
  jadwal!: JadwalDokter;

  @OneToOne(() => Pembayaran, (pembayaran) => pembayaran.booking)
  pembayaran!: Pembayaran;

  @OneToOne(() => Rekonsiliasi, (rekonsiliasi) => rekonsiliasi.booking)
  rekonsiliasi!: Rekonsiliasi;
}
