import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { FileManagerService } from '@app/shared/file-manager/file-manager.service';
import { RateService } from '../../rate/src/rate.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let fileManager: FileManagerService;
  let rateService: RateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: FileManagerService,
          useValue: {
            readFile: jest.fn(),
            writeFile: jest.fn(),
          },
        },
        {
          provide: RateService,
          useValue: {
            getRates: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    fileManager = module.get<FileManagerService>(FileManagerService);
    rateService = module.get<RateService>(RateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests for each method
});
