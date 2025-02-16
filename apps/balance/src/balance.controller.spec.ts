import { Test, TestingModule } from '@nestjs/testing';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { ErrorHandlingService } from '@app/shared/error-handling/error-handling.service';

describe('BalanceController', () => {
  let controller: BalanceController;
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
            getTotalBalanceOfAllUsers: jest.fn(),
            getAllBalances: jest.fn(),
          },
        },
        {
          provide: ErrorHandlingService,
          useValue: {
            handleError: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BalanceController>(BalanceController);
    balanceService = module.get<BalanceService>(BalanceService);
    errorHandlingService =
      module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('rebalance', () => {
    it('should call balanceService.rebalance with correct parameters', async () => {
      const userId = 'user123';
      const targetPercentages = { BTC: 50, ETH: 30, USDT: 20 };

      await controller.rebalance(userId, targetPercentages);

      expect(balanceService.rebalance).toHaveBeenCalledWith(
        userId,
        targetPercentages,
      );
    });

    it('should handle error if balanceService.rebalance throws', async () => {
      const userId = 'user123';
      const targetPercentages = { BTC: 50, ETH: 30, USDT: 20 };
      const error = new Error('Rebalance failed');

      jest.spyOn(balanceService, 'rebalance').mockRejectedValue(error);

      await controller.rebalance(userId, targetPercentages);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to rebalance',
      );
    });
  });
  describe('getTotalBalance', () => {
    it('should call balanceService.getTotalBalance with correct parameters', async () => {
      const userId = 'user123';
      const currency = 'USD';

      await controller.getTotalBalance(userId, currency);

      expect(balanceService.getTotalBalance).toHaveBeenCalledWith(
        userId,
        currency,
      );
    });

    it('should handle error if balanceService.getTotalBalance throws', async () => {
      const userId = 'user123';
      const currency = 'USD';
      const error = new Error('Failed to get total balance');

      jest.spyOn(balanceService, 'getTotalBalance').mockRejectedValue(error);

      const result = await controller.getTotalBalance(userId, currency);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to get total balance',
      );
      expect(result).toBe(0);
    });
  });
  describe('getBalances', () => {
    it('should call balanceService.getBalances with correct parameters', async () => {
      const userId = 'user123';

      await controller.getBalances(userId);

      expect(balanceService.getBalances).toHaveBeenCalledWith(userId);
    });

    it('should handle error if balanceService.getBalances throws', async () => {
      const userId = 'user123';
      const error = new Error('Failed to get balances');

      jest.spyOn(balanceService, 'getBalances').mockRejectedValue(error);

      await controller.getBalances(userId);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to get balances',
      );
    });
  });
  describe('addBalance', () => {
    it('should call balanceService.addBalance with correct parameters', async () => {
      const userId = 'user123';
      const asset = 'BTC';
      const amount = 1;

      await controller.addBalance(userId, asset, amount);

      expect(balanceService.addBalance).toHaveBeenCalledWith(
        userId,
        asset,
        amount,
      );
    });

    it('should handle error if balanceService.addBalance throws', async () => {
      const userId = 'user123';
      const asset = 'BTC';
      const amount = 1;
      const error = new Error('Failed to add balance');

      jest.spyOn(balanceService, 'addBalance').mockRejectedValue(error);

      await controller.addBalance(userId, asset, amount);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to add balance',
      );
    });
  });
  describe('removeBalance', () => {
    it('should call balanceService.removeBalance with correct parameters', async () => {
      const userId = 'user123';
      const asset = 'BTC';
      const amount = 1;

      await controller.removeBalance(userId, asset, amount);

      expect(balanceService.removeBalance).toHaveBeenCalledWith(
        userId,
        asset,
        amount,
      );
    });

    it('should handle error if balanceService.removeBalance throws', async () => {
      const userId = 'user123';
      const asset = 'BTC';
      const amount = 1;
      const error = new Error('Failed to remove balance');

      jest.spyOn(balanceService, 'removeBalance').mockRejectedValue(error);

      await controller.removeBalance(userId, asset, amount);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to remove balance',
      );
    });
  });
  describe('getTotalBalanceOfAllUsers', () => {
    it('should call balanceService.getTotalBalanceOfAllUsers with correct parameters', async () => {
      const currency = 'USD';

      await controller.getTotalBalanceOfAllUsers(currency);

      expect(balanceService.getTotalBalanceOfAllUsers).toHaveBeenCalledWith(
        currency,
      );
    });

    it('should handle error if balanceService.getTotalBalanceOfAllUsers throws', async () => {
      const currency = 'USD';
      const error = new Error('Failed to get total balance of all users');

      jest
        .spyOn(balanceService, 'getTotalBalanceOfAllUsers')
        .mockRejectedValue(error);

      const result = await controller.getTotalBalanceOfAllUsers(currency);

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to get total balance of all users',
      );
      expect(result).toBe(0);
    });
  });
  describe('getAllBalances', () => {
    it('should call balanceService.getAllBalances', async () => {
      await controller.getAllBalances();

      expect(balanceService.getAllBalances).toHaveBeenCalled();
    });

    it('should handle error if balanceService.getAllBalances throws', async () => {
      const error = new Error('Failed to get all balances');

      jest.spyOn(balanceService, 'getAllBalances').mockRejectedValue(error);

      const result = await controller.getAllBalances();

      expect(errorHandlingService.handleError).toHaveBeenCalledWith(
        error,
        true,
        'Failed to get all balances',
      );
      expect(result).toEqual({});
    });
  });
  // Add more tests here
});
