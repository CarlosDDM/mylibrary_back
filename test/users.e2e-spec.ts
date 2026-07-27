import request from 'supertest';
import { DataSource } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import {
  criarUsuario,
  createTestApp,
  loginAs,
  loginAsSeedAdmin,
  nomeUnico,
  seedAdmin,
  TestAgent,
  TestApp,
  UUID_INEXISTENTE,
  UsuarioCriado,
} from './utils/e2e';

interface CorpoErro {
  message: string[];
  error: string;
  statusCode: number;
}

/**
 * Só este spec mexe em papéis, então os helpers de admin vivem aqui.
 *
 * Deixa o admin do seed como o único admin do banco. Os testes de promote,
 * demote e do invariante do último admin dependem dessa pré-condição — sem ela,
 * um admin promovido por um teste anterior faz o seguinte medir errado.
 */
async function garantirUnicoAdmin(app: TestApp): Promise<void> {
  const { username } = seedAdmin(app);
  const dataSource = app.get(DataSource);

  await dataSource.query(
    `UPDATE "users" SET role = 'admin' WHERE username = $1`,
    [username],
  );
  await dataSource.query(
    `UPDATE "users" SET role = 'user' WHERE role = 'admin' AND username <> $1`,
    [username],
  );
}

/**
 * Quantos admins existem agora. Vem do banco porque não há endpoint que
 * responda isso — é justamente o que o invariante do último admin protege.
 */
async function contarAdmins(app: TestApp): Promise<number> {
  const linhas = await app
    .get(DataSource)
    .query<{ total: number }[]>(
      `SELECT COUNT(*)::int AS total FROM "users" WHERE role = 'admin'`,
    );

  return linhas[0].total;
}

// Satisfazem o @IsStrongPassword dos DTOs de usuário. SENHA_FORTE precisa ser
// igual ao default de criarUsuario, para o login com a senha original bater.
const SENHA_FORTE = 'Senha!Forte1';
const OUTRA_SENHA_FORTE = 'Outra!Senha2';

