import { Controller } from '@nestjs/common';
import { RateService } from './rate.service';

@Controller()
export class RateController {
  constructor(private readonly rateService: RateService) {}
}
