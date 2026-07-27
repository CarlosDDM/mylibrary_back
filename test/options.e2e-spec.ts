import request from 'supertest';
import { LanguageType } from 'src/common/enums/language-type.enum';
import { MediaType } from 'src/common/enums/medias-type.enum';
import { StatusType } from 'src/common/enums/status-type.enum';
import {
  OptionsType,
  ResponseOption,
} from 'src/options/dto/response-option.dto';
import {
  createTestApp,
  loginAsSeedAdmin,
  TestAgent,
  TestApp,
} from './utils/e2e';

const tipos = (itens: OptionsType[]) => itens.map((i) => i.type).sort();

describe('OptionsController (e2e)', () => {
  let app: TestApp;
  let agent: TestAgent;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    agent = await loginAsSeedAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /options', () => {
    it('recusa requisição sem sessão', () =>
      http().get('/options').expect(401));

    it('devolve os dados do seed', async () => {
      const res = await agent.get('/options').expect(200);
      const body = res.body as ResponseOption;

      expect(Object.keys(body).sort()).toEqual([
        'languages',
        'medias',
        'status',
      ]);

      expect(tipos(body.status)).toEqual(Object.values(StatusType).sort());
      expect(tipos(body.medias)).toEqual(Object.values(MediaType).sort());
      expect(tipos(body.languages)).toEqual(Object.values(LanguageType).sort());

      for (const item of [...body.status, ...body.medias, ...body.languages]) {
        expect(Object.keys(item).sort()).toEqual(['id', 'type']);
        expect(typeof item.id).toBe('string');
      }
    });
  });
});
