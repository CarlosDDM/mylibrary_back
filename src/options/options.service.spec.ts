import { Test, TestingModule } from '@nestjs/testing';
import { OptionsService } from './options.service';
import { CacheService } from '../cache/cache.service';
import { Status } from '../status/entities/status.entity';
import { Language } from '../languages/entities/language.entity';
import { Media } from '../medias/entities/media.entity';
import { StatusType } from '../common/enums/status-type.enum';
import { LanguageType } from '../common/enums/language-type.enum';
import { MediaType } from '../common/enums/medias-type.enum';
import { StatusService } from 'src/status/status.service';
import { MediasService } from 'src/medias/medias.service';
import { LanguagesService } from 'src/languages/languages.service';
import { STATIC_TTL_MS } from 'src/cache/cache.constants';

describe('OptionsService', () => {
  let service: OptionsService;
  let statusService: { findAll: jest.Mock };
  let mediaService: { findAll: jest.Mock };
  let languageService: { findAll: jest.Mock };
  let cacheService: { wrap: jest.Mock };

  const status = [{ id: 'status-1', type: StatusType.ONGOING }] as Status[];
  const languages = [{ id: 'lang-1', type: LanguageType.PT_BR }] as Language[];
  const medias = [{ id: 'media-1', type: MediaType.MANGA }] as Media[];

  beforeEach(async () => {
    cacheService = {
      wrap: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
    };
    statusService = { findAll: jest.fn().mockResolvedValue(status) };
    mediaService = { findAll: jest.fn().mockResolvedValue(medias) };
    languageService = { findAll: jest.fn().mockResolvedValue(languages) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionsService,
        { provide: CacheService, useValue: cacheService },
        { provide: StatusService, useValue: statusService },
        { provide: MediasService, useValue: mediaService },
        { provide: LanguagesService, useValue: languageService },
      ],
    }).compile();

    service = module.get<OptionsService>(OptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar as opcoes', async () => {
      const result = await service.findAll();

      expect(result).toEqual({ status, medias, languages });
    });

    it('deveria usar o cache com a chave e o TTL estatico', async () => {
      await service.findAll();

      expect(cacheService.wrap).toHaveBeenCalledWith(
        'options',
        expect.any(Function),
        STATIC_TTL_MS,
      );
    });

    it('deveria devolver o valor do cache sem consultar o banco', async () => {
      const cached = { status: [], languages: [], medias: [] };

      cacheService.wrap.mockResolvedValue(cached);

      const result = await service.findAll();

      expect(result).toBe(cached);
      expect(statusService.findAll).not.toHaveBeenCalled();
      expect(mediaService.findAll).not.toHaveBeenCalled();
      expect(languageService.findAll).not.toHaveBeenCalled();
    });
  });
});
