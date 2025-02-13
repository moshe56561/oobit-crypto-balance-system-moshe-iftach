import { Module, forwardRef } from '@nestjs/common';
import { RateQueueService } from './rate-queue.service';
import { RateModule } from '../rate.module';
import { SharedModule } from '@app/shared';

@Module({
  imports: [SharedModule, forwardRef(() => RateModule)],
  providers: [RateQueueService],
  exports: [RateQueueService],
})
export class RateQueueModule {}
