import {
  Controller,
  Get,
  Post,
  Delete,
  Header,
  Param,
  Body,
} from '@nestjs/common';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @Header('X-User-ID', ':userId')
  async getBalances(@Param('userId') userId: string): Promise<any> {
    return this.balanceService.getBalances(userId);
  }

  @Post('add')
  @Header('X-User-ID', ':userId')
  async addBalance(
    @Param('userId') userId: string,
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    return this.balanceService.addBalance(userId, asset, amount);
  }

  @Delete('remove')
  @Header('X-User-ID', ':userId')
  async removeBalance(
    @Param('userId') userId: string,
    @Body('asset') asset: string,
    @Body('amount') amount: number,
  ): Promise<void> {
    return this.balanceService.removeBalance(userId, asset, amount);
  }

  @Get('total/:currency')
  @Header('X-User-ID', ':userId')
  async getTotalBalance(
    @Param('userId') userId: string,
    @Param('currency') currency: string,
  ): Promise<number> {
    return this.balanceService.getTotalBalance(userId, currency);
  }

  @Post('rebalance')
  @Header('X-User-ID', ':userId')
  async rebalance(
    @Param('userId') userId: string,
    @Body() targetPercentages: Record<string, number>,
  ): Promise<void> {
    return this.balanceService.rebalance(userId, targetPercentages);
  }
}
