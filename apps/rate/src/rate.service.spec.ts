import { Test, TestingModule } from '@nestjs/testing';
import { RateService } from './rate.service';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';
import { LoggerService } from '@app/shared/logger/logger.service';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const baseCurrency = process.env.BASE_CURRENCY?.toUpperCase() || 'USD';

jest.mock('axios'); // Mock axios

describe('RateService', () => {
  let service: RateService;
  let fileManagerService: jest.Mocked<FileManagerService>;
  let errorHandlingService: jest.Mocked<ErrorHandlingService>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateService,
        {
          provide: FileManagerService,
          useValue: {
            writeFile: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ErrorHandlingService,
          useValue: {
            handleError: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RateService>(RateService);
    fileManagerService = module.get<FileManagerService>(
      FileManagerService,
    ) as jest.Mocked<FileManagerService>;
    errorHandlingService = module.get<ErrorHandlingService>(
      ErrorHandlingService,
    ) as jest.Mocked<ErrorHandlingService>;
    loggerService = module.get<LoggerService>(
      LoggerService,
    ) as jest.Mocked<LoggerService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchRates', () => {
    it('should fetch rates and update cache', async () => {
      const mockRates = {
        bitcoin: { [baseCurrency]: 50000 },
        ethereum: { [baseCurrency]: 4000 },
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockRates });

      await service.fetchRates();

      expect(axios.get).toHaveBeenCalledWith(service['coinGeckoUrl'], {
        params: { ids: 'bitcoin,ethereum,oobit', vs_currencies: baseCurrency },
        timeout: 5000,
      });
      expect(service['cache'].rates).toEqual(mockRates);
      expect(fileManagerService.writeFile).toHaveBeenCalledWith(
        service['ratesFile'],
        mockRates,
      );
      expect(loggerService.log).toHaveBeenCalledWith(
        `✅ Rates successfully written to ${service['ratesFile']}`,
      );
    });

    it('should log a warning if a coin is not in TICKER_MAP', async () => {
      const mockRates = { unknowncoin: { [baseCurrency]: 100 } };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockRates });

      await service.fetchRates();

      expect(loggerService.log).toHaveBeenCalledWith(
        `⚠️ The coin unknowncoin does not exist in the TICKER_MAP and needs to be added.`,
      );
    });

    it('should handle errors and log them', async () => {
      const mockError = new Error('Failed to fetch rates');
      (axios.get as jest.Mock).mockRejectedValue(mockError);

      await service.fetchRates();

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(mockError);
      expect(loggerService.error).toHaveBeenCalledWith(
        `❌ Failed to fetch rates: ${mockError.message}`,
      );
    });
  });

  describe('getRates', () => {
    it('should return cached rates if cache is valid', async () => {
      const mockRates = { bitcoin: { [baseCurrency]: 50000 } };
      service['cache'] = { rates: mockRates, timestamp: Date.now() };

      const result = await service.getRates();

      expect(result).toEqual(mockRates);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch new rates if cache is expired', async () => {
      const mockRates = { bitcoin: { [baseCurrency]: 50000 } };
      service['cache'] = { rates: null, timestamp: Date.now() - 70000 }; // Expired cache
      (axios.get as jest.Mock).mockResolvedValue({ data: mockRates });

      const result = await service.getRates();

      expect(result).toEqual(mockRates);
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('should log that the service is initialized', () => {
      service.onModuleInit();
      expect(loggerService.log).toHaveBeenCalledWith(
        'RateService initialized...',
      );
    });
  });
});
