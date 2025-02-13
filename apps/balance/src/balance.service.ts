import { Injectable } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { RateService } from '../../rate/src/rate.service'; // Import the RateModule

@Injectable()
export class BalanceService {
  private readonly userBalancesFile = 'user-balances.json';

  constructor(
    private readonly fileManager: FileManagerService,
    private readonly rateService: RateService,
  ) {}
  async getBalances(userId: string): Promise<any> {
    const balances = this.fileManager.readFile(this.userBalancesFile);
    return balances[userId] || {};
  }

  async addBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    const balances = this.fileManager.readFile(this.userBalancesFile);
    if (!balances[userId]) {
      balances[userId] = {};
    }
    balances[userId][asset] = (balances[userId][asset] || 0) + amount;
    this.fileManager.writeFile(this.userBalancesFile, balances);
  }

  async removeBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    const balances = this.fileManager.readFile(this.userBalancesFile);
    if (!balances[userId] || !balances[userId][asset]) {
      throw new Error('Asset not found');
    }
    balances[userId][asset] -= amount;
    if (balances[userId][asset] <= 0) {
      delete balances[userId][asset];
    }
    this.fileManager.writeFile(this.userBalancesFile, balances);
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    const balances = await this.getBalances(userId);
    const rates = await this.rateService.getRates();
    let total = 0;
    for (const [asset, amount] of Object.entries(balances)) {
      if (rates[asset] && rates[asset][currency]) {
        if (typeof amount === 'number')
          total += amount * rates[asset][currency];
      }
    }
    return total;
  }

  async rebalance(
    userId: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    const balances = await this.getBalances(userId);
    const rates = await this.rateService.getRates();
    const totalValue = await this.getTotalBalance(userId, 'usd');

    const newBalances = {};
    for (const [asset, percentage] of Object.entries(targetPercentages)) {
      const targetValue = (percentage / 100) * totalValue;
      const rate = rates[asset]?.usd;
      if (rate) {
        newBalances[asset] = targetValue / rate;
      }
    }

    this.fileManager.writeFile(this.userBalancesFile, {
      ...balances,
      [userId]: newBalances,
    });
  }
}
