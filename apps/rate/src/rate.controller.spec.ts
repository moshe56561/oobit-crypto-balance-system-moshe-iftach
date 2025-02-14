import { Test, TestingModule } from '@nestjs/testing';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';

describe('RateController', () => {
  let rateController: RateController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RateController],
      providers: [RateService],
    }).compile();

    rateController = app.get<RateController>(RateController);
  });
});
