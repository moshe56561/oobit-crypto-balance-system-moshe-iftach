import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { RateService } from '../rate.service';

@Processor('rateQueue')
export class RateQueueProcessor {
  constructor(private readonly rateService: RateService) {}

  @Process('fetchRates')
  async handleFetchRates(job: Job) {
    await this.rateService.fetchRates();
  }
}
