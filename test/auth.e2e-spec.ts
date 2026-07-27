import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createTestApp, seedAdmin, TestApp } from './utils/e2e';

// Este arquivo testa o próprio login, então não usa loginAsSeedAdmin: as
// chamadas a /auth/login são o objeto do teste, não um pré-requisito dele.
describe('AuthController (e2e)', () => {
  let app: TestApp;
  let admin: { username: string; password: string };
  let cookie: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    admin = seedAdmin(app);
    // Só este spec verifica o nome do cookie, então lê o config direto.
    cookie = app.get(ConfigService).get<string>('COOKIE_NAME')!;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('autentica com credenciais válidas e devolve o cookie de sessão', async () => {
      const res = await http().post('/auth/login').send(admin).expect(200);

      const cookies = res.get('Set-Cookie') ?? [];
      expect(cookies.join(';')).toContain(cookie);
    });

    it('rejeita senha errada', () =>
      http()
        .post('/auth/login')
        .send({ username: admin.username, password: 'senha-errada' })
        .expect(401));

    it('rejeita usuário inexistente', () =>
      http()
        .post('/auth/login')
        .send({ username: 'nao-existe-e2e', password: admin.password })
        .expect(401));

    // 401 e não 400: a rota não declara @Body(), então o ValidationPipe não
    // roda sobre o AuthDto — quem recusa é o passport-local.
    it('rejeita corpo sem a senha', () =>
      http()
        .post('/auth/login')
        .send({ username: admin.username })
        .expect(401));
  });

  describe('GET /auth/me', () => {
    it('rejeita requisição sem sessão', () =>
      http().get('/auth/me').expect(401));

    it('devolve o usuário autenticado', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').send(admin).expect(200);

      await agent.get('/auth/me').expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('encerra a sessão e passa a recusar /auth/me', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.post('/auth/login').send(admin).expect(200);
      await agent.get('/auth/me').expect(200);

      await agent.post('/auth/logout').expect(200);
      await agent.get('/auth/me').expect(401);
    });
  });
});
