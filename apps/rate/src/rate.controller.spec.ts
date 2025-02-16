import { Test, TestingModule } from '@nestjs/testing';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';

import * as dotenv from 'dotenv';
dotenv.config();

const baseCurrency = process.env.BASE_CURRENCY?.toUpperCase() || 'USD';

describe('RateController', () => {
  let controller: RateController;
  let rateService: jest.Mocked<RateService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateController],
      providers: [
        {
          provide: RateService,
          useValue: {
            getRates: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RateController>(RateController);
    rateService = module.get<RateService>(
      RateService,
    ) as jest.Mocked<RateService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRatesMicroservice', () => {
    it('should call rateService.getRates and return the result', async () => {
      const mockRates = {
        bitcoin: { [baseCurrency]: 50000 },
        ethereum: { [baseCurrency]: 4000 },
      };
      rateService.getRates.mockResolvedValue(mockRates);

      const result = await controller.getRatesMicroservice();

      expect(rateService.getRates).toHaveBeenCalled();
      expect(result).toEqual(mockRates);
    });

    it('should handle errors thrown by rateService.getRates', async () => {
      const mockError = new Error('Failed to fetch rates');
      rateService.getRates.mockRejectedValue(mockError);

      await expect(controller.getRatesMicroservice()).rejects.toThrow(
        mockError,
      );
      expect(rateService.getRates).toHaveBeenCalled();
    });
  });
});
