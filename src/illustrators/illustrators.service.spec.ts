import { Test, TestingModule } from '@nestjs/testing';
import { IllustratorsService } from './illustrators.service';

describe('IllustratorsService', () => {
  let service: IllustratorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IllustratorsService],
    }).compile();

    service = module.get<IllustratorsService>(IllustratorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
