import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RateService {
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
    const response = await axios.get(this.coinGeckoUrl, {
      params: {
        ids: 'bitcoin,ethereum,oobit',
        vs_currencies: 'usd',
      },
    });
    this.cache = { rates: response.data, timestamp: Date.now() };
    this.fileManager.writeFile(this.ratesFile, response.data);
  }

  async getRates(): Promise<any> {
    if (Date.now() - this.cache.timestamp < this.cacheTTL) {
      return this.cache.rates;
    }
    await this.fetchRates();
    return this.cache.rates;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.fetchRates();
  }
}
