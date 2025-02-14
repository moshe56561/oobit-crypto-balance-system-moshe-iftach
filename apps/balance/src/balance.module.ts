import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { SharedModule } from '@app/shared';
import { MicroservicesClientModule } from '@app/shared/microservices-client/microservices-client.module';
import { Transport } from '@nestjs/microservices';

@Module({
  imports: [
    SharedModule,
    MicroservicesClientModule.register([
      {
        name: 'RATE_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3000 },
      },
    ]),
  ],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
