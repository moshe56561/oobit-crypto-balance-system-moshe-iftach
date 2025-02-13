import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RateService } from './rate.service';
import { RateController } from './rate.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [RateController],
  providers: [RateService],
})
export class RateModule {}