describe('UsersController (e2e)', () => {
  let app: TestApp;
  let admin: TestAgent;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    await garantirUnicoAdmin(app);
    admin = await loginAsSeedAdmin(app);
  });

  afterAll(async () => {
    await garantirUnicoAdmin(app);
    await app.close();
  });

  describe('POST /users', () => {
    it('cria um usuário e não devolve senha nem role', async () => {
      const username = nomeUnico('novo');
      const res = await admin
        .post('/users')
        .send({ username, password: SENHA_FORTE, name: 'Fulano de Tal' })
        .expect(201);

      // ResponseUserDto expõe só estes quatro campos.
      expect(Object.keys(res.body as object).sort()).toEqual([
        'email',
        'id',
        'name',
        'username',
      ]);
    });

    it('recusa sem sessão', () =>
      http()
        .post('/users')
        .send({ username: nomeUnico('x'), password: SENHA_FORTE })
        .expect(401));

    it('recusa usuário comum', async () => {
      const usuario = await criarUsuario(admin);
      const agent = await loginAs(app, usuario);

      await agent
        .post('/users')
        .send({ username: nomeUnico('y'), password: SENHA_FORTE })
        .expect(403);
    });

    it('recusa senha fraca', async () => {
      const res = await admin
        .post('/users')
        .send({ username: nomeUnico('fraca'), password: 'abc' })
        .expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'A senha precisa ter ao menos 8 caracteres',
      );
    });

    it('recusa username com menos de 4 caracteres', () =>
      admin
        .post('/users')
        .send({ username: 'ab', password: SENHA_FORTE })
        .expect(400));

    it('recusa email inválido', () =>
      admin
        .post('/users')
        .send({
          username: nomeUnico('email'),
          password: SENHA_FORTE,
          email: 'nao-e-email',
        })
        .expect(400));

    // forbidNonWhitelisted: true no APP_PIPE (app.module.ts:89).
    it('recusa campo não declarado no DTO', async () => {
      const res = await admin
        .post('/users')
        .send({
          username: nomeUnico('extra'),
          password: SENHA_FORTE,
          role: Role.ADMIN,
        })
        .expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain('role');
    });

    it('recusa username duplicado com 409', async () => {
      const usuario = await criarUsuario(admin);

      await admin
        .post('/users')
        .send({ username: usuario.username, password: SENHA_FORTE })
        .expect(409);
    });

    it('recusa email duplicado com 409', async () => {
      const email = `${nomeUnico('dup')}@teste.com`;

      await admin
        .post('/users')
        .send({ username: nomeUnico('a'), password: SENHA_FORTE, email })
        .expect(201);

      await admin
        .post('/users')
        .send({ username: nomeUnico('b'), password: SENHA_FORTE, email })
        .expect(409);
    });
  });

  describe('GET /users', () => {
    it('recusa sem sessão', () => http().get('/users').expect(401));

    it('recusa usuário comum', async () => {
      const usuario = await criarUsuario(admin);
      const agent = await loginAs(app, usuario);

      await agent.get('/users').expect(403);
    });

    it('devolve lista paginada para admin', async () => {
      const res = await admin.get('/users').expect(200);
      const body = res.body as { data: unknown[]; total: number };

      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.total).toBe('number');
    });

    it('recusa take não-inteiro', () =>
      admin.get('/users').query({ take: 'abc' }).expect(400));
  });

  describe('GET /users/:id', () => {
    let usuario: UsuarioCriado;
    let agente: TestAgent;

    beforeAll(async () => {
      usuario = await criarUsuario(admin);
      agente = await loginAs(app, usuario);
    });

    it('recusa id que não é UUID v4', () =>
      admin.get('/users/nao-e-uuid').expect(400));

    it('recusa sem sessão', () =>
      http().get(`/users/${usuario.id}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.get(`/users/${UUID_INEXISTENTE}`).expect(404));

    it('permite o usuário ver os próprios dados, com role', async () => {
      const res = await agente.get(`/users/${usuario.id}`).expect(200);

      // ResponseUserRoleDto — aqui role aparece, diferente do GET /users.
      expect((res.body as { role: string }).role).toBe(Role.USER);
    });

    it('recusa o usuário ver dados de outro (403 do SelfOrAdminGuard)', async () => {
      const outro = await criarUsuario(admin);

      const res = await agente.get(`/users/${outro.id}`).expect(403);
      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'só pode acessar os seus próprios dados',
      );
    });

    it('permite o admin ver dados de qualquer um', () =>
      admin.get(`/users/${usuario.id}`).expect(200));
  });

  describe('PATCH /users/:id', () => {
    it('permite o próprio usuário atualizar o nome', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      const res = await agente
        .patch(`/users/${usuario.id}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect((res.body as { name: string }).name).toBe('Nome Atualizado');
    });

    it('recusa atualizar outro usuário', async () => {
      const usuario = await criarUsuario(admin);
      const outro = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente
        .patch(`/users/${outro.id}`)
        .send({ name: 'Invasor' })
        .expect(403);
    });

    // UpdateUserDto = PartialType(OmitType(CreateUserDto, ['password','username']))
    it('recusa alterar username (campo omitido do DTO)', async () => {
      const usuario = await criarUsuario(admin);

      await admin
        .patch(`/users/${usuario.id}`)
        .send({ username: nomeUnico('hack') })
        .expect(400);
    });

    it('recusa email já usado por outro com 409', async () => {
      const email = `${nomeUnico('ocupado')}@teste.com`;
      await admin
        .post('/users')
        .send({ username: nomeUnico('dono'), password: SENHA_FORTE, email })
        .expect(201);

      const usuario = await criarUsuario(admin);

      await admin.patch(`/users/${usuario.id}`).send({ email }).expect(409);
    });

    it('devolve 404 para UUID inexistente', () =>
      admin
        .patch(`/users/${UUID_INEXISTENTE}`)
        .send({ name: 'Ninguem' })
        .expect(404));
  });

  describe('PATCH /users/:id/password', () => {
    it('troca a senha e devolve 204', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: usuario.password,
          newPassword: OUTRA_SENHA_FORTE,
          confirmPassword: OUTRA_SENHA_FORTE,
        })
        .expect(204);

      // A senha nova funciona; a antiga não.
      await loginAs(app, {
        username: usuario.username,
        password: OUTRA_SENHA_FORTE,
      });
      await http()
        .post('/auth/login')
        .send({ username: usuario.username, password: usuario.password })
        .expect(401);
    });

    // destroyUserSessions (users.service.ts:126) roda no Redis de verdade.
    it('destrói as sessões abertas do usuário', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);
      await agente.get('/auth/me').expect(200);

      await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: usuario.password,
          newPassword: OUTRA_SENHA_FORTE,
          confirmPassword: OUTRA_SENHA_FORTE,
        })
        .expect(204);

      await agente.get('/auth/me').expect(401);
    });

    // 403 aqui é ambíguo: vem do SelfOrAdminGuard OU da senha atual errada.
    // Só a message distingue os dois.
    it('recusa senha atual incorreta com 403 do service', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      const res = await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: 'Senha!Errada9',
          newPassword: OUTRA_SENHA_FORTE,
          confirmPassword: OUTRA_SENHA_FORTE,
        })
        .expect(403);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'A senha atual está incorreta',
      );
    });

    it('recusa alterar a senha de outro usuário com 403 do guard', async () => {
      const usuario = await criarUsuario(admin);
      const outro = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      const res = await agente
        .patch(`/users/${outro.id}/password`)
        .send({
          currentPassword: outro.password,
          newPassword: OUTRA_SENHA_FORTE,
          confirmPassword: OUTRA_SENHA_FORTE,
        })
        .expect(403);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'só pode acessar os seus próprios dados',
      );
    });

    it('recusa quando a confirmação não confere', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      const res = await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: usuario.password,
          newPassword: OUTRA_SENHA_FORTE,
          confirmPassword: 'Diferente!9',
        })
        .expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'não conferem',
      );
    });

    it('recusa nova senha igual à anterior', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      const res = await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: usuario.password,
          newPassword: usuario.password,
          confirmPassword: usuario.password,
        })
        .expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'igual à anterior',
      );
    });

    it('recusa nova senha fraca', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente
        .patch(`/users/${usuario.id}/password`)
        .send({
          currentPassword: usuario.password,
          newPassword: 'fraca',
          confirmPassword: 'fraca',
        })
        .expect(400);
    });
  });

  describe('PATCH /users/:id/password/admin', () => {
    it('admin troca a senha de outro e derruba a sessão dele', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);
      await agente.get('/auth/me').expect(200);

      await admin
        .patch(`/users/${usuario.id}/password/admin`)
        .send({ newPassword: OUTRA_SENHA_FORTE })
        .expect(204);

      await agente.get('/auth/me').expect(401);
      await loginAs(app, {
        username: usuario.username,
        password: OUTRA_SENHA_FORTE,
      });
    });

    it('recusa usuário comum, mesmo sobre si próprio', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente
        .patch(`/users/${usuario.id}/password/admin`)
        .send({ newPassword: OUTRA_SENHA_FORTE })
        .expect(403);
    });

    it('recusa sem sessão', () =>
      http()
        .patch(`/users/${UUID_INEXISTENTE}/password/admin`)
        .send({ newPassword: OUTRA_SENHA_FORTE })
        .expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin
        .patch(`/users/${UUID_INEXISTENTE}/password/admin`)
        .send({ newPassword: OUTRA_SENHA_FORTE })
        .expect(404));
  });

  describe('POST /users/:id/promote e /demote', () => {
    // Cada teste aqui precisa partir de "o seed admin é o único admin".
    // Sem isso, os promotes de um teste vazam para o seguinte e o invariante
    // do último admin deixa de valer.
    beforeEach(async () => {
      await garantirUnicoAdmin(app);
      admin = await loginAsSeedAdmin(app);
    });

    it('promove um usuário comum a admin', async () => {
      const usuario = await criarUsuario(admin);

      const res = await admin.post(`/users/${usuario.id}/promote`).expect(200);

      expect((res.body as { role: string }).role).toBe(Role.ADMIN);
    });

    it('recusa promover quem já é admin', async () => {
      const usuario = await criarUsuario(admin);
      await admin.post(`/users/${usuario.id}/promote`).expect(200);

      const res = await admin.post(`/users/${usuario.id}/promote`).expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'já é um administrador',
      );
    });

    it('rebaixa um admin quando há mais de um', async () => {
      const usuario = await criarUsuario(admin);
      await admin.post(`/users/${usuario.id}/promote`).expect(200);

      const res = await admin.post(`/users/${usuario.id}/demote`).expect(200);
      expect((res.body as { role: string }).role).toBe(Role.USER);
    });

    it('recusa rebaixar quem já é usuário comum', async () => {
      const usuario = await criarUsuario(admin);

      const res = await admin.post(`/users/${usuario.id}/demote`).expect(400);
      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'já é um usuário',
      );
    });

    // O invariante que mantém a API administrável (users.service.ts:140).
    it('recusa rebaixar o último admin', async () => {
      const eu = await admin.get('/auth/me').expect(200);
      const meuId = (eu.body as { userId: string }).userId;

      const res = await admin.post(`/users/${meuId}/demote`).expect(400);
      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'Deve existir pelo menos 1 administrador',
      );
    });

    it('promote derruba a sessão do promovido', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);
      await agente.get('/auth/me').expect(200);

      await admin.post(`/users/${usuario.id}/promote`).expect(200);

      await agente.get('/auth/me').expect(401);
    });

    it('recusa usuário comum promovendo alguém', async () => {
      const usuario = await criarUsuario(admin);
      const outro = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente.post(`/users/${outro.id}/promote`).expect(403);
    });

    it('devolve 404 para UUID inexistente', () =>
      admin.post(`/users/${UUID_INEXISTENTE}/promote`).expect(404));
  });

  describe('DELETE /users/:id', () => {
    it('remove o usuário e derruba a sessão dele', async () => {
      const usuario = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);
      await agente.get('/auth/me').expect(200);

      await admin.delete(`/users/${usuario.id}`).expect(200);

      await agente.get('/auth/me').expect(401);
      await admin.get(`/users/${usuario.id}`).expect(404);
    });

    it('recusa usuário comum', async () => {
      const usuario = await criarUsuario(admin);
      const outro = await criarUsuario(admin);
      const agente = await loginAs(app, usuario);

      await agente.delete(`/users/${outro.id}`).expect(403);
    });

    it('recusa sem sessão', () =>
      http().delete(`/users/${UUID_INEXISTENTE}`).expect(401));

    it('devolve 404 para UUID inexistente', () =>
      admin.delete(`/users/${UUID_INEXISTENTE}`).expect(404));

    it('recusa id que não é UUID v4', () =>
      admin.delete('/users/123').expect(400));
  });

  /**
   * O invariante que mantém a API administrável: sempre existe ao menos um
   * admin. Vale para os dois caminhos que podem zerar a contagem — demote e
   * delete — através do validateNotLastAdmin (users.service.ts:52).
   */
  describe('Invariante: sempre existe ao menos um admin', () => {
    beforeEach(async () => {
      await garantirUnicoAdmin(app);
      admin = await loginAsSeedAdmin(app);
    });

    const meuId = async () => {
      const eu = await admin.get('/auth/me').expect(200);
      return (eu.body as { userId: string }).userId;
    };

    it('o demote recusa rebaixar o último admin', async () => {
      await admin.post(`/users/${await meuId()}/demote`).expect(400);

      expect(await contarAdmins(app)).toBe(1);
    });

    it('o delete recusa remover o último admin', async () => {
      const res = await admin.delete(`/users/${await meuId()}`).expect(400);

      expect((res.body as CorpoErro).message.join(' ')).toContain(
        'Deve existir pelo menos 1 administrador',
      );
      expect(await contarAdmins(app)).toBe(1);
    });

    it('permite remover um admin quando há outro', async () => {
      const outro = await criarUsuario(admin);
      await admin.post(`/users/${outro.id}/promote`).expect(200);
      expect(await contarAdmins(app)).toBe(2);

      await admin.delete(`/users/${outro.id}`).expect(200);

      expect(await contarAdmins(app)).toBe(1);
    });

    it('permite remover um usuário comum', async () => {
      const usuario = await criarUsuario(admin);

      await admin.delete(`/users/${usuario.id}`).expect(200);

      expect(await contarAdmins(app)).toBe(1);
    });
  });
});
