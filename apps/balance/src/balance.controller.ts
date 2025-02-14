import {
  Controller,
  Get,
  Post,
  Delete,
  Headers,
  Param,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('rebalance')
  async rebalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body() targetPercentages: Record<string, number>,
  ): Promise<void> {
    try {
      return this.balanceService.rebalance(userId, targetPercentages);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to rebalance: ' + error.message,
      );
    }
  }

  @Get('total/:currency')
  async getTotalBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Param('currency') currency: string,
  ): Promise<number> {
    try {
      return this.balanceService.getTotalBalance(userId, currency);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get total balance: ' + error.message,
      );
    }
  }

  @Get()
  async getBalances(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
  ): Promise<any> {
    try {
      return this.balanceService.getBalances(userId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get balances: ' + error.message,
      );
    }
  }

  @Post('add')
  async addBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<any> {
    try {
      return this.balanceService.addBalance(userId, asset, amount);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to add balance: ' + error.message,
      );
    }
  }

  @Delete('remove')
  async removeBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    try {
      return this.balanceService.removeBalance(userId, asset, amount);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove balance: ' + error.message,
      );
    }
  }
}
