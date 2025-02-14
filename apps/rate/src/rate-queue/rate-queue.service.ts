import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { RateService } from '../rate.service';

@Injectable()
export class RateQueueService implements OnModuleInit {
  constructor(private readonly rateService: RateService) {}

  async onModuleInit() {
    cron.schedule('* * * * *', async () => {
      try {
        await this.rateService.fetchRates();
        console.log('✅ Rates updated successfully');
      } catch (error) {
        console.error('❌ Error fetching rates:', error);
      }
    });
  }
}
