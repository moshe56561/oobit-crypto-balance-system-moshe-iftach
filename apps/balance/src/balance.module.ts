import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { SharedModule } from '@app/shared'; // Import the SharedModule
import { RateModule } from '../../rate/src/rate.module'; // Import the RateModule
import { forwardRef } from '@nestjs/common'; // Import forwardRef

@Module({
  imports: [SharedModule, forwardRef(() => RateModule)], // Use forwardRef here to handle circular dependencies
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
