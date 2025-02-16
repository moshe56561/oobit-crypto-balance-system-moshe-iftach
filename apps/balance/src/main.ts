import { NestFactory } from '@nestjs/core';
import { BalanceModule } from './balance.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(BalanceModule);
  const port = Number(process.env.BALANCE_SERVICE_PORT) || 3001; // Use environment variable or default to 3001
  await app.listen(port);

  const logger = new Logger('BalanceService');
  logger.log(`BalanceService is running on port ${port}`);
}
bootstrap();
