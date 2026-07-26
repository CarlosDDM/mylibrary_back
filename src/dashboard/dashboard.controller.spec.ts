import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: { findAll: jest.Mock };
  const dashboardValue = {
    totalWorks: 10,
    totalPrice: 9.5,
    totalFranchises: 20,
    totalSeries: 15,
  };

  beforeEach(async () => {
    dashboardService = { findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria chamar dashboardService.findAll uma vez, sem argumentos', async () => {
      dashboardService.findAll.mockResolvedValue(dashboardValue);

      await controller.findAll();

      expect(dashboardService.findAll).toHaveBeenCalledTimes(1);
      expect(dashboardService.findAll).toHaveBeenCalledWith();
    });
  });
});
