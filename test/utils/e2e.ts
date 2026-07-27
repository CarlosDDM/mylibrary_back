import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';

export type TestApp = INestApplication<App>;
export type TestAgent = ReturnType<typeof request.agent>;

// UUID v4 sintaticamente válido que nunca existe no banco — para separar o 400
// do ParseUUIDPipe do 404 do service.
export const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

/**
 * Sobe a app inteira em memória.
 *
 * Por padrão o ThrottlerStorage é substituído por um stub que nunca bloqueia:
 * a suíte dispara dezenas de requisições por segundo e tomaria 429 aleatório.
 * O throttler.e2e-spec.ts passa `comThrottler: true` para exercitar os limites
 * de verdade.
 */
export async function createTestApp({
  comThrottler = false,
}: { comThrottler?: boolean } = {}): Promise<TestApp> {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  if (!comThrottler) {
    builder.overrideProvider(ThrottlerStorage).useValue({
      increment: () =>
        Promise.resolve({
          totalHits: 1,
          timeToExpire: 60,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
    });
  }

  const moduleRef: TestingModule = await builder.compile();

  const app = moduleRef.createNestApplication<TestApp>();
  await app.init();
  return app;
}

export function seedAdmin(app: TestApp) {
  const config = app.get(ConfigService);

  return {
    username: config.get<string>('ADMIN_USERNAME')!,
    password: config.get<string>('ADMIN_PASSWORD')!,
  };
}

export function loginAs(
  app: TestApp,
  credenciais: { username: string; password: string },
): Promise<TestAgent> {
  const agent = request.agent(app.getHttpServer());

  return agent
    .post('/auth/login')
    .send(credenciais)
    .expect(200)
    .then(() => agent);
}

export function loginAsSeedAdmin(app: TestApp): Promise<TestAgent> {
  return loginAs(app, seedAdmin(app));
}

let contador = 0;
/** Nome único dentro da execução, para não esbarrar nos 409 de unicidade. */
export function nomeUnico(prefixo: string): string {
  contador += 1;
  return `${prefixo}-e2e-${Date.now()}-${contador}`;
}

export interface OptionIds {
  statusId: string;
  mediaId: string;
  languageId: string;
}

/** Ids reais do seed, necessários para criar works e series. */
export async function optionIds(agent: TestAgent): Promise<OptionIds> {
  const res = await agent.get('/options').expect(200);
  const options = res.body as {
    status: { id: string }[];
    medias: { id: string }[];
    languages: { id: string }[];
  };

  return {
    statusId: options.status[0].id,
    mediaId: options.medias[0].id,
    languageId: options.languages[0].id,
  };
}

interface Criado {
  id: string;
  name: string;
}

/** Cabeçalho PNG. O ValidateImagePipe só olha o mimetype, não os bytes. */
export const PNG_FALSO = Buffer.from('89504e470d0a1a0a', 'hex');

export async function criarSerie(
  admin: TestAgent,
  statusId: string,
  extra: Record<string, unknown> = {},
): Promise<Criado> {
  const name = nomeUnico('serie');
  const res = await admin
    .post('/series')
    .send({ name, statusId, ...extra })
    .expect(201);

  return { id: (res.body as { id: string }).id, name };
}

export async function criarWork(
  admin: TestAgent,
  ids: Pick<OptionIds, 'mediaId' | 'languageId'>,
  extra: Record<string, unknown> = {},
): Promise<Criado> {
  const name = nomeUnico('work');
  const res = await admin
    .post('/works')
    .send({
      name,
      mediaId: ids.mediaId,
      languageId: ids.languageId,
      ...extra,
    })
    .expect(201);

  return { id: (res.body as { id: string }).id, name };
}

export interface UsuarioCriado {
  id: string;
  username: string;
  password: string;
}

/**
 * Cria um usuário comum via API e devolve as credenciais para login.
 * A senha padrão precisa satisfazer o @IsStrongPassword do CreateUserDto.
 */
export async function criarUsuario(
  admin: TestAgent,
  password = 'Senha!Forte1',
): Promise<UsuarioCriado> {
  const username = nomeUnico('user');

  const res = await admin
    .post('/users')
    .send({ username, password })
    .expect(201);

  return { id: (res.body as { id: string }).id, username, password };
}
