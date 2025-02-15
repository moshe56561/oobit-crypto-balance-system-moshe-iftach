import { Injectable, OnModuleInit } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import axios from 'axios';
import { FILE_CONSTANTS } from '@app/shared/constants/files'; // Import file constants
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service
import { LoggerService } from '@app/shared/logger/logger.service'; // Import the logger service
import { TICKER_MAP } from '@app/shared/constants/ticker-mapping';

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
          ids: 'bitcoin,ethereum,oobit', // Make sure to adjust this as needed
          vs_currencies: 'usd',
        },
        timeout: 5000, // Prevents long hangs
      });

      this.cache = { rates: response.data, timestamp: Date.now() };

      // Check if the fetched coins exist in TICKER_MAP and log if not
      for (const coin in response.data) {
        if (!(coin.toLowerCase() in TICKER_MAP)) {
          this.logger.log(
            `⚠️ The coin ${coin} does not exist in the TICKER_MAP and needs to be added.`,
          );
        }
      }

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

  onModuleInit() {
    this.logger.log('RateService initialized...'); // Use the logger here
  }
}
