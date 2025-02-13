import { Module, forwardRef, Global } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { SharedModule } from '@app/shared'; // Import the SharedModule
import { RateQueueModule } from './rate-queue/rate-queue.module'; // Import the RateQueueModule

@Global() // Make sure RateService is available globally
@Module({
  imports: [SharedModule, forwardRef(() => RateQueueModule)], // Use forwardRef()
  controllers: [RateController],
  providers: [RateService],
  exports: [RateService], // Export the RateService for global use
})
export class RateModule {}
