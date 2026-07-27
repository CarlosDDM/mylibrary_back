import request from 'supertest';
import { createTestApp, seedAdmin, TestApp } from './utils/e2e';

/**
 * Único spec que roda com o ThrottlerStorage real — todos os outros o
 * substituem por um stub, senão tomariam 429 aleatório.
 *
 * O @nestjs/throttler gera a chave a partir de classe + handler + IP, então
 * cada rota tem o próprio contador e os testes daqui não interferem entre si.
 */
describe('Throttler (e2e)', () => {
  let app: TestApp;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp({ comThrottler: true });
  });

  afterAll(async () => {
    await app.close();
  });

  // @Throttle({ short: { ttl: 60000, limit: 5 } }) em auth.controller.ts:21 —
  // é a proteção contra força bruta no login.
  describe('POST /auth/login', () => {
    it('bloqueia com 429 a partir da 6ª tentativa em 60s', async () => {
      const { username } = seedAdmin(app);
      const tentativa = () =>
        http().post('/auth/login').send({ username, password: 'senha-errada' });

      // As 5 primeiras chegam no passport e são recusadas por credencial.
      for (let i = 0; i < 5; i += 1) {
        await tentativa().expect(401);
      }

      // A 6ª nem chega lá: o ThrottlerGuard é global e roda antes.
      const bloqueada = await tentativa().expect(429);

      const corpo = bloqueada.body as {
        message: string[];
        statusCode: number;
      };
      expect(corpo.statusCode).toBe(429);
      expect(corpo.message.join(' ').toLowerCase()).toContain('too many');
    });

    it('conta tentativa válida no mesmo limite', async () => {
      // O contador do login já está estourado pelo teste anterior, e o TTL é
      // de 60s. Credencial correta também é barrada — o guard vem antes.
      await http().post('/auth/login').send(seedAdmin(app)).expect(429);
    });
  });

  // Limite global 'short' do ThrottlerModule: 20 requisições por segundo.
  describe('limite global de 20 req/s', () => {
    it('devolve 429 depois de estourar a janela curta', async () => {
      const status: number[] = [];

      for (let i = 0; i < 30; i += 1) {
        const res = await http().get('/auth/me');
        status.push(res.status);
        if (res.status === 429) break;
      }

      // Antes do limite a rota responde 401 (sem sessão), não 429.
      expect(status[0]).toBe(401);
      expect(status).toContain(429);
      // O 429 só pode aparecer depois das 20 permitidas.
      expect(status.indexOf(429)).toBeGreaterThanOrEqual(20);
    });
  });
});
