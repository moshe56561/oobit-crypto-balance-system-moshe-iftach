import { Module, Global } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { SharedModule } from '@app/shared';
import { RateQueueModule } from './rate-queue/rate-queue.module';
import { ErrorHandlingModule } from '@app/shared/error-handling/error-handling.module';
import { LoggerModule } from '@app/shared/logger/logger.module';

@Global()
@Module({
  imports: [SharedModule, RateQueueModule, ErrorHandlingModule, LoggerModule],
  controllers: [RateController],
  providers: [RateService],
  exports: [RateService], // Export only RateService, not ClientsModule=
})
export class RateModule {}
