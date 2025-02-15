import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RateService } from './rate.service';
import { MESSAGE_CONSTANTS } from '@app/shared/constants/messages';

@Controller()
export class RateController {
  constructor(private readonly rateService: RateService) {}

  @MessagePattern({ cmd: MESSAGE_CONSTANTS.RATE_SERVICE.GET_RATES })
  async getRatesMicroservice(): Promise<any> {
    return this.rateService.getRates();
  }
}
