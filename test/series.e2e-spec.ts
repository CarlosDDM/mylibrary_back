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
  PNG_FALSO,
  TestAgent,
  TestApp,
  UUID_INEXISTENTE,
} from './utils/e2e';

describe('SeriesController (e2e)', () => {
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

  // Só este spec vincula uma série a uma franquia.
  const criarFranquia = async () => {
    const name = nomeUnico('franchises');
    const res = await admin.post('/franchises').send({ name }).expect(201);

    return { id: (res.body as { id: string }).id, name };
  };

  describe('POST /series', () => {
    it('cria uma série com o payload mínimo', async () => {
      const name = nomeUnico('serie');

      const res = await admin
        .post('/series')
        .send({ name, statusId: ids.statusId })
        .expect(201);

      const body = res.body as {
        id: string;
        name: string;
        status: { id: string };
        coverUrl: string | null;
      };

      expect(body.name).toBe(name);
      expect(body.status.id).toBe(ids.statusId);
      expect(body.coverUrl).toBeNull();
    });

    it('cria vinculada a uma franquia', async () => {
      const franquia = await criarFranquia();

      const res = await admin
        .post('/series')
        .send({
          name: nomeUnico('serie'),
          statusId: ids.statusId,
          franchiseId: franquia.id,
        })
        .expect(201);

      expect((res.body as { franchise: { id: string } }).franchise.id).toBe(
        franquia.id,
      );
    });

    it('recusa sem sessão', () =>
      http()
        .post('/series')
        .send({ name: nomeUnico('serie'), statusId: ids.statusId })
        .expect(401));

    it('recusa usuário comum', () =>
      usuario
        .post('/series')
        .send({ name: nomeUnico('serie'), statusId: ids.statusId })
        .expect(403));

    it('recusa sem statusId', () =>
      admin
        .post('/series')
        .send({ name: nomeUnico('serie') })
        .expect(400));

    it('recusa name vazio', () =>
      admin
        .post('/series')
        .send({ name: '', statusId: ids.statusId })
        .expect(400));

    it('recusa campo não declarado no DTO', () =>
      admin
        .post('/series')
        .send({
          name: nomeUnico('serie'),
          statusId: ids.statusId,
          coverUrl: 'https://exemplo.com/hack.png',
        })
        .expect(400));

    it('devolve 404 para statusId inexistente', () =>
      admin
        .post('/series')
        .send({ name: nomeUnico('serie'), statusId: UUID_INEXISTENTE })
        .expect(404));

    it('devolve 404 para franchiseId inexistente', () =>
      admin
        .post('/series')
        .send({
          name: nomeUnico('serie'),
          statusId: ids.statusId,
          franchiseId: UUID_INEXISTENTE,
        })
        .expect(404));

    it('recusa nome duplicado com 409', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await admin
        .post('/series')
        .send({ name: serie.name, statusId: ids.statusId })
        .expect(409);
    });
  });

  describe('GET /series', () => {
    it('recusa sem sessão', () => http().get('/series').expect(401));

    it('devolve lista paginada para usuário comum', async () => {
      await criarSerie(admin, ids.statusId);

      const res = await usuario.get('/series').expect(200);
      const body = res.body as { data: unknown[]; total: number };

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThan(0);
    });

    it('recusa take não-inteiro', () =>
      admin.get('/series').query({ take: 'muitas' }).expect(400));
  });

  describe('GET /series/:id', () => {
    it('devolve a série com as works dela', async () => {
      const serie = await criarSerie(admin, ids.statusId);
      await criarWork(admin, ids, { serieId: serie.id });

      const res = await admin.get(`/series/${serie.id}`).expect(200);
      const body = res.body as { name: string; works: unknown[] };

      expect(body.name).toBe(serie.name);
      expect(body.works).toHaveLength(1);
    });

    it('recusa id que não é UUID v4', () =>
      admin.get('/series/nao-e-uuid').expect(400));

    it('recusa sem sessão', () =>
      http().get(`/series/${UUID_INEXISTENTE}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.get(`/series/${UUID_INEXISTENTE}`).expect(404));
  });

  describe('PATCH /series/:id', () => {
    it('atualiza o nome', async () => {
      const serie = await criarSerie(admin, ids.statusId);
      const novoNome = nomeUnico('renomeada');

      const res = await admin
        .patch(`/series/${serie.id}`)
        .send({ name: novoNome })
        .expect(200);

      expect((res.body as { name: string }).name).toBe(novoNome);
    });

    it('recusa usuário comum', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await usuario
        .patch(`/series/${serie.id}`)
        .send({ name: nomeUnico('x') })
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .patch(`/series/${UUID_INEXISTENTE}`)
        .send({ name: 'x' })
        .expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin
        .patch(`/series/${UUID_INEXISTENTE}`)
        .send({ name: nomeUnico('x') })
        .expect(404));

    it('recusa renomear para um nome já usado com 409', async () => {
      const primeira = await criarSerie(admin, ids.statusId);
      const segunda = await criarSerie(admin, ids.statusId);

      await admin
        .patch(`/series/${segunda.id}`)
        .send({ name: primeira.name })
        .expect(409);
    });
  });

  describe('DELETE /series/:id', () => {
    it('remove a série', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await admin.delete(`/series/${serie.id}`).expect(200);
      await admin.get(`/series/${serie.id}`).expect(404);
    });

    it('recusa usuário comum', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await usuario.delete(`/series/${serie.id}`).expect(403);
    });

    it('recusa sem sessão', () =>
      http().delete(`/series/${UUID_INEXISTENTE}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.delete(`/series/${UUID_INEXISTENTE}`).expect(404));

    it('recusa id que não é UUID v4', () =>
      admin.delete('/series/123').expect(400));
  });

  describe('PUT /series/:id/cover', () => {
    const anexarCapa = (id: string) =>
      admin
        .put(`/series/${id}/cover`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(200);

    it('grava a capa e devolve a coverUrl', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      const res = await anexarCapa(serie.id);

      expect((res.body as { coverUrl: string }).coverUrl).toContain('/series/');
    });

    // setCover troca a url e apaga o objeto anterior (series.service.ts:113).
    it('substitui a capa anterior', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      const primeira = (
        (await anexarCapa(serie.id)).body as { coverUrl: string }
      ).coverUrl;
      const segunda = (
        (await anexarCapa(serie.id)).body as { coverUrl: string }
      ).coverUrl;

      expect(segunda).not.toBe(primeira);
    });

    it('recusa arquivo acima de 5MB', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await admin
        .put(`/series/${serie.id}/cover`)
        .attach('file', Buffer.alloc(6 * 1024 * 1024, 1), {
          filename: 'gigante.png',
          contentType: 'image/png',
        })
        .expect(413);
    });

    it('recusa requisição sem arquivo', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      const res = await admin.put(`/series/${serie.id}/cover`).expect(400);
      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'Nenhum arquivo enviado',
      );
    });

    it('recusa arquivo que não é imagem', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await admin
        .put(`/series/${serie.id}/cover`)
        .attach('file', Buffer.from('nao sou imagem'), {
          filename: 'texto.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('recusa usuário comum', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await usuario
        .put(`/series/${serie.id}/cover`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .put(`/series/${UUID_INEXISTENTE}/cover`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(401));

    // findOne roda antes do upload (series.service.ts:104).
    it('devolve 404 para série inexistente', () =>
      admin
        .put(`/series/${UUID_INEXISTENTE}/cover`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(404));
  });

  describe('DELETE /series/:id/cover', () => {
    it('remove a capa existente e zera a coverUrl', async () => {
      const serie = await criarSerie(admin, ids.statusId);
      await admin
        .put(`/series/${serie.id}/cover`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(200);

      const res = await admin.delete(`/series/${serie.id}/cover`).expect(200);

      expect((res.body as { coverUrl: string | null }).coverUrl).toBeNull();
    });

    // Sem capa é no-op: devolve 200, não 404.
    it('devolve 200 mesmo quando a série não tem capa', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      const res = await admin.delete(`/series/${serie.id}/cover`).expect(200);
      expect((res.body as { coverUrl: string | null }).coverUrl).toBeNull();
    });

    it('recusa usuário comum', async () => {
      const serie = await criarSerie(admin, ids.statusId);

      await usuario.delete(`/series/${serie.id}/cover`).expect(403);
    });

    it('recusa sem sessão', () =>
      http().delete(`/series/${UUID_INEXISTENTE}/cover`).expect(401));

    it('devolve 404 para série inexistente', () =>
      admin.delete(`/series/${UUID_INEXISTENTE}/cover`).expect(404));
  });
});
