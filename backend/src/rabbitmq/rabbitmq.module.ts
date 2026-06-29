import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          { name: 'klinik.exchange', type: 'direct' },
          { name: 'klinik.dlx', type: 'direct' },
        ],
        uri: `amqp://${config.get('RABBITMQ_USER', 'guest')}:${config.get('RABBITMQ_PASS', 'guest')}@${config.get('RABBITMQ_HOST', 'localhost')}:${config.get<number>('RABBITMQ_PORT', 5672)}`,
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule {}
