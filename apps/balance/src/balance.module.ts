import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { SharedModule } from '@app/shared';
import { MicroservicesClientModule } from '@app/shared/microservices-client/microservices-client.module';
import { MICRO_SERVICES } from '@app/shared/constants/microservices';
import { ErrorHandlingModule } from '@app/shared/error-handling/error-handling.module';
import { LoggerModule } from '@app/shared/logger/logger.module';

@Module({
  imports: [
    SharedModule,
    ErrorHandlingModule,
    LoggerModule,
    MicroservicesClientModule.register([MICRO_SERVICES.RATE]),
  ],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
