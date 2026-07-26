import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { Language } from './entities/language.entity';
import { LanguageType } from '../common/enums/language-type.enum';

describe('LanguagesService', () => {
  let service: LanguagesService;
  let languageRepository: { find: jest.Mock; exists: jest.Mock };

  const languages = [
    { id: 'language-1', type: LanguageType.PT_BR },
    { id: 'language-2', type: LanguageType.EN },
  ] as Language[];

  beforeEach(async () => {
    languageRepository = {
      find: jest.fn().mockResolvedValue(languages),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesService,
        { provide: getRepositoryToken(Language), useValue: languageRepository },
      ],
    }).compile();

    service = module.get<LanguagesService>(LanguagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria entregar as languages', async () => {
      const result = await service.findAll();

      expect(result).toEqual(languages);
    });
  });

  describe('validateExists', () => {
    it('nao deveria lancar quando a language existe', async () => {
      languageRepository.exists.mockResolvedValue(true);

      await expect(
        service.validateExists({ id: 'language-1' }),
      ).resolves.toBeUndefined();
      expect(languageRepository.exists).toHaveBeenCalledWith({
        where: { id: 'language-1' },
      });
    });

    it('deveria lancar NotFoundException quando a language nao existe', async () => {
      languageRepository.exists.mockResolvedValue(false);

      await expect(
        service.validateExists({ id: 'nao-existe' }),
      ).rejects.toThrow(new NotFoundException('Language não encontrado'));
    });
  });
});
