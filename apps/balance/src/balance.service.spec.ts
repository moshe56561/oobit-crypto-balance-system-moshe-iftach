import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { ClientProxy } from '@nestjs/microservices';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';
import { MICRO_SERVICES } from '@app/shared/constants/microservices';

const baseCurrency = process.env.BASE_CURRENCY?.toUpperCase() || 'USD';
describe('BalanceService', () => {
  let balanceService: BalanceService;
  let fileManager: FileManagerService;
  let rateClient: ClientProxy;
  let errorHandlingService: ErrorHandlingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: FileManagerService,
          useValue: { readFile: jest.fn(), writeFile: jest.fn() },
        },
        {
          provide: MICRO_SERVICES.RATE.name,
          useValue: { send: jest.fn() },
        },
        {
          provide: ErrorHandlingService,
          useValue: { handleError: jest.fn() },
        },
      ],
    }).compile();

    balanceService = module.get<BalanceService>(BalanceService);
    fileManager = module.get<FileManagerService>(FileManagerService);
    rateClient = module.get<ClientProxy>(MICRO_SERVICES.RATE.name);
    errorHandlingService =
      module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  it('should be defined', () => {
    expect(balanceService).toBeDefined();
  });

  describe('rebalance', () => {
    it('should rebalance successfully', async () => {
      const userId = 'user1';
      const targetPercentages = { asset1: 50, asset2: 50 };
      const rates = {
        asset1: { [baseCurrency]: 1 },
        asset2: { [baseCurrency]: 1 },
      };
      const totalBalance = 100;

      jest
        .spyOn(fileManager, 'readFile')
        .mockReturnValue({ user1: { asset1: 50, asset2: 50 } });
      jest
        .spyOn(balanceService, 'getTotalBalance')
        .mockResolvedValue(totalBalance);
      jest
        .spyOn(balanceService, 'getRatesWithFallback')
        .mockResolvedValue(rates);
      jest.spyOn(fileManager, 'writeFile').mockImplementation(() => {});

      await balanceService.rebalance(userId, targetPercentages);
      expect(fileManager.writeFile).toHaveBeenCalled();
    });

    it('should handle errors in rebalance', async () => {
      const userId = 'user1';
      const targetPercentages = { asset1: 50, asset2: 50 };

      // Mock dependencies to simulate an error
      jest.spyOn(fileManager, 'readFile').mockImplementation(() => {
        throw new Error('Rebalance error');
      });

      // Spy on handleError to verify it's called
      const handleErrorSpy = jest.spyOn(errorHandlingService, 'handleError');

      // Call the rebalance method and expect it to throw
      await expect(
        balanceService.rebalance(userId, targetPercentages),
      ).rejects.toThrowError('Rebalance error');

      // Verify that handleError was called with the correct arguments
      expect(handleErrorSpy).toHaveBeenCalledWith(
        new Error('Rebalance error'),
        true,
      );
    });
  });

  // Similar tests for other methods like getTotalBalance, addBalance, removeBalance, etc.
});
