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

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('rebalance')
  async rebalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body() targetPercentages: Record<string, number>,
  ): Promise<void> {
    return this.balanceService.rebalance(userId, targetPercentages);
  }

  @Get('total/:currency')
  async getTotalBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Param('currency') currency: string,
  ): Promise<number> {
    return this.balanceService.getTotalBalance(userId, currency);
  }

  @Get()
  async getBalances(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
  ): Promise<any> {
    return this.balanceService.getBalances(userId);
  }

  @Post('add')
  async addBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<any> {
    return this.balanceService.addBalance(userId, asset, amount);
  }

  @Delete('remove')
  async removeBalance(
    @Headers('X-User-ID') userId: string, // Correctly access 'X-User-ID' header
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    return this.balanceService.removeBalance(userId, asset, amount);
  }
}
