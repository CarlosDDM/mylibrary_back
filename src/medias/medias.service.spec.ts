import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MediasService } from './medias.service';
import { Media } from './entities/media.entity';
import { MediaType } from '../common/enums/medias-type.enum';

describe('MediasService', () => {
  let service: MediasService;
  let mediaRepository: { find: jest.Mock; exists: jest.Mock };

  const medias = [
    { id: 'media-1', type: MediaType.BOOK },
    { id: 'media-2', type: MediaType.MANGA },
    { id: 'media-3', type: MediaType.LIGHT_NOVEL },
    { id: 'media-4', type: MediaType.WEBTOON },
  ] as Media[];

  beforeEach(async () => {
    mediaRepository = {
      find: jest.fn().mockResolvedValue(medias),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediasService,
        { provide: getRepositoryToken(Media), useValue: mediaRepository },
      ],
    }).compile();

    service = module.get<MediasService>(MediasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar as medias', async () => {
      const result = await service.findAll();

      expect(result).toEqual(medias);
    });
  });

  describe('validateExists', () => {
    it('nao deveria lancar quando a media existe', async () => {
      mediaRepository.exists.mockResolvedValue(true);

      await expect(
        service.validateExists({ id: 'media-1' }),
      ).resolves.toBeUndefined();
      expect(mediaRepository.exists).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });

    it('deveria lancar NotFoundException quando a media nao existe', async () => {
      mediaRepository.exists.mockResolvedValue(false);

      await expect(
        service.validateExists({ id: 'nao-existe' }),
      ).rejects.toThrow(new NotFoundException('Media não encontrado'));
    });
  });
});
