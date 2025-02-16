import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MICRO_SERVICES } from '@app/shared/constants/microservices';
import { MESSAGE_CONSTANTS } from '@app/shared/constants/messages';
import { FILE_CONSTANTS } from '@app/shared/constants/files';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';
import { normalizeAsset } from '@app/shared/utils/normalize-asset';

@Injectable()
export class BalanceService {
  private readonly userBalancesFile =
    FILE_CONSTANTS.BALANCE_SERVICE.USER_BALANCES_FILE;
  private readonly ratesFile = FILE_CONSTANTS.RATE_SERVICE.RATES_FILE;

  constructor(
    @Inject(MICRO_SERVICES.RATE.name) private readonly rateClient: ClientProxy,
    private readonly fileManager: FileManagerService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  private checkUserExists(userId: string): void {
    const allBalances = this.fileManager.readFile(this.userBalancesFile);
    if (!allBalances[userId]) {
      throw new HttpException(
        `User with ID ${userId} does not exist.`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async rebalance(
    userId: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    try {
      this.checkUserExists(userId); // Check if user exists

      // Ensure total percentages add up to exactly 100%
      const totalPercentage = Object.values(targetPercentages).reduce(
        (sum, p) => sum + p,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.0001) {
        // Allow small floating-point errors
        throw new HttpException(
          'Rebalance cannot be performed. The total asset allocation must be exactly 100%.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const rates = await this.getRatesWithFallback();
      if (!rates || Object.keys(rates).length === 0) {
        return; // Skip rebalance if rates are unavailable
      }

      const totalValue = await this.getTotalBalance(userId, 'usd');
      const newBalances: Record<string, number> = {};

      for (const [asset, percentage] of Object.entries(targetPercentages)) {
        const normalizedAsset = normalizeAsset(asset); // Normalize the asset
        const targetValue = (percentage / 100) * totalValue;
        const rate = rates[normalizedAsset]?.price; // Use normalized asset

        if (rate) {
          newBalances[normalizedAsset] = targetValue / rate;
        }
      }

      // Update the user's balances in the file
      const allBalances = this.fileManager.readFile(this.userBalancesFile);
      allBalances[userId] = newBalances;
      this.fileManager.writeFile(this.userBalancesFile, allBalances);

      return allBalances[userId];
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
      throw error;
    }
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    try {
      this.checkUserExists(userId); // Check if user exists

      const balances = await this.getBalances(userId);
      const rates = await this.getRatesWithFallback();

      if (!rates || Object.keys(rates).length === 0) {
        return 0; // Return 0 if rates are unavailable
      }

      return Object.entries(balances).reduce((total, [asset, amount]) => {
        const normalizedAsset = normalizeAsset(asset); // Normalize the asset
        return total + (rates[normalizedAsset]?.[currency] ?? 0) * amount; // Use normalized asset
      }, 0);
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
      return 0;
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

  async getRatesWithIdsFallback(asset: string): Promise<any> {
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        const rate = await firstValueFrom(
          this.rateClient.send(
            { cmd: MESSAGE_CONSTANTS.RATE_SERVICE.GET_RATE_BY_ID },
            { asset },
          ),
        );

        if (rate === false) {
          throw new HttpException(
            `The asset "${asset}" is not supported by the system or does not exist.`,
            HttpStatus.NOT_FOUND,
          );
        }

        return rate; // Return the rate if successfully fetched
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0)
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    this.errorHandlingService.handleError(lastError, true); // Pass true to re-throw error if needed
    throw new HttpException(
      `Failed to fetch rate for asset "${asset}". Please try again later.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async getBalances(userId: string): Promise<Record<string, number>> {
    try {
      this.checkUserExists(userId); // Check if user exists

      const balances = this.fileManager.readFile(this.userBalancesFile);
      // Normalize asset names in the balances
      const normalizedBalances: Record<string, number> = {};
      for (const asset in balances[userId]) {
        const normalizedAsset = normalizeAsset(asset); // Normalize the asset
        normalizedBalances[normalizedAsset] = balances[userId][asset];
      }
      return normalizedBalances;
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
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

      // Read the rates file and check if the asset exists
      const rates = this.fileManager.readFile(this.ratesFile);

      if (!rates[asset]) {
        // If asset is not in ratesFile, check with RateService
        await this.getRatesWithIdsFallback(asset);
      }

      balances[userId][asset] = (balances[userId][asset] || 0) + amount;

      this.fileManager.writeFile(this.userBalancesFile, balances);

      return {
        userId,
        asset: asset,
        balance: balances[userId][asset],
      };
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
      throw error;
    }
  }

  async removeBalance(
    userId: string,
    asset: string,
    amount: number,
  ): Promise<void> {
    try {
      this.checkUserExists(userId); // Check if user exists

      const normalizedAsset = normalizeAsset(asset); // Normalize the asset
      const balances = this.fileManager.readFile(this.userBalancesFile);
      if (!balances[userId] || !balances[userId][normalizedAsset]) {
        this.errorHandlingService.handleError(
          new Error('Asset not found'),
          true,
          'Asset not found',
        );
      }

      balances[userId][normalizedAsset] -= amount;
      if (balances[userId][normalizedAsset] <= 0) {
        delete balances[userId][normalizedAsset];
      }
      this.fileManager.writeFile(this.userBalancesFile, balances);
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
    }
  }
}
