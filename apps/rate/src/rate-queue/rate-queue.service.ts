import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { RateService } from '../rate.service';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import ErrorHandlingService
import { LoggerService } from '@app/shared/logger/logger.service'; // Import LoggerService

@Injectable()
export class RateQueueService implements OnModuleInit {
  constructor(
    private readonly rateService: RateService,
    private readonly errorHandlingService: ErrorHandlingService, // Inject ErrorHandlingService
    private readonly logger: LoggerService, // Inject LoggerService
  ) {}

  async onModuleInit() {
    // First time running service getting rates.
    await this.rateService.fetchRates();

    // Cron job fetching rates every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.rateService.fetchRates();
        this.logger.log('✅ Rates updated successfully'); // Use LoggerService for success logging
      } catch (error) {
        this.errorHandlingService.handleError(
          error,
          true,
          'Error fetching rates',
        ); // Use ErrorHandlingService for error handling
        this.logger.error(`❌ Error fetching rates: ${error.message}`); // Use LoggerService for error logging
      }
    });
  }
}
