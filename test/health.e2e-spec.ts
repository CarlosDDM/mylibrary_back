import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { RedisHealthIndicator } from 'src/health/indicators/redis.indicator';
import { createTestApp, TestApp } from './utils/e2e';

interface CorpoHealth {
  status: string;
  info: Record<string, { status: string }>;
  error: Record<string, { status: string; message?: string }>;
  details: Record<string, { status: string }>;
}

describe('Health (e2e)', () => {
  let app: TestApp;

  const http = () => request(app.getHttpServer());

  afterAll(async () => {
    await app.close();
  });

  describe('com as dependências no ar', () => {
    // Throttler real: o teste do @SkipThrottle depende dele.
    beforeAll(async () => {
      app = await createTestApp({ comThrottler: true });
    });

    describe('GET /health/live', () => {
      it('responde sem exigir sessão', async () => {
        const res = await http().get('/health/live').expect(200);

        expect(res.body).toEqual({ status: 'ok' });
      });

      // @SkipThrottle no HealthController. Sem ele, o limite global de 20 req/s
      // faria o probe tomar 429 — que o orquestrador leria como serviço fora.
      it('não é barrado pelo throttler', async () => {
        for (let i = 0; i < 30; i += 1) {
          await http().get('/health/live').expect(200);
        }
      });

      it('o limite global continua valendo para as outras rotas', async () => {
        const status: number[] = [];

        for (let i = 0; i < 30; i += 1) {
          const res = await http().get('/auth/me');
          status.push(res.status);
          if (res.status === 429) break;
        }

        expect(status).toContain(429);
      });
    });

    describe('GET /health/ready', () => {
      it('responde sem exigir sessão e reporta cada dependência', async () => {
        const res = await http().get('/health/ready').expect(200);
        const body = res.body as CorpoHealth;

        expect(body.status).toBe('ok');
        expect(Object.keys(body.details).sort()).toEqual([
          'postgres',
          'redis-cache',
          'redis-session',
        ]);
        expect(body.info.postgres.status).toBe('up');
        expect(body.info['redis-cache'].status).toBe('up');
        expect(body.info['redis-session'].status).toBe('up');
        expect(body.error).toEqual({});
      });
    });
  });

  /**
   * Derrubar o Redis de verdade quebraria os outros specs, então o indicador é
   * substituído por um que reporta down. O que está sob teste aqui não é o
   * Redis: é o HealthCheckFilter preservando o corpo detalhado do Terminus, que
   * o AllExceptionsFilter global achataria para "Internal Server Error".
   */
  describe('com uma dependência fora', () => {
    beforeAll(async () => {
      await app.close();

      const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(RedisHealthIndicator)
        .useValue({
          checkCache: () =>
            Promise.resolve({
              'redis-cache': { status: 'down', message: 'simulado' },
            }),
          checkSession: () =>
            Promise.resolve({ 'redis-session': { status: 'up' } }),
        })
        .compile();

      app = moduleRef.createNestApplication<TestApp>();
      await app.init();
    });

    it('devolve 503 sem achatar o corpo do Terminus', async () => {
      const res = await http().get('/health/ready').expect(503);
      const body = res.body as CorpoHealth;

      // O formato do AllExceptionsFilter global — que NÃO deve aparecer aqui.
      expect(body).not.toHaveProperty('statusCode');
      expect(body).not.toHaveProperty('message');

      expect(body.status).toBe('error');
    });

    it('lista em error apenas o indicador que caiu', async () => {
      const res = await http().get('/health/ready').expect(503);
      const body = res.body as CorpoHealth;

      expect(Object.keys(body.error)).toEqual(['redis-cache']);
      expect(body.error['redis-cache'].message).toBe('simulado');

      // Os saudáveis continuam reportados em info.
      expect(Object.keys(body.info).sort()).toEqual([
        'postgres',
        'redis-session',
      ]);
    });

    it('o /health/live continua respondendo 200', () =>
      http().get('/health/live').expect(200));
  });
});
