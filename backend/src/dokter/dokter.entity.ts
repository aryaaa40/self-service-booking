import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { JadwalDokter } from '../jadwal/jadwal-dokter.entity';

@Entity('dokter')
export class Dokter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nama!: string;

  @Column()
  spesialisasi!: string;

  @Column()
  klinik_id!: number;

  @OneToMany(() => JadwalDokter, (jadwal) => jadwal.dokter)
  jadwal!: JadwalDokter[];
}
