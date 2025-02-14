import { Module, forwardRef } from '@nestjs/common';
import { RateQueueService } from './rate-queue.service';
import { RateModule } from '../rate.module';
import { SharedModule } from '@app/shared';
import { ErrorHandlingModule } from '@app/shared/error-handling/error-handling.module';
import { LoggerModule } from '@app/shared/logger/logger.module';

@Module({
  imports: [
    SharedModule,
    forwardRef(() => RateModule),
    ErrorHandlingModule,
    LoggerModule,
  ],
  providers: [RateQueueService],
  exports: [RateQueueService],
})
export class RateQueueModule {}
