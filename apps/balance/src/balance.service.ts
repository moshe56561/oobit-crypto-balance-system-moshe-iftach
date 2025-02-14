import { Injectable, Inject } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MICRO_SERVICES } from '@app/shared/constants/microservices';
import { MESSAGE_CONSTANTS } from '@app/shared/constants/messages'; // Import the message constants
import { FILE_CONSTANTS } from '@app/shared/constants/files'; // Import file constants
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service

@Injectable()
export class BalanceService {
  private readonly userBalancesFile =
    FILE_CONSTANTS.BALANCE_SERVICE.USER_BALANCES_FILE;

  constructor(
    private readonly fileManager: FileManagerService,
    @Inject(MICRO_SERVICES.RATE.name) private readonly rateClient: ClientProxy,
    private readonly errorHandlingService: ErrorHandlingService, // Inject error handling service
  ) {}

  async rebalance(
    userId: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    try {
      const balances = await this.getBalances(userId);
      const rates = await this.getRatesWithFallback();

      if (!rates || Object.keys(rates).length === 0) {
        return; // Skip rebalance if rates are unavailable
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
    } catch (error) {
      this.errorHandlingService.handleError(error, true); // Pass `true` to re-throw error if needed
    }
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    try {
      const balances = await this.getBalances(userId);
      const rates = await this.getRatesWithFallback();

      if (!rates || Object.keys(rates).length === 0) {
        return 0; // Return 0 if rates are unavailable
      }

      return Object.entries(balances).reduce((total, [asset, amount]) => {
        return total + (rates[asset]?.[currency] ?? 0) * amount;
      }, 0);
    } catch (error) {
      this.errorHandlingService.handleError(error, true); // Pass `true` to re-throw error if needed
      return 0; // Return a default value in case of error
    }
  }

  async getRatesWithFallback(): Promise<any> {
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const rates = await firstValueFrom(
          this.rateClient.send(
            { cmd: MESSAGE_CONSTANTS.RATE_SERVICE.GET_RATES },
            {},
          ),
        );
        return rates; // Return the rates if successfully fetched
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0)
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    this.errorHandlingService.handleError(lastError, true); // Pass `true` to re-throw error if needed
    return {}; // Return an empty object if all retries fail
  }

  async getBalances(userId: string): Promise<Record<string, number>> {
    try {
      const balances = this.fileManager.readFile(this.userBalancesFile);
      return balances[userId] || {};
    } catch (error) {
      this.errorHandlingService.handleError(error, true); // Pass `true` to re-throw error if needed
      return {}; // Return an empty object in case of error
    }
  }

  async addBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<any> {
    try {
      let balances = this.fileManager.readFile(this.userBalancesFile);
      if (!balances[userId]) {
        balances[userId] = {};
      }
      balances[userId][asset] = (balances[userId][asset] || 0) + amount;
      this.fileManager.writeFile(this.userBalancesFile, balances);

      return { userId, asset, balance: balances[userId][asset] };
    } catch (error) {
      this.errorHandlingService.handleError(error, true); // Pass `true` to re-throw error if needed
    }
  }

  async removeBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    try {
      const balances = this.fileManager.readFile(this.userBalancesFile);
      if (!balances[userId] || !balances[userId][asset]) {
        this.errorHandlingService.handleError(
          new Error('Asset not found'),
          true,
          'Asset not found',
        );
      }

      balances[userId][asset] -= amount;
      if (balances[userId][asset] <= 0) {
        delete balances[userId][asset];
      }
      this.fileManager.writeFile(this.userBalancesFile, balances);
    } catch (error) {
      this.errorHandlingService.handleError(error, true); // Pass `true` to re-throw error if needed
    }
  }
}
