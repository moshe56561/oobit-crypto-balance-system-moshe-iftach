import { Module, Global } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { SharedModule } from '@app/shared';
import { RateQueueModule } from './rate-queue/rate-queue.module';

@Global()
@Module({
  imports: [SharedModule, RateQueueModule],
  controllers: [RateController],
  providers: [RateService],
  exports: [RateService], // Export only RateService, not ClientsModule
})
export class RateModule {}
