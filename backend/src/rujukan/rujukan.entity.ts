import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Pasien } from '../pasien/pasien.entity';

export enum RujukanStatus {
  AKTIF = 'aktif',
  EXPIRED = 'expired',
}

@Entity('rujukan')
@Index(['pasien_id'])
@Index(['pasien_id', 'status'])
export class Rujukan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pasien_id!: number;

  @Column()
  spesialisasi_tujuan!: string;

  @Column()
  rs_asal!: string;

  @Column({ type: 'date' })
  tanggal_berlaku!: string;

  @Column({ type: 'date' })
  tanggal_expired!: string;

  @Column({ type: 'enum', enum: RujukanStatus, default: RujukanStatus.AKTIF })
  status!: RujukanStatus;

  @ManyToOne(() => Pasien, (pasien) => pasien.rujukan)
  @JoinColumn({ name: 'pasien_id' })
  pasien!: Pasien;
}
