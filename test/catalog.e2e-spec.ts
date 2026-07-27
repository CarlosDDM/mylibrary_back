import request from 'supertest';
import {
  criarUsuario,
  createTestApp,
  loginAs,
  loginAsSeedAdmin,
  nomeUnico,
  TestAgent,
  TestApp,
  UUID_INEXISTENTE,
} from './utils/e2e';

/**
 * authors, franchises e illustrators expõem exatamente o mesmo CRUD, com os
 * mesmos guards e as mesmas validações. Um spec por módulo seria o mesmo
 * arquivo três vezes com o nome da rota trocado, então a suíte é table-driven.
 *
 * A única diferença de contrato: ResponseFranchiseDto também expõe `series`.
 */
const RECURSOS = [
  { rota: 'authors', camposResposta: ['id', 'name'] },
  { rota: 'illustrators', camposResposta: ['id', 'name'] },
  { rota: 'franchises', camposResposta: ['id', 'name', 'series'] },
] as const;

describe('Catálogo — authors, franchises, illustrators (e2e)', () => {
  let app: TestApp;
  let admin: TestAgent;
  let usuario: TestAgent;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    admin = await loginAsSeedAdmin(app);
    usuario = await loginAs(app, await criarUsuario(admin));
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each(RECURSOS)('/$rota', ({ rota, camposResposta }) => {
    const criar = async () => {
      const name = nomeUnico(rota);
      const res = await admin.post(`/${rota}`).send({ name }).expect(201);

      return { id: (res.body as { id: string }).id, name };
    };

    describe(`POST /${rota}`, () => {
      it('cria e devolve só os campos do DTO de resposta', async () => {
        const name = nomeUnico(rota);
        const res = await admin.post(`/${rota}`).send({ name }).expect(201);

        expect(Object.keys(res.body as object).sort()).toEqual([
          ...camposResposta,
        ]);
        expect((res.body as { name: string }).name).toBe(name);
      });

      it('recusa sem sessão', () =>
        http()
          .post(`/${rota}`)
          .send({ name: nomeUnico(rota) })
          .expect(401));

      it('recusa usuário comum', () =>
        usuario
          .post(`/${rota}`)
          .send({ name: nomeUnico(rota) })
          .expect(403));

      it('recusa name vazio', () =>
        admin.post(`/${rota}`).send({ name: '' }).expect(400));

      it('recusa sem name', () => admin.post(`/${rota}`).send({}).expect(400));

      it('recusa campo não declarado no DTO', () =>
        admin
          .post(`/${rota}`)
          .send({ name: nomeUnico(rota), id: UUID_INEXISTENTE })
          .expect(400));

      it('recusa nome duplicado com 409', async () => {
        const criado = await criar();

        await admin.post(`/${rota}`).send({ name: criado.name }).expect(409);
      });
    });

    describe(`GET /${rota}`, () => {
      it('recusa sem sessão', () => http().get(`/${rota}`).expect(401));

      it('devolve lista paginada para usuário comum', async () => {
        await criar();

        const res = await usuario.get(`/${rota}`).expect(200);
        const body = res.body as { data: unknown[]; total: number };

        expect(Array.isArray(body.data)).toBe(true);
        expect(body.total).toBeGreaterThan(0);
      });

      it('filtra por name', async () => {
        const criado = await criar();

        const res = await admin
          .get(`/${rota}`)
          .query({ name: criado.name })
          .expect(200);

        expect((res.body as { total: number }).total).toBe(1);
      });

      it('recusa take não-inteiro', () =>
        admin.get(`/${rota}`).query({ take: 'muitos' }).expect(400));
    });

    describe(`GET /${rota}/:id`, () => {
      it('devolve o registro criado', async () => {
        const criado = await criar();

        const res = await admin.get(`/${rota}/${criado.id}`).expect(200);
        expect((res.body as { name: string }).name).toBe(criado.name);
      });

      it('recusa id que não é UUID v4', () =>
        admin.get(`/${rota}/nao-e-uuid`).expect(400));

      it('recusa sem sessão', () =>
        http().get(`/${rota}/${UUID_INEXISTENTE}`).expect(401));

      it('devolve 404 para UUID inexistente', () =>
        admin.get(`/${rota}/${UUID_INEXISTENTE}`).expect(404));
    });

    describe(`PATCH /${rota}/:id`, () => {
      it('atualiza o nome', async () => {
        const criado = await criar();
        const novoNome = nomeUnico(`${rota}-novo`);

        const res = await admin
          .patch(`/${rota}/${criado.id}`)
          .send({ name: novoNome })
          .expect(200);

        expect((res.body as { name: string }).name).toBe(novoNome);
      });

      it('recusa sem sessão', () =>
        http()
          .patch(`/${rota}/${UUID_INEXISTENTE}`)
          .send({ name: 'x' })
          .expect(401));

      it('recusa usuário comum', async () => {
        const criado = await criar();

        await usuario
          .patch(`/${rota}/${criado.id}`)
          .send({ name: nomeUnico(rota) })
          .expect(403);
      });

      it('devolve 404 para UUID inexistente', () =>
        admin
          .patch(`/${rota}/${UUID_INEXISTENTE}`)
          .send({ name: nomeUnico(rota) })
          .expect(404));

      it('recusa renomear para um nome já usado com 409', async () => {
        const primeiro = await criar();
        const segundo = await criar();

        await admin
          .patch(`/${rota}/${segundo.id}`)
          .send({ name: primeiro.name })
          .expect(409);
      });
    });

    describe(`DELETE /${rota}/:id`, () => {
      it('remove o registro', async () => {
        const criado = await criar();

        await admin.delete(`/${rota}/${criado.id}`).expect(200);
        await admin.get(`/${rota}/${criado.id}`).expect(404);
      });

      it('recusa sem sessão', () =>
        http().delete(`/${rota}/${UUID_INEXISTENTE}`).expect(401));

      it('recusa usuário comum', async () => {
        const criado = await criar();

        await usuario.delete(`/${rota}/${criado.id}`).expect(403);
      });

      it('devolve 404 para UUID inexistente', () =>
        admin.delete(`/${rota}/${UUID_INEXISTENTE}`).expect(404));

      it('recusa id que não é UUID v4', () =>
        admin.delete(`/${rota}/123`).expect(400));
    });
  });
});
