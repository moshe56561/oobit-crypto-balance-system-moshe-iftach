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

  @MessagePattern({ cmd: MESSAGE_CONSTANTS.RATE_SERVICE.GET_RATE_BY_ID })
  async getRateByIdMicroservice(data: {
    currency: string;
    ids: string;
  }): Promise<any> {
    // Destructure currency and ids from the data
    const { currency, ids } = data;
    // Fetch the rates for the specified coin ids
    return this.rateService.fetchRatesByIds(currency, ids);
  }
}
