import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DataSource, EntityManager } from 'typeorm';
import { CacheService } from 'src/cache/cache.service';
import { Work } from 'src/works/entities/work.entity';
import { Franchise } from 'src/franchises/entities/franchise.entity';
import { Serie } from 'src/series/entities/serie.entity';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';

describe('DashboardService', () => {
  let service: DashboardService;
  let dataSource: { transaction: jest.Mock };
  let cacheService: { wrap: jest.Mock };
  let manager: { count: jest.Mock; createQueryBuilder: jest.Mock };
  let queryBuilder: { select: jest.Mock; getRawOne: jest.Mock };

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ sum: '9.5' }),
    };
    manager = {
      count: jest.fn((entity: unknown) => {
        if (entity === Work) return Promise.resolve(10);
        if (entity === Franchise) return Promise.resolve(20);
        if (entity === Serie) return Promise.resolve(15);
        return Promise.resolve(0);
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: EntityManager) => Promise<unknown>) =>
        cb(manager as unknown as EntityManager),
      ),
    };
    cacheService = {
      wrap: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar os dados do banco', async () => {
      const result = await service.findAll();

      expect(result).toEqual({
        totalWorks: 10,
        totalPrice: 9.5,
        totalFranchises: 20,
        totalSeries: 15,
      });
    });

    it('deveria contar Work, Franchise e Serie dentro da transacao', async () => {
      await service.findAll();

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.count).toHaveBeenCalledWith(Work);
      expect(manager.count).toHaveBeenCalledWith(Franchise);
      expect(manager.count).toHaveBeenCalledWith(Serie);
    });

    it('deveria converter a soma de string para numero', async () => {
      queryBuilder.getRawOne.mockResolvedValue({ sum: '123.45' });

      await expect(service.findAll()).resolves.toMatchObject({
        totalPrice: 123.45,
      });
    });

    it('deveria devolver totalPrice null quando nao ha soma', async () => {
      queryBuilder.getRawOne.mockResolvedValue({ sum: null });

      await expect(service.findAll()).resolves.toMatchObject({
        totalPrice: null,
      });
    });

    it('deveria usar a chave de cache do dashboard', async () => {
      await service.findAll();

      expect(cacheService.wrap).toHaveBeenCalledWith(
        DASHBOARD_STATS_KEY,
        expect.any(Function),
      );
    });

    it('deveria devolver o valor do cache sem tocar no banco', async () => {
      const cached = {
        totalWorks: 1,
        totalPrice: 2,
        totalFranchises: 3,
        totalSeries: 4,
      };
      cacheService.wrap.mockResolvedValueOnce(cached);

      const result = await service.findAll();

      expect(result).toBe(cached);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
