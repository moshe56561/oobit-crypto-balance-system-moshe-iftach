import { Test, TestingModule } from '@nestjs/testing';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';

describe('BalanceController', () => {
  let balanceController: BalanceController;
  let balanceService: BalanceService;
  let errorHandlingService: ErrorHandlingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceController],
      providers: [
        {
          provide: BalanceService,
          useValue: {
            rebalance: jest.fn(),
            getTotalBalance: jest.fn(),
            getBalances: jest.fn(),
            addBalance: jest.fn(),
            removeBalance: jest.fn(),
          },
        },
        {
          provide: ErrorHandlingService,
          useValue: { handleError: jest.fn() },
        },
      ],
    }).compile();

    balanceController = module.get<BalanceController>(BalanceController);
    balanceService = module.get<BalanceService>(BalanceService);
    errorHandlingService =
      module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  it('should be defined', () => {
    expect(balanceController).toBeDefined();
  });

  describe('rebalance', () => {
    it('should call balanceService.rebalance on success', async () => {
      const userId = 'user1';
      const targetPercentages = { asset1: 50, asset2: 50 };
      const rebalanceResult = undefined;

      jest
        .spyOn(balanceService, 'rebalance')
        .mockResolvedValue(rebalanceResult);

      await balanceController.rebalance(userId, targetPercentages);
      expect(balanceService.rebalance).toHaveBeenCalledWith(
        userId,
        targetPercentages,
      );
    });

    it('should handle errors and call errorHandlingService', async () => {
      const userId = 'user1';
      const targetPercentages = { asset1: 50, asset2: 50 };
      const error = new Error('Rebalance error');

      jest.spyOn(balanceService, 'rebalance').mockRejectedValue(error);
      jest
        .spyOn(errorHandlingService, 'handleError')
        .mockImplementation(() => {});

      await balanceController.rebalance(userId, targetPercentages);
      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to rebalance',
      );
    });
  });

  // Similar tests for other methods like getTotalBalance, getBalances, etc.
});
