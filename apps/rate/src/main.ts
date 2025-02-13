import { NestFactory } from '@nestjs/core';
import { RateModule } from './rate.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  console.log('Starting RateService...'); // Debug log
  const app = await NestFactory.create(RateModule);
  const port = process.env.PORT || 3000; // Use environment variable or default to 3000
  await app.listen(port);

  const logger = new Logger('RateService');
  logger.log(`RateService is running on port ${port}`);
}
bootstrap();
