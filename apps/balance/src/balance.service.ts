import { Injectable, Inject } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class BalanceService {
  private readonly userBalancesFile = 'user-balances.json';

  constructor(
    private readonly fileManager: FileManagerService,
    @Inject('RATE_SERVICE') private readonly rateClient: ClientProxy, // Ensure ClientProxy is injected correctly
  ) {}

  async rebalance(
    userId: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    const balances = await this.getBalances(userId);
    const rates = await this.getRatesWithFallback();

    if (!rates || Object.keys(rates).length === 0) {
      console.error('Rates unavailable, rebalance skipped.');
      return;
    }

    const totalValue = await this.getTotalBalance(userId, 'usd');
    const newBalances: Record<string, number> = {};

    for (const [asset, percentage] of Object.entries(targetPercentages)) {
      const targetValue = (percentage / 100) * totalValue;
      const rate = rates[asset]?.usd;
      if (rate) {
        newBalances[asset] = targetValue / rate;
      }
    }

    // Update the user's balances in the file
    const allBalances = this.fileManager.readFile(this.userBalancesFile);
    allBalances[userId] = newBalances;
    this.fileManager.writeFile(this.userBalancesFile, allBalances);
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    const balances = await this.getBalances(userId);
    const rates = await this.getRatesWithFallback();

    if (!rates || Object.keys(rates).length === 0) {
      console.error('Rates unavailable, cannot calculate total balance.');
      return 0;
    }

    return Object.entries(balances).reduce((total, [asset, amount]) => {
      return total + (rates[asset]?.[currency] ?? 0) * amount;
    }, 0);
  }

  async getRatesWithFallback(): Promise<any> {
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const rates = await firstValueFrom(
          this.rateClient.send({ cmd: 'getRates' }, {}),
        );
        return rates; // Return the rates if successfully fetched
      } catch (error) {
        lastError = error;
        retries--;
        console.error(`Attempt failed, retries left: ${retries}`, error);
        if (retries > 0)
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    console.error(
      'RateService is unavailable after retries, returning empty rates:',
      lastError,
    );
    return {};
  }

  async getBalances(userId: string): Promise<Record<string, number>> {
    const balances = this.fileManager.readFile(this.userBalancesFile);
    return balances[userId] || {};
  }

  async addBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<any> {
    let balances = this.fileManager.readFile(this.userBalancesFile);
    if (!balances[userId]) {
      balances[userId] = {};
    }
    balances[userId][asset] = (balances[userId][asset] || 0) + amount;
    this.fileManager.writeFile(this.userBalancesFile, balances);

    return { userId, asset, balance: balances[userId][asset] };
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
