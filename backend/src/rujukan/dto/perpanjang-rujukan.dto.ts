import { IsDateString } from 'class-validator';

export class PerpanjangRujukanDto {
  @IsDateString()
  tanggal_expired!: string;

  // Kedepannya akan menambahkan untuk attachment terkait kartu BPJS, KK, dan surat rujukan lama.
}
