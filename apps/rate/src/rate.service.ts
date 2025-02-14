import { Injectable, OnModuleInit } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { MessagePattern } from '@nestjs/microservices';
import axios from 'axios';

@Injectable()
export class RateService implements OnModuleInit {
  private readonly ratesFile = 'rates.json';
  private readonly coinGeckoUrl =
    'https://api.coingecko.com/api/v3/simple/price';
  private cache: { rates: any; timestamp: number } = {
    rates: null,
    timestamp: 0,
  };
  private readonly cacheTTL = 60000; // 1 minute

  constructor(private readonly fileManager: FileManagerService) {}

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
      console.log(`✅ Rates successfully written to ${this.ratesFile}`);
    } catch (error) {
      console.error('❌ Error fetching rates:', error);
    }
  }

  async getRates(): Promise<any> {
    if (Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.rates;
    }
    await this.fetchRates();
    return this.cache.rates;
  }

  @MessagePattern({ cmd: 'getRates' }) // Handle the getRates command from microservices
  async getRatesMicroservice(): Promise<any> {
    return this.getRates();
  }

  onModuleInit() {
    console.log('🚀 RateService initialized');
  }
}
