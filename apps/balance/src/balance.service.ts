import { Injectable } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { RateService } from '../../rate/src/rate.service';

@Injectable()
export class BalanceService {
  private readonly userBalancesFile = 'user-balances.json';

  constructor(
    private readonly fileManager: FileManagerService,
    private readonly rateService: RateService,
  ) {}

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

    // Update only the user's balances
    const allBalances = this.fileManager.readFile(this.userBalancesFile);
    allBalances[userId] = newBalances;
    this.fileManager.writeFile(this.userBalancesFile, allBalances);
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    const balances = await this.getBalances(userId);
    console.log('🚀 ~ BalanceService ~ getTotalBalance ~ balances:', balances);
    const rates = await this.rateService.getRates();
    console.log('🚀 ~ BalanceService ~ getTotalBalance ~ rates:', rates);
    let total = 0;
    for (const [asset, amount] of Object.entries(balances)) {
      console.log('🚀 ~ BalanceService ~ getTotalBalance ~ amount:', amount);
      console.log('🚀 ~ BalanceService ~ getTotalBalance ~ asset:', asset);
      console.log(
        '🚀 ~ BalanceService ~ getTotalBalance ~ rates[asset]:',
        rates[asset],
      );
      console.log(
        '🚀 ~ BalanceService ~ getTotalBalance ~ rates[asset][currency]:',
        rates[asset][currency],
      );
      if (rates[asset] && rates[asset][currency]) {
        if (typeof amount === 'number')
          total += amount * rates[asset][currency];
      }
    }
    return total;
  }
  async getBalances(userId: string): Promise<any> {
    const balances = this.fileManager.readFile(this.userBalancesFile);
    return balances[userId] || {};
  }

  async addBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<any> {
    let balances = {};

    try {
      // Attempt to read the file
      balances = this.fileManager.readFile(this.userBalancesFile);
    } catch (error) {
      // If the file doesn't exist, initialize balances as an empty object
      if (error.message.includes('does not exist')) {
        balances = {};
      } else {
        throw error; // rethrow any other errors
      }
    }

    // Initialize user's balance if not already present
    if (!balances[userId]) {
      balances[userId] = {};
    }

    // Update the user's balance for the given asset
    balances[userId][asset] = (balances[userId][asset] || 0) + amount;

    // Write the updated balances back to the file
    this.fileManager.writeFile(this.userBalancesFile, balances);

    // Return the updated balance of the user for the given asset
    return {
      userId,
      asset,
      balance: balances[userId][asset],
    };
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
}
