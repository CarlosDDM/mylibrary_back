import { Test, TestingModule } from '@nestjs/testing';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

describe('OptionsController', () => {
  let controller: OptionsController;
  let optionsService: { findAll: jest.Mock };

  beforeEach(async () => {
    optionsService = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptionsController],
      providers: [{ provide: OptionsService, useValue: optionsService }],
    }).compile();

    controller = module.get<OptionsController>(OptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deve chamar o service uma vez, sem argumentos', async () => {
      optionsService.findAll.mockResolvedValue({});

      await controller.findAll();

      expect(optionsService.findAll).toHaveBeenCalledTimes(1);
      expect(optionsService.findAll).toHaveBeenCalledWith();
    });
  });
});
