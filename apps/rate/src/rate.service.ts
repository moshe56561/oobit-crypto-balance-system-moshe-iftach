import { Injectable, OnModuleInit } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { MessagePattern } from '@nestjs/microservices';
import axios from 'axios';
import { MESSAGE_CONSTANTS } from '@app/shared/constants/messages'; // Import the message constants
import { FILE_CONSTANTS } from '@app/shared/constants/files'; // Import file constants
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service
import { LoggerService } from '@app/shared/logger/logger.service'; // Import the logger service

@Injectable()
export class RateService implements OnModuleInit {
  private readonly ratesFile = FILE_CONSTANTS.RATE_SERVICE.RATES_FILE;
  private readonly coinGeckoUrl =
    'https://api.coingecko.com/api/v3/simple/price';
  private cache: { rates: any; timestamp: number } = {
    rates: null,
    timestamp: 0,
  };
  private readonly cacheTTL = 60000; // 1 minute

  constructor(
    private readonly fileManager: FileManagerService,
    private readonly errorHandlingService: ErrorHandlingService, // Inject error handling service
    private readonly logger: LoggerService, // Inject the logger service
  ) {}

  async fetchRates(): Promise<void> {
    try {
      const response = await axios.get(this.coinGeckoUrl, {
        params: {
          ids: 'bitcoin,ethereum,oobit',
          vs_currencies: 'usd',
        },
        timeout: 5000, // Prevents long hangs
      });

      this.cache = { rates: response.data, timestamp: Date.now() };

      await this.fileManager.writeFile(this.ratesFile, response.data);
      this.logger.log(`✅ Rates successfully written to ${this.ratesFile}`);
    } catch (error) {
      this.errorHandlingService.handleError(error); // Use the error handling service
      this.logger.error(`❌ Failed to fetch rates: ${error.message}`);
    }
  }

  async getRates(): Promise<any> {
    if (Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.rates;
    }
    await this.fetchRates();
    return this.cache.rates;
  }

  @MessagePattern({ cmd: MESSAGE_CONSTANTS.RATE_SERVICE.GET_RATES })
  async getRatesMicroservice(): Promise<any> {
    return this.getRates();
  }

  onModuleInit() {
    this.logger.log('🚀 RateService initialized'); // Use the logger here
  }
}
