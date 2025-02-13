import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { RateService } from '../rate.service';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service'; // Import FileManagerService

@Injectable()
export class RateQueueService implements OnModuleInit {
  constructor(
    private readonly rateService: RateService,
    private readonly fileManagerService: FileManagerService, // Inject FileManagerService
  ) {}

  onModuleInit() {
    cron.schedule('* * * * *', async () => {
      const lastRunTime = this.fileManagerService.readLastRunTime();

      const currentTime = Date.now();
      const oneMinute = 60 * 1000;

      // If lastRunTime is null or if the last job was more than 1 minute ago
      if (!lastRunTime || currentTime - lastRunTime >= oneMinute) {
        try {
          await this.rateService.fetchRates();
          console.log('✅ Rates updated successfully');

          // Update the last run time after the job completes
          this.fileManagerService.writeLastRunTime(currentTime);
        } catch (error) {
          console.error('❌ Error fetching rates:', error);
        }
      } else {
        console.log('⏰ Job skipped: Less than 1 minute since last run');
      }
    });
  }
}
