import * as dotenv from 'dotenv';
dotenv.config();

import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MICRO_SERVICES } from '@app/shared/constants/microservices';
import { MESSAGE_CONSTANTS } from '@app/shared/constants/messages';
import { FILE_CONSTANTS } from '@app/shared/constants/files';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';
import { CurrencyConversionUtil } from '@app/shared/utils/currency-conversion.util';

const baseCurrency = process.env.BASE_CURRENCY?.toUpperCase() || 'USD';

@Injectable()
export class BalanceService {
  private readonly userBalancesFile =
    FILE_CONSTANTS.BALANCE_SERVICE.USER_BALANCES_FILE;
  private readonly ratesFile = FILE_CONSTANTS.RATE_SERVICE.RATES_FILE;

  constructor(
    @Inject(MICRO_SERVICES.RATE.name) private readonly rateClient: ClientProxy,
    private readonly fileManager: FileManagerService,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly currencyConversionUtil: CurrencyConversionUtil,
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

      let rates = await this.getRatesWithFallback();
      if (!rates || Object.keys(rates).length === 0) {
        return; // Skip rebalance if rates are unavailable
      }

      const totalValue = await this.getTotalBalance(userId, baseCurrency);
      const newBalances: Record<string, number> = {};

      for (const [asset, percentage] of Object.entries(targetPercentages)) {
        const normalizedAssetName = rates[asset.toLowerCase()]?.normalizedName
          ? rates[asset.toLowerCase()].normalizedName
          : asset;

        const targetValue = (percentage / 100) * totalValue;
        let rate = rates[normalizedAssetName]?.price; // Use normalized asset
        if (!rate) {
          const unsupportedRates =
            await this.getRatesWithIdsFallback(normalizedAssetName);
          rates = { ...rates, ...unsupportedRates };
        }
        rate = rates[normalizedAssetName]?.price; // Use normalized asset

        if (rate) {
          newBalances[normalizedAssetName] = targetValue / rate;
        } else {
          throw new HttpException(
            `The following assets are not supported: ${asset}`,
            HttpStatus.BAD_REQUEST,
          );
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
      // Validate currency
      const isValid =
        currency.toUpperCase() !== baseCurrency
          ? await this.currencyConversionUtil.isValidCurrency(currency)
          : true;
      if (!isValid) {
        throw new HttpException('Invalid currency', HttpStatus.BAD_REQUEST);
      }

      const balances = await this.getBalances(userId);
      const rates = this.fileManager.readFile(this.ratesFile);

      if (!rates || Object.keys(rates).length === 0) {
        return 0; // Return 0 if rates are unavailable
      }

      const totalRes = Object.entries(balances).reduce(
        (total, [asset, amount]) => {
          return total + (rates[asset]?.['price'] ?? 0) * amount; // Use normalized asset
        },
        0,
      );

      return this.currencyConversionUtil.convertToCurrency(
        totalRes,
        baseCurrency,
        currency.toUpperCase(),
      );
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
      return 0;
    }
  }

  async getTotalBalanceOfAllUsers(currency: string): Promise<number> {
    try {
      // Validate currency
      const isValid =
        currency.toUpperCase() !== baseCurrency
          ? await this.currencyConversionUtil.isValidCurrency(currency)
          : true;
      if (!isValid) {
        throw new HttpException('Invalid currency', HttpStatus.BAD_REQUEST);
      }

      const allBalances = this.fileManager.readFile(
        this.userBalancesFile,
      ) as Record<string, Record<string, number>>;
      const rates = this.fileManager.readFile(this.ratesFile);

      if (!rates || Object.keys(rates).length === 0) {
        return 0; // Return 0 if rates are unavailable
      }

      let totalBalanceInUsd = 0;

      for (const userBalances of Object.values(allBalances)) {
        for (const [asset, amount] of Object.entries(userBalances)) {
          const rate = rates[asset]?.price ?? 0;
          totalBalanceInUsd += rate * amount;
        }
      }

      // Convert total balance to the desired currency if it's not BASE_CURRENCY
      if (currency.toUpperCase() !== baseCurrency) {
        totalBalanceInUsd = await this.currencyConversionUtil.convertToCurrency(
          totalBalanceInUsd,
          baseCurrency,
          currency.toUpperCase(),
        );
      }

      return totalBalanceInUsd;
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
            { currency: baseCurrency, ids: asset },
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

      return balances[userId];
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
      return {}; // Return an empty object in case of error
    }
  }

  // Return all balances
  async getAllBalances(): Promise<Record<string, Record<string, number>>> {
    try {
      const allBalances = this.fileManager.readFile(this.userBalancesFile);

      return allBalances; // Return all users' balances
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
      const currentAsset = asset.toLowerCase();
      // Read the rates file and check if the asset exists
      let rates = this.fileManager.readFile(this.ratesFile);

      const normalizedAssetName = rates[currentAsset]?.normalizedName
        ? rates[currentAsset].normalizedName
        : currentAsset;

      if (!rates[normalizedAssetName]) {
        // If asset is not in ratesFile, check with RateService
        const unsupportedRates =
          await this.getRatesWithIdsFallback(normalizedAssetName);
        rates = { ...rates, ...unsupportedRates };
      }

      balances[userId][normalizedAssetName] =
        (balances[userId][normalizedAssetName] || 0) + amount;

      this.fileManager.writeFile(this.userBalancesFile, balances);

      return {
        userId,
        asset: normalizedAssetName,
        balance: balances[userId][normalizedAssetName],
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
      const currentAsset = asset.toLowerCase();
      const rates = this.fileManager.readFile(this.ratesFile);
      const balances = this.fileManager.readFile(this.userBalancesFile);

      const normalizedAssetName = rates[currentAsset]?.normalizedName
        ? rates[currentAsset].normalizedName
        : currentAsset;

      if (!balances[userId] || !balances[userId][normalizedAssetName]) {
        throw new HttpException(
          `The asset "${asset}" is not is not exist in user balance.`,
          HttpStatus.NOT_FOUND,
        );
      }

      balances[userId][normalizedAssetName] -= amount;
      if (balances[userId][normalizedAssetName] <= 0) {
        delete balances[userId][normalizedAssetName];
      }
      this.fileManager.writeFile(this.userBalancesFile, balances);

      return balances[userId];
    } catch (error) {
      this.errorHandlingService.handleError(error, true);
    }
  }
}
