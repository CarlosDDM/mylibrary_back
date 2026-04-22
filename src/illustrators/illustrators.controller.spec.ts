import { Test, TestingModule } from '@nestjs/testing';
import { IllustratorsController } from './illustrators.controller';
import { IllustratorsService } from './illustrators.service';

describe('IllustratorsController', () => {
  let controller: IllustratorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IllustratorsController],
      providers: [IllustratorsService],
    }).compile();

    controller = module.get<IllustratorsController>(IllustratorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
