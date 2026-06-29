import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Dokter } from '../dokter/dokter.entity';
import { Booking } from '../booking/booking.entity';

@Entity('jadwal_dokter')
@Index(['dokter_id'])
@Index(['tanggal', 'dokter_id'])
export class JadwalDokter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  dokter_id!: number;

  @Column({ type: 'date' })
  tanggal!: string;

  @Column({ type: 'time' })
  jam_mulai!: string;

  @Column({ type: 'time' })
  jam_selesai!: string;

  @Column()
  kapasitas!: number;

  @ManyToOne(() => Dokter, (dokter) => dokter.jadwal)
  @JoinColumn({ name: 'dokter_id' })
  dokter!: Dokter;

  @OneToMany(() => Booking, (booking) => booking.jadwal)
  bookings!: Booking[];
}
