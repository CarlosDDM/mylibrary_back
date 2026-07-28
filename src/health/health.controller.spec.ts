import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let health: { check: jest.Mock };
  let database: { pingCheck: jest.Mock };
  let redis: { checkCache: jest.Mock; checkSession: jest.Mock };

  beforeEach(async () => {
    health = { check: jest.fn() };
    database = { pingCheck: jest.fn() };
    redis = { checkCache: jest.fn(), checkSession: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: TypeOrmHealthIndicator, useValue: database },
        { provide: RedisHealthIndicator, useValue: redis },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('live', () => {
    it('responde sem tocar em nenhuma dependência', () => {
      expect(controller.live()).toEqual({ status: 'ok' });

      expect(health.check).not.toHaveBeenCalled();
      expect(database.pingCheck).not.toHaveBeenCalled();
      expect(redis.checkCache).not.toHaveBeenCalled();
    });
  });

  describe('check', () => {
    it('checa postgres e as duas instâncias de redis', async () => {
      const resultado = { status: 'ok' } as HealthCheckResult;
      health.check.mockImplementation(
        async (indicadores: (() => unknown)[]) => {
          await Promise.all(indicadores.map((fn) => fn()));
          return resultado;
        },
      );

      await expect(controller.check()).resolves.toBe(resultado);

      expect(database.pingCheck).toHaveBeenCalledWith('postgres', {
        timeout: 2000,
      });
      expect(redis.checkCache).toHaveBeenCalledWith('redis-cache');
      expect(redis.checkSession).toHaveBeenCalledWith('redis-session');
    });
  });
});
