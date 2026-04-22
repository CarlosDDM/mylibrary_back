import { Test, TestingModule } from '@nestjs/testing';
import { FranchisesController } from './franchises.controller';
import { FranchisesService } from './franchises.service';

describe('FranchisesController', () => {
  let controller: FranchisesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FranchisesController],
      providers: [FranchisesService],
    }).compile();

    controller = module.get<FranchisesController>(FranchisesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
