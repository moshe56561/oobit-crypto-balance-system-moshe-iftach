// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
// import axios from 'axios';
// import { FILE_CONSTANTS } from '@app/shared/constants/files'; // Import file constants
// import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service
// import { LoggerService } from '@app/shared/logger/logger.service'; // Import the logger service
// import { TICKER_MAP } from '@app/shared/constants/ticker-mapping';

// @Injectable()
// export class RateService implements OnModuleInit {
//   private readonly ratesFile = FILE_CONSTANTS.RATE_SERVICE.RATES_FILE;
//   private readonly coinGeckoUrl =
//     'https://api.coingecko.com/api/v3/simple/price';
//   private cache: { rates: any; timestamp: number } = {
//     rates: null,
//     timestamp: 0,
//   };
//   private readonly cacheTTL = 60000; // 1 minute

//   constructor(
//     private readonly fileManager: FileManagerService,
//     private readonly errorHandlingService: ErrorHandlingService, // Inject error handling service
//     private readonly logger: LoggerService, // Inject the logger service
//   ) {}

//   async fetchRates(): Promise<void> {
//     try {
//       const response = await axios.get(this.coinGeckoUrl, {
//         params: {
//           ids: 'bitcoin,ethereum,oobit',
//           vs_currencies: 'usd',
//         },
//         timeout: 5000, // Prevents long hangs
//       });

//       this.cache = { rates: response.data, timestamp: Date.now() };

//       // Check if the fetched coins exist in TICKER_MAP and log if not
//       for (const coin in response.data) {
//         if (!(coin.toLowerCase() in TICKER_MAP)) {
//           this.logger.log(
//             `⚠️ The coin ${coin} does not exist in the TICKER_MAP and needs to be added.`,
//           );
//         }
//       }

//       await this.fileManager.writeFile(this.ratesFile, response.data);
//       this.logger.log(`✅ Rates successfully written to ${this.ratesFile}`);
//     } catch (error) {
//       this.errorHandlingService.handleError(error); // Use the error handling service
//       this.logger.error(`❌ Failed to fetch rates: ${error.message}`);
//     }
//   }

//   async getRates(): Promise<any> {
//     if (Date.now() - this.cache.timestamp < this.cacheTTL) {
//       return this.cache.rates;
//     }
//     await this.fetchRates();
//     return this.cache.rates;
//   }

//   onModuleInit() {
//     this.logger.log('RateService initialized...'); // Use the logger here
//   }
// }

import { Injectable, OnModuleInit } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import axios from 'axios';
import { FILE_CONSTANTS } from '@app/shared/constants/files'; // Import file constants
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service
import { LoggerService } from '@app/shared/logger/logger.service'; // Import the logger service

@Injectable()
export class RateService implements OnModuleInit {
  private readonly ratesFile = FILE_CONSTANTS.RATE_SERVICE.RATES_FILE;
  private readonly unsupportedMarketDataIdsFile =
    FILE_CONSTANTS.RATE_SERVICE.UNSUPPORTED_MARKET_DATA_IDS;

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

  async fetchRates(currentCurrency: string = 'usd'): Promise<void> {
    try {
      // Check if the unsupportedMarketDataIdsFile exists and has data
      let unsupportedIds: string[] = [];
      try {
        const unsupportedData = await this.fileManager.readFile(
          this.unsupportedMarketDataIdsFile,
        );
        unsupportedIds = unsupportedData
          .split(',')
          .map((id: string) => id.trim().replace(/^'|'$/g, ''));
      } catch (error) {
        // If the file does not exist or has no data, continue without appending
        unsupportedIds = [];
      }

      // Initialize the coins object
      let coins: any = {};

      // If there are unsupported IDs, fetch the rates for those specific IDs
      if (unsupportedIds.length > 0) {
        // Pass the current currency and comma-separated IDs to fetchRatesByIds
        const fetchedCoins = await this.fetchRatesByIds(
          currentCurrency,
          unsupportedIds.join(','),
        );
        console.log(
          '🚀 ~ RateService ~ fetchRates ~ fetchedCoins:',
          fetchedCoins,
        );
        // Merge the fetched data with the original coins from the regular fetchRates
        coins = { ...fetchedCoins };
      }

      // Proceed with the regular fetch for all coins, whether or not there are unsupported IDs
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: currentCurrency,
          },
          timeout: 5000, // Prevents long hangs
        },
      );

      // Merge the data from the regular fetch with the coins object
      const regularCoins = response.data.reduce((acc: any, coin: any) => {
        const coinData = {
          price: coin.current_price,
          currency: currentCurrency,
        };

        // Add both coin id and symbol as keys with the same data
        acc[coin.id] = coinData;
        acc[coin.symbol] = coinData;

        return acc;
      }, {});

      // Merge regular coins with the coins object (which might contain unsupported IDs)
      coins = { ...coins, ...regularCoins };

      // Cache the results
      this.cache = { rates: coins, timestamp: Date.now() };

      await this.fileManager.writeFile(this.ratesFile, coins);
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

  async fetchRatesByIds(currency: string = 'usd', ids: string): Promise<any> {
    try {
      // Fetch data from CoinGecko for the specified ids and currency
      const response = await axios.get(this.coinGeckoUrl, {
        params: {
          ids: ids, // Pass the provided comma-separated list of ids
          vs_currencies: currency,
        },
        timeout: 5000, // Prevents long hangs
      });

      if (!Object.keys(response.data).length) {
        return false;
      }

      // Create the coins object from the response data
      const coins = Object.entries(response.data).reduce(
        (acc: any, [id, priceData]: [string, any]) => {
          acc[id] = {
            price: priceData[currency], // Get the price for the specific currency
            currency: currency,
          };
          return acc;
        },
        {},
      );

      // Get new unsupported market data ids (from the keys of the response)
      const newIds = Object.keys(response.data);

      // Read the existing file content (if it exists)
      let existingIds: string[] = [];
      try {
        const currentFileData = await this.fileManager.readFile(
          this.unsupportedMarketDataIdsFile,
        );
        existingIds = currentFileData
          ? currentFileData
              .split(',')
              .map((id: string) => id.trim().replace(/^'|'$/g, ''))
          : [];
      } catch (error) {
        // If the file does not exist, proceed with an empty list
      }

      // Combine existing and new IDs, ensuring uniqueness
      const allIds = Array.from(new Set([...existingIds, ...newIds]));

      // Format the ids with single quotes and join them with commas
      const formattedIds = allIds.map((id) => `'${id}'`).join(',');

      // Write the unique IDs to the file
      await this.fileManager.writeFile(
        this.unsupportedMarketDataIdsFile,
        formattedIds,
      );
      this.logger.log(
        `✅ Unsupported market data ids successfully written to ${this.unsupportedMarketDataIdsFile}`,
      );

      // Update ratesFile without overwriting (append data)
      await this.fileManager.appendToFile(this.ratesFile, coins);
      this.logger.log(`✅ Rates successfully appended to ${this.ratesFile}`);

      // Cache the results - store in cache
      this.cache = {
        rates: { ...this.cache.rates, ...coins },
        timestamp: Date.now(),
      };

      // Return the object of coins
      return coins;
    } catch (error) {
      this.errorHandlingService.handleError(error); // Use the error handling service
      this.logger.error(`❌ Failed to fetch rates with ids: ${error.message}`);
      throw error; // Optionally rethrow the error to be handled elsewhere
    }
  }

  onModuleInit() {
    this.logger.log('RateService initialized...'); // Use the logger here
  }
}
