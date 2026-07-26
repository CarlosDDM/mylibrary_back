import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: { findAll: jest.Mock };
  const value = {
    works: {
      data: [{ name: 'A coisa' }, { name: 'O coisa' }, { name: 'I coisa' }],
      total: 3,
    },
    series: { data: [{ name: 'A coisa' }, { name: 'O coisa' }], total: 2 },
  };

  beforeEach(async () => {
    searchService = { findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: searchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('chamar o findAll repassando name, take e skip', async () => {
      searchService.findAll.mockResolvedValue(value);
      await expect(
        controller.findAll({ name: 'coisa', take: 20, skip: 0 }),
      ).resolves.toEqual(value);

      expect(searchService.findAll).toHaveBeenCalledWith({
        name: 'coisa',
        take: 20,
        skip: 0,
      });
      expect(searchService.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
