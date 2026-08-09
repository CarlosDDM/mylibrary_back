import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeriesService } from './series.service';
import { Serie } from './entities/serie.entity';
import { StatusService } from 'src/status/status.service';
import { FranchisesService } from 'src/franchises/franchises.service';
import { CacheService } from 'src/cache/cache.service';
import { FileService } from 'src/file/file.service';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';
import { CreateSeriesDto } from './dto/create-series.dto';

describe('SeriesService', () => {
  let service: SeriesService;
  let serieRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    loadRelationCountAndMap: jest.Mock;
    orderBy: jest.Mock;
    take: jest.Mock;
    skip: jest.Mock;
    andWhere: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  let statusService: {
    validateExists: jest.Mock;
  };

  let franchiseService: {
    validateExists: jest.Mock;
    invalidateCache: jest.Mock;
  };

  let cacheService: {
    wrap: jest.Mock;
    del: jest.Mock;
    invalidateByPrefix: jest.Mock;
  };

  let fileService: {
    keyFromUrl: jest.Mock;
    deleteImage: jest.Mock;
    uploadImage: jest.Mock;
  };

  const relations = {
    franchise: true,
    status: true,
    works: {
      covers: true,
      language: true,
      media: true,
      workAuthors: {
        author: true,
      },
      workIllustrators: {
        illustrator: true,
      },
    },
  };

  const value = [
    {
      id: 'serie-1',
      name: 'A serie',
      statusId: 'status-1',
      franchiseId: 'franchise-1',
      coverUrl: null,
    },
    {
      id: 'serie-2',
      name: 'O serie',
      statusId: 'status-1',
      franchiseId: null,
      coverUrl: null,
    },
    {
      id: 'serie-3',
      name: 'I serie',
      statusId: 'status-2',
      franchiseId: null,
      coverUrl: null,
    },
    {
      id: 'serie-4',
      name: 'Nova serie',
      statusId: 'status-1',
      franchiseId: 'franchise-1',
      coverUrl: null,
    },
  ];

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    serieRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    cacheService = {
      wrap: jest.fn((_key, loader: () => unknown) => loader()),
      del: jest.fn(),
      invalidateByPrefix: jest.fn(),
    };
    franchiseService = {
      validateExists: jest.fn(),
      invalidateCache: jest.fn(),
    };

    statusService = {
      validateExists: jest.fn(),
    };

    fileService = {
      keyFromUrl: jest.fn(),
      deleteImage: jest.fn(),
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        { provide: getRepositoryToken(Serie), useValue: serieRepository },
        { provide: CacheService, useValue: cacheService },
        { provide: StatusService, useValue: statusService },
        {
          provide: FranchisesService,
          useValue: franchiseService,
        },
        {
          provide: FileService,
          useValue: fileService,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('deveria buscar serie por id e retornar', async () => {
      serieRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'serie-1' });

      expect(serieRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'serie-1' } }),
      );
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando a serie não existe', async () => {
      serieRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id, invalidar o dashboard e retornar o objeto', async () => {
      serieRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      serieRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'serie-1' });

      expect(serieRepository.delete).toHaveBeenCalledWith({ id: 'serie-1' });
      expect(result).toEqual(value[0]);
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
    });

    it('deveria lançar NotFoundException quando a serie não existe ao deletar', async () => {
      serieRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(serieRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deveria atualizar uma serie', async () => {
      const dto = {
        name: 'Novo nome',
        statusId: 'status-1',
        franchiseId: 'franchise-1',
      };
      const updated = { ...value[0], name: 'Novo nome' };
      serieRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(updated);
      serieRepository.update.mockResolvedValue(updated);
      serieRepository.exists.mockResolvedValue(false);

      const result = await service.update('serie-1', dto);

      expect(result).toEqual(updated);
      expect(statusService.validateExists).toHaveBeenCalledWith({
        id: 'status-1',
      });
      expect(franchiseService.validateExists).toHaveBeenCalledWith({
        id: 'franchise-1',
      });

      expect(serieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'serie-1' },
        relations,
      });
      expect(serieRepository.update).toHaveBeenCalledWith(
        { id: 'serie-1' },
        dto,
      );
      expect(serieRepository.update).toHaveBeenCalledTimes(1);
      expect(serieRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('não deveria validar unicidade quando o nome não muda', async () => {
      const dto = { name: value[0].name };
      serieRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(value[0]);
      serieRepository.update.mockResolvedValue(value[0]);
      serieRepository.exists.mockResolvedValue(true);

      const result = await service.update('serie-1', dto);

      expect(result).toEqual(value[0]);
      expect(serieRepository.exists).not.toHaveBeenCalled();
      expect(serieRepository.update).toHaveBeenCalledWith(
        { id: 'serie-1' },
        dto,
      );
    });

    it('deveria propagar NotFoundException caso não encontrar o id da serie', async () => {
      const dto = { name: 'Novo nome' };

      serieRepository.findOne.mockResolvedValue(null);

      await expect(service.update('serie-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(serieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'serie-1' },
        relations,
      });
      expect(serieRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('deveria propagar ConflictException caso o nome ja exista', async () => {
      const dto = { name: 'O serie' };
      serieRepository.findOne.mockResolvedValue(value[0]);
      serieRepository.exists.mockResolvedValue(true);

      await expect(service.update('serie-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(serieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'serie-1' },
        relations,
      });
      expect(serieRepository.exists).toHaveBeenCalledWith({
        where: { name: 'O serie' },
      });
      expect(serieRepository.update).not.toHaveBeenCalled();
    });

    it('deveria propagar NotFoundException caso o status não exista', async () => {
      const dto = {
        name: 'O serie',
        statusId: 'status-inexistente',
      };
      statusService.validateExists.mockRejectedValue(
        new NotFoundException('Status não encontrado'),
      );
      serieRepository.findOne.mockResolvedValue(value[0]);
      serieRepository.exists.mockResolvedValue(false);

      await expect(service.update('serie-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(serieRepository.findOne).toHaveBeenCalled();
      expect(statusService.validateExists).toHaveBeenCalledWith({
        id: 'status-inexistente',
      });
      expect(serieRepository.update).not.toHaveBeenCalled();
    });

    it('deveria propagar NotFoundException caso a franquia não exista', async () => {
      const dto = {
        name: 'O serie',
        franchiseId: 'franquia-inexistente',
      };
      franchiseService.validateExists.mockRejectedValue(
        new NotFoundException('Franquia não encontrada'),
      );
      serieRepository.findOne.mockResolvedValue(value[0]);
      serieRepository.exists.mockResolvedValue(false);

      await expect(service.update('serie-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(serieRepository.findOne).toHaveBeenCalled();
      expect(franchiseService.validateExists).toHaveBeenCalledWith({
        id: 'franquia-inexistente',
      });
      expect(serieRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deveria criar uma nova serie', async () => {
      const created = value[3];
      const dto = {
        name: created.name,
        statusId: created.statusId,
        franchiseId: created.franchiseId,
      } as CreateSeriesDto;

      serieRepository.exists.mockResolvedValue(false);
      serieRepository.save.mockResolvedValue(created);
      serieRepository.findOne.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(statusService.validateExists).toHaveBeenCalledWith({
        id: 'status-1',
      });
      expect(franchiseService.validateExists).toHaveBeenCalledWith({
        id: 'franchise-1',
      });
      expect(serieRepository.exists).toHaveBeenCalledWith({
        where: { name: 'Nova serie' },
      });
      expect(serieRepository.save).toHaveBeenCalledWith(dto);
      expect(serieRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'serie-4' },
        relations,
      });
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
    });

    it('deveria propagar ConflictException caso o nome ja exista', async () => {
      const dto = { name: 'A serie', statusId: 'status-1' } as CreateSeriesDto;
      serieRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(serieRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A serie' },
      });
      expect(serieRepository.save).not.toHaveBeenCalled();
    });

    it('deveria propagar NotFoundException caso o status não exista', async () => {
      const dto = {
        name: 'Nova serie',
        statusId: 'status-inexistente',
      } as CreateSeriesDto;
      statusService.validateExists.mockRejectedValue(
        new NotFoundException('Status não encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(statusService.validateExists).toHaveBeenCalledWith({
        id: 'status-inexistente',
      });
      expect(serieRepository.save).not.toHaveBeenCalled();
    });

    it('deveria propagar NotFoundException caso a franquia não exista', async () => {
      const dto = {
        name: 'Nova serie',
        statusId: 'status-1',
        franchiseId: 'franquia-inexistente',
      } as CreateSeriesDto;
      franchiseService.validateExists.mockRejectedValue(
        new NotFoundException('Franquia não encontrada'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(franchiseService.validateExists).toHaveBeenCalledWith({
        id: 'franquia-inexistente',
      });
      expect(serieRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('setCover', () => {
    const file = {
      originalname: 'cover.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
    } as Express.Multer.File;
    const newUrl = 'http://localhost.com/cover.jpg';

    it('deveria adicionar um cover quando não há capa anterior', async () => {
      const expectResult = { ...value[0], coverUrl: newUrl };
      serieRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(expectResult);
      fileService.uploadImage.mockResolvedValue({ url: newUrl });

      const result = await service.setCover('serie-1', file);

      expect(result).toEqual(expectResult);
      expect(fileService.uploadImage).toHaveBeenCalledWith(
        file,
        expect.stringMatching(/^series\/.+\.(jpg|jpeg|png|webp)$/),
      );
      expect(serieRepository.update).toHaveBeenCalledWith(
        { id: 'serie-1' },
        { coverUrl: newUrl },
      );
      expect(fileService.deleteImage).not.toHaveBeenCalled();
      expect(serieRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('deveria substituir o cover removendo a capa anterior', async () => {
      const previousUrl = 'http://localhost.com/old.jpg';
      const serieComCover = { ...value[0], coverUrl: previousUrl };
      const expectResult = { ...value[0], coverUrl: newUrl };
      serieRepository.findOne
        .mockResolvedValueOnce(serieComCover)
        .mockResolvedValueOnce(expectResult);
      fileService.uploadImage.mockResolvedValue({ url: newUrl });
      fileService.keyFromUrl.mockReturnValue('series/old.jpg');

      const result = await service.setCover('serie-1', file);

      expect(result).toEqual(expectResult);
      expect(serieRepository.update).toHaveBeenCalledWith(
        { id: 'serie-1' },
        { coverUrl: newUrl },
      );
      expect(fileService.keyFromUrl).toHaveBeenCalledWith(previousUrl);
      expect(fileService.deleteImage).toHaveBeenCalledWith('series/old.jpg');
    });
  });

  describe('removeCover', () => {
    it('deveria remover o cover existente', async () => {
      const previousUrl = 'http://localhost.com/old.jpg';
      const serieComCover = { ...value[0], coverUrl: previousUrl };
      const expectResult = { ...value[0], coverUrl: null };
      serieRepository.findOne
        .mockResolvedValueOnce(serieComCover)
        .mockResolvedValueOnce(expectResult);
      fileService.keyFromUrl.mockReturnValue('series/old.jpg');

      const result = await service.removeCover('serie-1');

      expect(result).toEqual(expectResult);
      expect(serieRepository.update).toHaveBeenCalledWith(
        { id: 'serie-1' },
        { coverUrl: null },
      );
      expect(fileService.keyFromUrl).toHaveBeenCalledWith(previousUrl);
      expect(fileService.deleteImage).toHaveBeenCalledWith('series/old.jpg');
      expect(serieRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('não deveria fazer nada quando não há cover', async () => {
      serieRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.removeCover('serie-1');

      expect(result).toEqual(value[0]);
      expect(serieRepository.update).not.toHaveBeenCalled();
      expect(fileService.deleteImage).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deveria retornar tudo sem filtro já paginado', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 3]);

      const result = await service.findAll({ take: 20, skip: 0 });

      expect(result).toEqual({
        data: value,
        total: 3,
        pages: 1,
        current_page: 1,
      });
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('deveria calcular pages e current_page fora da primeira página', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAll({ take: 20, skip: 20 });

      expect(result).toMatchObject({ total: 45, pages: 3, current_page: 2 });
    });

    it('deveria usar take 20 como padrão quando não informado', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAll({});

      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toMatchObject({ pages: 3, current_page: 1 });
    });

    it('deveria aplicar o filtro de franquia e retornar os dados paginados', async () => {
      const expectedValue = [value[0], value[3]];
      queryBuilder.getManyAndCount.mockResolvedValue([expectedValue, 2]);

      const result = await service.findAll({ franchiseIds: ['franchise-1'] });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'franchise.id IN (:...franchiseIds)',
        { franchiseIds: ['franchise-1'] },
      );
      expect(result).toEqual({
        data: expectedValue,
        total: 2,
        pages: 1,
        current_page: 1,
      });
    });

    it('deveria aplicar os filtros de nome e status', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[value[0]], 1]);

      await service.findAll({ name: 'serie', statusIds: ['status-1'] });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('to_tsquery'),
        { term: 'serie' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'status.id IN (:...statusIds)',
        { statusIds: ['status-1'] },
      );
    });

    it('deveria usar a mesma chave de cache com take explícito ou default', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 4]);

      await service.findAll({});
      await service.findAll({ take: 20, skip: 0 });

      const [primeira] = cacheService.wrap.mock.calls[0] as [string];
      const [segunda] = cacheService.wrap.mock.calls[1] as [string];

      expect(primeira).toBe(segunda);
      expect(primeira).toContain('serie:list:');
    });
  });
});
