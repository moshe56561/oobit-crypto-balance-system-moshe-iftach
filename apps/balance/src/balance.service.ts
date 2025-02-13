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
}
