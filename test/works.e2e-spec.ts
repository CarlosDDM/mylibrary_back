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

describe('WorksController (e2e)', () => {
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

  // Só este spec vincula autores e ilustradores a uma work.
  const criarPorNome = async (rota: 'authors' | 'illustrators') => {
    const name = nomeUnico(rota);
    const res = await admin.post(`/${rota}`).send({ name }).expect(201);

    return { id: (res.body as { id: string }).id, name };
  };
  const criarAutor = () => criarPorNome('authors');
  const criarIlustrador = () => criarPorNome('illustrators');

  describe('POST /works', () => {
    it('cria uma work com o payload mínimo', async () => {
      const res = await admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
        })
        .expect(201);

      const body = res.body as {
        id: string;
        media: { id: string };
        authors: unknown[];
        covers: unknown[];
      };

      expect(body.id).toBeTruthy();
      expect(body.media.id).toBe(ids.mediaId);
      expect(body.authors).toEqual([]);
      expect(body.covers).toEqual([]);
    });

    it('cria com autores e ilustradores vinculados', async () => {
      const autor = await criarAutor();
      const ilustrador = await criarIlustrador();

      const res = await admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          authors: [autor.id],
          illustrators: [ilustrador.id],
        })
        .expect(201);

      const body = res.body as {
        authors: { id: string }[];
        illustrators: { id: string }[];
      };

      expect(body.authors.map((a) => a.id)).toEqual([autor.id]);
      expect(body.illustrators.map((i) => i.id)).toEqual([ilustrador.id]);
    });

    it('recusa sem sessão', () =>
      http()
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
        })
        .expect(401));

    it('recusa usuário comum', () =>
      usuario
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
        })
        .expect(403));

    it('recusa sem mediaId e languageId', () =>
      admin
        .post('/works')
        .send({ name: nomeUnico('obra') })
        .expect(400));

    it('recusa campo não declarado no DTO', () =>
      admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          campoInventado: true,
        })
        .expect(400));

    it('recusa volume negativo', () =>
      admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          volume: -1,
        })
        .expect(400));

    it('devolve 404 para mediaId inexistente', () =>
      admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: UUID_INEXISTENTE,
          languageId: ids.languageId,
        })
        .expect(404));

    it('devolve 404 para serieId inexistente', () =>
      admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          serieId: UUID_INEXISTENTE,
        })
        .expect(404));

    it('devolve 404 para autor inexistente', async () => {
      const res = await admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          authors: [UUID_INEXISTENTE],
        })
        .expect(404);

      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'Authors não foram encontrados',
      );
    });

    it('devolve 404 para ilustrador inexistente', () =>
      admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          illustrators: [UUID_INEXISTENTE],
        })
        .expect(404));

    // validateWorkData só checa volumeName quando há serieId (works.service.ts:111).
    it('recusa volumeName repetido na mesma série com 409', async () => {
      const serie = await criarSerie(admin, ids.statusId);
      const volumeName = nomeUnico('vol');

      await criarWork(admin, ids, { serieId: serie.id, volumeName });

      await admin
        .post('/works')
        .send({
          name: nomeUnico('obra'),
          mediaId: ids.mediaId,
          languageId: ids.languageId,
          serieId: serie.id,
          volumeName,
        })
        .expect(409);
    });
  });

  describe('GET /works', () => {
    it('recusa sem sessão', () => http().get('/works').expect(401));

    it('devolve lista paginada para usuário comum', async () => {
      await criarWork(admin, ids);

      const res = await usuario.get('/works').expect(200);
      const body = res.body as { data: unknown[]; total: number };

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.total).toBeGreaterThan(0);
    });

    it('filtra por mediaId', async () => {
      const res = await admin
        .get('/works')
        .query({ mediaIds: ids.mediaId })
        .expect(200);

      expect((res.body as { total: number }).total).toBeGreaterThan(0);
    });

    it('recusa mediaIds que não é UUID v4', () =>
      admin.get('/works').query({ mediaIds: 'nao-e-uuid' }).expect(400));

    it('recusa take não-inteiro', () =>
      admin.get('/works').query({ take: 'muitos' }).expect(400));

    it('recusa isSpecialEdition fora de true/false', () =>
      admin.get('/works').query({ isSpecialEdition: 'talvez' }).expect(400));

    it('aceita isSpecialEdition true e false', async () => {
      await admin.get('/works').query({ isSpecialEdition: 'true' }).expect(200);
      await admin
        .get('/works')
        .query({ isSpecialEdition: 'false' })
        .expect(200);
    });

    // Query vazia continua valendo como filtro ausente.
    it('trata isSpecialEdition vazio como ausente', async () => {
      const vazio = await admin
        .get('/works')
        .query({ isSpecialEdition: '' })
        .expect(200);
      const semFiltro = await admin.get('/works').expect(200);

      expect((vazio.body as { total: number }).total).toBe(
        (semFiltro.body as { total: number }).total,
      );
    });
  });

  describe('GET /works/:id', () => {
    it('devolve a work criada', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin.get(`/works/${work.id}`).expect(200);
      expect((res.body as { name: string }).name).toBe(work.name);
    });

    it('recusa id que não é UUID v4', () =>
      admin.get('/works/nao-e-uuid').expect(400));

    it('recusa sem sessão', () =>
      http().get(`/works/${UUID_INEXISTENTE}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.get(`/works/${UUID_INEXISTENTE}`).expect(404));
  });

  describe('PATCH /works/:id', () => {
    it('atualiza o nome', async () => {
      const work = await criarWork(admin, ids);
      const novoNome = nomeUnico('renomeada');

      const res = await admin
        .patch(`/works/${work.id}`)
        .send({ name: novoNome })
        .expect(200);

      expect((res.body as { name: string }).name).toBe(novoNome);
    });

    it('substitui os autores vinculados', async () => {
      const autorA = await criarAutor();
      const autorB = await criarAutor();
      const work = await criarWork(admin, ids, { authors: [autorA.id] });

      const res = await admin
        .patch(`/works/${work.id}`)
        .send({ authors: [autorB.id] })
        .expect(200);

      expect((res.body as { authors: { id: string }[] }).authors).toHaveLength(
        1,
      );
    });

    it('recusa usuário comum', async () => {
      const work = await criarWork(admin, ids);

      await usuario
        .patch(`/works/${work.id}`)
        .send({ name: nomeUnico('x') })
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .patch(`/works/${UUID_INEXISTENTE}`)
        .send({ name: 'x' })
        .expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin
        .patch(`/works/${UUID_INEXISTENTE}`)
        .send({ name: nomeUnico('x') })
        .expect(404));

    // validateSeriesVolume (works.service.ts:196) — só existe no update.
    it('recusa volume repetido dentro da mesma série com 409', async () => {
      const serie = await criarSerie(admin, ids.statusId);
      await criarWork(admin, ids, { serieId: serie.id, volume: 1 });
      const segunda = await criarWork(admin, ids, {
        serieId: serie.id,
        volume: 2,
      });

      const res = await admin
        .patch(`/works/${segunda.id}`)
        .send({ volume: 1 })
        .expect(409);

      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'já existe para essa serie',
      );
    });
  });

  describe('DELETE /works/:id', () => {
    it('remove a work', async () => {
      const work = await criarWork(admin, ids);

      await admin.delete(`/works/${work.id}`).expect(200);
      await admin.get(`/works/${work.id}`).expect(404);
    });

    it('recusa usuário comum', async () => {
      const work = await criarWork(admin, ids);

      await usuario.delete(`/works/${work.id}`).expect(403);
    });

    it('recusa sem sessão', () =>
      http().delete(`/works/${UUID_INEXISTENTE}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.delete(`/works/${UUID_INEXISTENTE}`).expect(404));

    it('recusa id que não é UUID v4', () =>
      admin.delete('/works/123').expect(400));
  });

  // O happy path do upload não é testado: não há serviço S3/Garage no
  // docker-compose e S3_API_URL vem vazio. Tudo que roda ANTES da chamada ao
  // S3 (guards, ParseUUIDPipe, ValidateImagePipe e o findOne do service) é
  // coberto aqui.
  describe('POST /works/:id/covers', () => {
    it('anexa a capa e devolve a url do S3', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin
        .post(`/works/${work.id}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(201);

      const covers = (res.body as { covers: { id: string; url: string }[] })
        .covers;

      expect(covers).toHaveLength(1);
      // FileService monta a url pública com S3_WEB_URL + a key gerada.
      expect(covers[0].url).toContain('/works/');
    });

    it('numera a ordem das capas a cada anexo', async () => {
      const work = await criarWork(admin, ids);

      const anexar = () =>
        admin
          .post(`/works/${work.id}/covers`)
          .attach('file', PNG_FALSO, {
            filename: 'capa.png',
            contentType: 'image/png',
          })
          .expect(201);

      await anexar();
      const res = await anexar();

      expect((res.body as { covers: unknown[] }).covers).toHaveLength(2);
    });

    // multer corta pelo limits.fileSize antes de qualquer coisa chegar ao S3.
    it('recusa arquivo acima de 5MB', async () => {
      const work = await criarWork(admin, ids);

      await admin
        .post(`/works/${work.id}/covers`)
        .attach('file', Buffer.alloc(6 * 1024 * 1024, 1), {
          filename: 'gigante.png',
          contentType: 'image/png',
        })
        .expect(413);
    });

    it('recusa requisição sem arquivo', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin.post(`/works/${work.id}/covers`).expect(400);
      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'Nenhum arquivo enviado',
      );
    });

    it('recusa arquivo que não é imagem', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin
        .post(`/works/${work.id}/covers`)
        .attach('file', Buffer.from('nao sou imagem'), {
          filename: 'texto.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'Somente imagens são permitidas',
      );
    });

    it('recusa mimetype de imagem fora da allowlist', async () => {
      const work = await criarWork(admin, ids);

      await admin
        .post(`/works/${work.id}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.gif',
          contentType: 'image/gif',
        })
        .expect(400);
    });

    it('recusa usuário comum', async () => {
      const work = await criarWork(admin, ids);

      await usuario
        .post(`/works/${work.id}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .post(`/works/${UUID_INEXISTENTE}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(401));

    it('recusa id que não é UUID v4', () =>
      admin
        .post('/works/123/covers')
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(400));

    // findOne roda antes do upload (works.service.ts:283), então o 404 sai
    // sem depender do S3.
    it('devolve 404 para work inexistente', () =>
      admin
        .post(`/works/${UUID_INEXISTENTE}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(404));
  });

  describe('DELETE /works/:id/covers/:coverId', () => {
    it('remove a capa anexada', async () => {
      const work = await criarWork(admin, ids);
      const anexada = await admin
        .post(`/works/${work.id}/covers`)
        .attach('file', PNG_FALSO, {
          filename: 'capa.png',
          contentType: 'image/png',
        })
        .expect(201);

      const coverId = (anexada.body as { covers: { id: string }[] }).covers[0]
        .id;

      const res = await admin
        .delete(`/works/${work.id}/covers/${coverId}`)
        .expect(200);

      expect((res.body as { covers: unknown[] }).covers).toEqual([]);
    });

    it('devolve 404 quando a capa não existe', async () => {
      const work = await criarWork(admin, ids);

      const res = await admin
        .delete(`/works/${work.id}/covers/${UUID_INEXISTENTE}`)
        .expect(404);

      expect((res.body as { message: string[] }).message.join(' ')).toContain(
        'Capa não encontrada',
      );
    });

    it('recusa coverId que não é UUID v4', async () => {
      const work = await criarWork(admin, ids);

      await admin.delete(`/works/${work.id}/covers/abc`).expect(400);
    });

    it('recusa usuário comum', async () => {
      const work = await criarWork(admin, ids);

      await usuario
        .delete(`/works/${work.id}/covers/${UUID_INEXISTENTE}`)
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .delete(`/works/${UUID_INEXISTENTE}/covers/${UUID_INEXISTENTE}`)
        .expect(401));
  });
});
