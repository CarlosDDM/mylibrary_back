import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { REDIS_CACHE_CLIENT } from 'src/redis/redis.provider';

describe('CacheService', () => {
  let service: CacheService;
  let redis: { scan: jest.Mock; del: jest.Mock };
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    wrap: jest.Mock;
  };

  beforeEach(async () => {
    cacheManager = {
      del: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      wrap: jest.fn(),
    };

    redis = { scan: jest.fn(), del: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
        {
          provide: REDIS_CACHE_CLIENT,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('deveria entregar o valor guardado no cache', async () => {
      const work = { id: 'work-1', title: 'Berserk' };
      cacheManager.get.mockResolvedValue(work);

      const result = await service.get<typeof work>('work:work-1');

      expect(result).toEqual(work);
      expect(cacheManager.get).toHaveBeenCalledWith('work:work-1');
    });

    it('deveria entregar null quando a key nao esta no cache', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('work:work-1');

      expect(result).toBeNull();
    });

    it('deveria entregar null quando o cache falha', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      cacheManager.get.mockRejectedValue(new Error('redis fora do ar'));

      const result = await service.get('work:work-1');

      expect(result).toBeNull();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('deveria repassar key, value e ttl para o cache', async () => {
      const key = 'work:work-1';
      const work = { id: 'work-1', title: 'Berserk' };

      await service.set(key, work, 5000);

      expect(cacheManager.set).toHaveBeenCalledWith(key, work, 5000);
    });

    it('deveria passar ttl undefined quando nao informado', async () => {
      const key = 'work:work-1';
      const work = { id: 'work-1', title: 'Berserk' };

      await service.set(key, work);

      expect(cacheManager.set).toHaveBeenCalledWith(key, work, undefined);
    });

    it('nao deveria propagar erro quando o cache falha', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      cacheManager.set.mockRejectedValue(new Error('redis fora do ar'));

      await expect(service.set('work:work-1', {})).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('deveria remover a key do cache', async () => {
      await service.del('work:work-1');

      expect(cacheManager.del).toHaveBeenCalledWith('work:work-1');
    });

    it('nao deveria propagar erro quando o cache falha', async () => {
      const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      cacheManager.del.mockRejectedValue(new Error('redis fora do ar'));

      await expect(service.del('work:work-1')).resolves.toBeUndefined();
      expect(error).toHaveBeenCalled();
    });
  });

  describe('wrap', () => {
    it('deveria repassar key, fn e ttl e devolver o resultado', async () => {
      const work = { id: 'work-1', title: 'Berserk' };
      const fn = jest.fn().mockResolvedValue(work);
      cacheManager.wrap.mockResolvedValue(work);

      const result = await service.wrap('work:work-1', fn, 5000);

      expect(result).toEqual(work);
      expect(cacheManager.wrap).toHaveBeenCalledWith('work:work-1', fn, 5000);
    });

    it('deveria propagar erro quando o cache falha', async () => {
      const fn = jest.fn();
      cacheManager.wrap.mockRejectedValue(new Error('redis fora do ar'));

      await expect(service.wrap('work:work-1', fn)).rejects.toThrow(
        'redis fora do ar',
      );
    });
  });

  describe('invalidateByPrefix', () => {
    it('deveria escanear e deletar as keys em um unico ciclo', async () => {
      redis.scan.mockResolvedValue({ cursor: '0', keys: ['work:1', 'work:2'] });

      await service.invalidateByPrefix('work:');

      expect(redis.scan).toHaveBeenCalledTimes(1);
      expect(redis.scan).toHaveBeenCalledWith('0', {
        MATCH: 'work:*',
        COUNT: 100,
      });
      expect(redis.del).toHaveBeenCalledWith(['work:1', 'work:2']);
    });

    it('deveria continuar escaneando enquanto o cursor nao for 0', async () => {
      redis.scan
        .mockResolvedValueOnce({ cursor: '12', keys: ['work:1'] })
        .mockResolvedValueOnce({ cursor: '0', keys: ['work:2'] });

      await service.invalidateByPrefix('work:');

      expect(redis.scan).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledTimes(2);
    });

    it('nao deveria chamar del quando nao ha keys', async () => {
      redis.scan.mockResolvedValue({ cursor: '0', keys: [] });

      await service.invalidateByPrefix('work:');

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('nao deveria propagar erro quando o scan falha', async () => {
      const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      redis.scan.mockRejectedValue(new Error('redis fora do ar'));

      await expect(
        service.invalidateByPrefix('work:'),
      ).resolves.toBeUndefined();
      expect(error).toHaveBeenCalled();
    });
  });
});
