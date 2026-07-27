import request from 'supertest';
import {
  criarSerie,
  criarUsuario,
  criarWork,
  createTestApp,
  loginAs,
  loginAsSeedAdmin,
  nomeUnico,
  OptionIds,
  optionIds,
  TestAgent,
  TestApp,
} from './utils/e2e';

describe('Dashboard e Search (e2e)', () => {
  let app: TestApp;
  let admin: TestAgent;
  let usuario: TestAgent;
  let ids: OptionIds;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    admin = await loginAsSeedAdmin(app);
    usuario = await loginAs(app, await criarUsuario(admin));
    ids = await optionIds(admin);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dashboard/statistics', () => {
    it('recusa sem sessão', () =>
      http().get('/dashboard/statistics').expect(401));

    it('devolve as quatro estatísticas para usuário comum', async () => {
      const res = await usuario.get('/dashboard/statistics').expect(200);

      expect(Object.keys(res.body as object).sort()).toEqual([
        'totalFranchises',
        'totalPrice',
        'totalSeries',
        'totalWorks',
      ]);
    });

    // O resultado é cacheado sob DASHBOARD_STATS_KEY. Criar uma work invalida
    // essa chave (works.service.ts:82) — se a invalidação quebrar, o número
    // fica congelado e este teste pega.
    it('reflete uma work nova (invalidação do cache do dashboard)', async () => {
      const antes = await admin.get('/dashboard/statistics').expect(200);
      const totalAntes = (antes.body as { totalWorks: number }).totalWorks;

      await criarWork(admin, ids);

      const depois = await admin.get('/dashboard/statistics').expect(200);
      expect((depois.body as { totalWorks: number }).totalWorks).toBe(
        totalAntes + 1,
      );
    });

    it('reflete uma série nova', async () => {
      const antes = await admin.get('/dashboard/statistics').expect(200);
      const totalAntes = (antes.body as { totalSeries: number }).totalSeries;

      await criarSerie(admin, ids.statusId);

      const depois = await admin.get('/dashboard/statistics').expect(200);
      expect((depois.body as { totalSeries: number }).totalSeries).toBe(
        totalAntes + 1,
      );
    });
  });

  describe('GET /search', () => {
    it('recusa sem sessão', () => http().get('/search').expect(401));

    it('devolve works e series no envelope esperado', async () => {
      const res = await usuario.get('/search').expect(200);
      const body = res.body as {
        works: { data: unknown[]; total: number };
        series: { data: unknown[]; total: number };
      };

      expect(Object.keys(body).sort()).toEqual(['series', 'works']);
      expect(Array.isArray(body.works.data)).toBe(true);
      expect(Array.isArray(body.series.data)).toBe(true);
    });

    it('encontra a work pelo nome', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin
        .get('/search')
        .query({ name: work.name })
        .expect(200);
      const body = res.body as { works: { data: { name: string }[] } };

      expect(body.works.data.map((w) => w.name)).toContain(work.name);
    });

    it('encontra a série pelo nome', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      const res = await admin
        .get('/search')
        .query({ name: serie.name })
        .expect(200);
      const body = res.body as { series: { data: { name: string }[] } };

      expect(body.series.data.map((s) => s.name)).toContain(serie.name);
    });

    it('devolve vazio para nome sem correspondência', async () => {
      const res = await admin
        .get('/search')
        .query({ name: nomeUnico('inexistente') })
        .expect(200);
      const body = res.body as {
        works: { total: number };
        series: { total: number };
      };

      expect(body.works.total).toBe(0);
      expect(body.series.total).toBe(0);
    });

    it('recusa take não-inteiro', () =>
      admin.get('/search').query({ take: 'muitos' }).expect(400));
  });
});
