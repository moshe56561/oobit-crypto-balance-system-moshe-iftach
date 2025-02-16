import { NestFactory } from '@nestjs/core';
import { RateModule } from './rate.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

async function bootstrap() {
  const logger = new Logger('RateService');

  try {
    logger.log('Starting RateService...');

    // Read environment variables
    const host = process.env.RATE_SERVICE_HOST || 'localhost';
    const port = Number(process.env.RATE_SERVICE_PORT) || 3000;

    // Create the microservice application
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      RateModule,
      {
        transport: Transport.TCP,
        options: {
          host, // Use env variable
          port, // Use env variable
        },
      },
    );

    // Start the microservice
    await app.listen();
    logger.log(`RateService microservice is listening on ${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start RateService', error.stack);
  }
}

bootstrap();
