import { NestFactory } from '@nestjs/core';
import { RateModule } from './rate.module';

async function bootstrap() {
  const app = await NestFactory.create(RateModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
