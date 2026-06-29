import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { Booking } from '../booking/booking.entity';
import { Rujukan } from '../rujukan/rujukan.entity';

export enum JenisPasien {
  BPJS = 'bpjs',
  UMUM = 'umum',
}

export enum Gender {
  LAKI_LAKI = 'laki_laki',
  PEREMPUAN = 'perempuan',
}

@Entity('pasien')
@Index(['jenis_pasien'])
export class Pasien {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nama!: string;

  @Column({ unique: true })
  nik!: string;

  @Column({ type: 'enum', enum: JenisPasien })
  jenis_pasien!: JenisPasien;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Column({ unique: true, nullable: true, type: 'varchar' })
  no_bpjs!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  no_hp!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  email!: string | null;

  @OneToMany(() => Booking, (booking) => booking.pasien)
  bookings!: Booking[];

  @OneToMany(() => Rujukan, (rujukan) => rujukan.pasien)
  rujukan!: Rujukan[];
}
