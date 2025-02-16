import {
  Controller,
  Get,
  Post,
  Delete,
  Headers,
  Param,
  Body,
} from '@nestjs/common';
import { BalanceService } from './balance.service';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service'; // Import the error handling service

@Controller('balance')
export class BalanceController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly errorHandlingService: ErrorHandlingService, // Inject error handling service
  ) {}

  @Post('rebalance')
  async rebalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body() targetPercentages: Record<string, number>,
  ): Promise<void> {
    try {
      return await this.balanceService.rebalance(userId, targetPercentages);
    } catch (error) {
      this.errorHandlingService.handleError(error, true, 'Failed to rebalance'); // Provide custom message
    }
  }

  @Get('total/:currency')
  async getTotalBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Param('currency') currency: string,
  ): Promise<number> {
    try {
      return await this.balanceService.getTotalBalance(userId, currency);
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to get total balance',
      ); // Provide custom message
      return 0; // Return a default value or handle it accordingly
    }
  }

  @Get()
  async getBalances(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
  ): Promise<any> {
    try {
      return await this.balanceService.getBalances(userId);
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to get balances',
      ); // Provide custom message
    }
  }

  @Post('add')
  async addBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<any> {
    try {
      return await this.balanceService.addBalance(userId, asset, amount);
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to add balance',
      ); // Provide custom message
    }
  }

  @Delete('remove')
  async removeBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    try {
      return await this.balanceService.removeBalance(userId, asset, amount);
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to remove balance',
      ); // Provide custom message
    }
  }

  @Get('total-all/:currency')
  async getTotalBalanceOfAllUsers(
    @Param('currency') currency: string,
  ): Promise<number> {
    try {
      return await this.balanceService.getTotalBalanceOfAllUsers(currency);
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to get total balance of all users',
      );
      return 0; // Return a default value or handle it accordingly
    }
  }

  @Get('all')
  async getAllBalances(): Promise<Record<string, Record<string, number>>> {
    try {
      return await this.balanceService.getAllBalances();
    } catch (error) {
      this.errorHandlingService.handleError(
        error,
        true,
        'Failed to get all balances',
      ); // Provide custom message
      return {}; // Return an empty object in case of error
    }
  }
}
