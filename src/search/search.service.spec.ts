import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { WorksService } from 'src/works/works.service';
import { SeriesService } from 'src/series/series.service';

describe('SearchService', () => {
  let service: SearchService;
  let workService: { search: jest.Mock };
  let serieService: { search: jest.Mock };
  const worksData = [
    { name: 'A coisa' },
    { name: 'O coisa' },
    { name: 'I coisa' },
  ];
  const seriesData = [{ name: 'A coisa' }, { name: 'O coisa' }];

  beforeEach(async () => {
    workService = { search: jest.fn() };
    serieService = { search: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: WorksService, useValue: workService },
        { provide: SeriesService, useValue: serieService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar os works e series sem paginação', async () => {
      workService.search.mockResolvedValue([worksData, 3]);
      serieService.search.mockResolvedValue([seriesData, 2]);

      const result = await service.findAll({
        name: 'coisa',
        take: 20,
        skip: 0,
      });

      expect(result).toEqual({
        works: { data: worksData, total: 3 },
        series: { data: seriesData, total: 2 },
      });
      expect(serieService.search).toHaveBeenCalledTimes(1);
      expect(serieService.search).toHaveBeenCalledWith(
        { take: 20, skip: 0 },
        { name: expect.anything() }, // ILike('%coisa%')
      );
      expect(workService.search).toHaveBeenCalledTimes(1);
      expect(workService.search).toHaveBeenCalledWith(
        { take: 20, skip: 0 },
        { name: expect.anything() }, // ILike('%coisa%')
        { covers: true },
      );
    });
  });
});
