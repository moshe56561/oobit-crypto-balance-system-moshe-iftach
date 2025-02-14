import { NestFactory } from '@nestjs/core';
import { RateModule } from './rate.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  console.log('Starting RateService...'); // Debug log
  const app = await NestFactory.create(RateModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP, // You can use other transports as needed
    options: { host: 'localhost', port: 3000 },
  });

  await app.startAllMicroservices(); // Start microservices
  await app.listen(3000);

  const logger = new Logger('RateService');
  logger.log(`RateService is running on port 3000`);
}
bootstrap();
