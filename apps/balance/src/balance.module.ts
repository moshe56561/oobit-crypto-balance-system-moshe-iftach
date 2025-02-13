import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { RateModule } from '../../rate/src/rate.module'; // Import the RateModule

@Module({
  imports: [RateModule],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
