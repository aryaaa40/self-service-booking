import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';

import { DokterModule } from './dokter/dokter.module';
import { JadwalModule } from './jadwal/jadwal.module';
import { PasienModule } from './pasien/pasien.module';
import { BookingModule } from './booking/booking.module';
import { PembayaranModule } from './pembayaran/pembayaran.module';
import { RekonsiliasisModule } from './rekonsiliasi/rekonsiliasi.module';
import { RujukanModule } from './rujukan/rujukan.module';
import { KioskModule } from './kiosk/kiosk.module';
import { HttpThrottlerGuard } from './common/guards/http-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_DATABASE', 'klinik_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') !== 'production',
        extra: {
          max: config.get<number>('DB_POOL_MAX', 10),
          min: config.get<number>('DB_POOL_MIN', 2),
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 3000,
        },
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [
          createKeyv(
            `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`,
          ),
        ],
      }),
    }),

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 1 menit (ms)
        limit: 100, // 100 req/menit per IP
      },
    ]),
    RabbitmqModule,

    DokterModule,
    JadwalModule,
    PasienModule,
    BookingModule,
    PembayaranModule,
    RekonsiliasisModule,
    RujukanModule,
    KioskModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class AppModule {}
