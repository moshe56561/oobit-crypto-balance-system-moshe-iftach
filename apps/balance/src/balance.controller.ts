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
}
