import { NestFactory } from '@nestjs/core';
import { RateModule } from './rate.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('RateService');

  try {
    logger.log('Starting RateService...'); // Debug log

    // Create the microservice application
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      RateModule,
      {
        transport: Transport.TCP, // Use TCP transport
        options: {
          host: 'localhost', // Host to listen on
          port: 3000, // Port to listen on
        },
      },
    );

    // Start the microservice
    await app.listen();
    logger.log('RateService microservice is listening on port 3000');
  } catch (error) {
    logger.error('Failed to start RateService', error.stack);
  }
}

bootstrap();
