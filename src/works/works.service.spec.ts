import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { Work } from './entities/work.entity';
import { WorkAuthor } from './entities/work-author.entity';
import { WorkIllustrator } from './entities/work-illustrator.entity';
import { Cover } from './entities/cover.entity';
import { SeriesService } from 'src/series/series.service';
import { MediasService } from 'src/medias/medias.service';
import { LanguagesService } from 'src/languages/languages.service';
import { AuthorsService } from 'src/authors/authors.service';
import { IllustratorsService } from 'src/illustrators/illustrators.service';
import { CacheService } from 'src/cache/cache.service';
import { FileService } from 'src/file/file.service';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';

describe('WorksService', () => {
  let service: WorksService;
  let workRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let coverRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let cacheService: {
    wrap: jest.Mock;
    del: jest.Mock;
    invalidateByPrefix: jest.Mock;
  };
  let seriesService: {
    invalidateCache: jest.Mock;
    validateExists: jest.Mock;
  };
  let mediasService: { validateExists: jest.Mock };
  let languagesService: { validateExists: jest.Mock };
  let authorsService: { ensureAllExist: jest.Mock };
  let illustratorsService: { ensureAllExist: jest.Mock };
  let fileService: {
    keyFromUrl: jest.Mock;
    deleteImage: jest.Mock;
    uploadImage: jest.Mock;
  };
  let entityManager: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    take: jest.Mock;
    skip: jest.Mock;
    getManyAndCount: jest.Mock;
  };
  let subQueryBuilder: {
    subQuery: jest.Mock;
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getQuery: jest.Mock;
  };
  let coverQueryBuilder: {
    select: jest.Mock;
    where: jest.Mock;
    getRawOne: jest.Mock;
  };

  const value = [
    { id: 'work-1', name: 'A obra', serieId: null, covers: [] },
    { id: 'work-2', name: 'Qualquer coisa', serieId: null, covers: [] },
    { id: 'work-3', name: 'A grande coisa', serieId: null, covers: [] },
  ];

  beforeEach(async () => {
    subQueryBuilder = {
      subQuery: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('(subquery)'),
    };
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn((condition: unknown) => {
        if (typeof condition === 'function') {
          (condition as (sub: unknown) => string)(subQueryBuilder);
        }
        return queryBuilder;
      }),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    coverQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };
    workRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    coverRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(coverQueryBuilder),
    };
    cacheService = {
      wrap: jest.fn((_key, loader: () => unknown) => loader()),
      del: jest.fn(),
      invalidateByPrefix: jest.fn(),
    };
    seriesService = {
      invalidateCache: jest.fn(),
      validateExists: jest.fn(),
    };
    mediasService = { validateExists: jest.fn() };
    languagesService = { validateExists: jest.fn() };
    authorsService = { ensureAllExist: jest.fn() };
    illustratorsService = { ensureAllExist: jest.fn() };
    fileService = {
      keyFromUrl: jest.fn(),
      deleteImage: jest.fn(),
      uploadImage: jest.fn(),
    };
    entityManager = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((runInTransaction: (manager: unknown) => unknown) =>
        runInTransaction(entityManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksService,
        { provide: getRepositoryToken(Work), useValue: workRepository },
        { provide: getRepositoryToken(Cover), useValue: coverRepository },
        { provide: SeriesService, useValue: seriesService },
        { provide: MediasService, useValue: mediasService },
        { provide: LanguagesService, useValue: languagesService },
        { provide: AuthorsService, useValue: authorsService },
        { provide: IllustratorsService, useValue: illustratorsService },
        { provide: DataSource, useValue: dataSource },
        { provide: CacheService, useValue: cacheService },
        { provide: FileService, useValue: fileService },
      ],
    }).compile();

    service = module.get<WorksService>(WorksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('deveria buscar obra por id e retornar', async () => {
      workRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'work-1' });

      expect(workRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'work-1' } }),
      );
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando a obra não existe', async () => {
      workRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneById', () => {
    it('deveria buscar a obra pelo cache e retornar', async () => {
      workRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOneById('work-1');

      expect(cacheService.wrap).toHaveBeenCalledWith(
        'work:work-1',
        expect.any(Function),
      );
      expect(result).toEqual(value[0]);
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id, invalidar o dashboard e retornar o objeto', async () => {
      workRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      workRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'work-1' });

      expect(workRepository.delete).toHaveBeenCalledWith({ id: 'work-1' });
      expect(result).toEqual(value[0]);
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
    });

    it('deveria lançar NotFoundException quando a obra não existe ao deletar', async () => {
      workRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(workRepository.delete).not.toHaveBeenCalled();
    });

    it('deveria remover os arquivos das capas ao deletar a obra', async () => {
      workRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      workRepository.findOne.mockResolvedValue({
        ...value[0],
        serieId: 'serie-1',
        covers: [
          { id: 'cover-1', url: 'http://storage/works/a.png' },
          { id: 'cover-2', url: 'http://storage/works/b.png' },
        ],
      });
      fileService.keyFromUrl.mockImplementation((url: string) =>
        url.replace('http://storage/', ''),
      );

      await service.delete({ id: 'work-1' });

      expect(fileService.deleteImage).toHaveBeenCalledWith('works/a.png');
      expect(fileService.deleteImage).toHaveBeenCalledWith('works/b.png');
      expect(seriesService.invalidateCache).toHaveBeenCalledWith('serie-1');
    });

    it('não deveria deletar o arquivo quando a url não tem chave', async () => {
      workRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      workRepository.findOne.mockResolvedValue({
        ...value[0],
        covers: [{ id: 'cover-1', url: 'url-invalida' }],
      });
      fileService.keyFromUrl.mockReturnValue(null);

      await service.delete({ id: 'work-1' });

      expect(fileService.deleteImage).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      name: 'A obra',
      mediaId: 'media-1',
      languageId: 'lang-1',
      serieId: 'serie-1',
      authors: ['author-1'],
      illustrators: ['illustrator-1'],
    } as CreateWorkDto;

    beforeEach(() => {
      workRepository.exists.mockResolvedValue(false);
      entityManager.create.mockImplementation(
        (_entity: unknown, data: unknown) => data,
      );
      entityManager.save
        .mockResolvedValueOnce({ id: 'work-1' })
        .mockResolvedValue([]);
      entityManager.findOne.mockResolvedValue(value[0]);
    });

    it('deveria criar uma nova obra com autores e ilustradores', async () => {
      const result = await service.create(dto);

      expect(mediasService.validateExists).toHaveBeenCalledWith({
        id: 'media-1',
      });
      expect(languagesService.validateExists).toHaveBeenCalledWith({
        id: 'lang-1',
      });
      expect(authorsService.ensureAllExist).toHaveBeenCalledWith(['author-1']);
      expect(illustratorsService.ensureAllExist).toHaveBeenCalledWith([
        'illustrator-1',
      ]);

      expect(entityManager.create).toHaveBeenCalledWith(
        Work,
        expect.objectContaining({ name: 'A obra', mediaId: 'media-1' }),
      );
      expect(entityManager.create).toHaveBeenCalledWith(WorkAuthor, {
        workId: 'work-1',
        authorId: 'author-1',
      });
      expect(entityManager.create).toHaveBeenCalledWith(WorkIllustrator, {
        workId: 'work-1',
        illustratorId: 'illustrator-1',
      });

      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
      expect(seriesService.invalidateCache).toHaveBeenCalledWith('serie-1');
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar ConflictException quando o volume já existe na serie', async () => {
      workRepository.exists.mockResolvedValue(true);

      await expect(service.create({ ...dto, volume: 1 })).rejects.toThrow(
        ConflictException,
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('deveria criar apenas a obra quando não há autores nem ilustradores', async () => {
      await service.create({
        ...dto,
        authors: [],
        illustrators: [],
      });

      expect(authorsService.ensureAllExist).not.toHaveBeenCalled();
      expect(illustratorsService.ensureAllExist).not.toHaveBeenCalled();
      expect(entityManager.create).toHaveBeenCalledTimes(1);
      expect(entityManager.save).toHaveBeenCalledTimes(1);
    });

    it('deveria lançar ConflictException quando o volumeName já existe na serie', async () => {
      workRepository.exists.mockResolvedValue(true);

      await expect(
        service.create({ ...dto, volumeName: 'Especial' }),
      ).rejects.toThrow(ConflictException);

      expect(workRepository.exists).toHaveBeenCalledWith({
        where: { serieId: 'serie-1', volumeName: 'Especial' },
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const work = {
      id: 'work-1',
      name: 'A obra',
      serieId: 'serie-1',
      volume: 1,
      covers: [],
      workAuthors: [{ authorId: 'author-1' }, { authorId: 'author-2' }],
      workIllustrators: [{ illustratorId: 'illustrator-1' }],
    };

    beforeEach(() => {
      workRepository.findOne.mockResolvedValue(work);
      entityManager.create.mockImplementation(
        (_entity: unknown, data: unknown) => data,
      );
      entityManager.findOne.mockResolvedValue(value[0]);
    });

    it('deveria atualizar a obra e retornar o objeto atualizado', async () => {
      const result = await service.update('work-1', { name: 'Outro nome' });

      expect(entityManager.update).toHaveBeenCalledWith(
        Work,
        { id: 'work-1' },
        { name: 'Outro nome' },
      );
      expect(entityManager.delete).not.toHaveBeenCalled();
      expect(entityManager.save).not.toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
      expect(seriesService.invalidateCache).toHaveBeenCalledWith('serie-1');
      expect(result).toEqual(value[0]);
    });

    it('deveria adicionar e remover autores e ilustradores', async () => {
      await service.update('work-1', {
        authors: ['author-2', 'author-3'],
        illustrators: [],
      });

      expect(entityManager.delete).toHaveBeenCalledWith(WorkAuthor, {
        workId: 'work-1',
        authorId: In(['author-1']),
      });
      expect(entityManager.create).toHaveBeenCalledWith(WorkAuthor, {
        workId: 'work-1',
        authorId: 'author-3',
      });
      expect(entityManager.delete).toHaveBeenCalledWith(WorkIllustrator, {
        workId: 'work-1',
        illustratorId: In(['illustrator-1']),
      });
      expect(entityManager.create).not.toHaveBeenCalledWith(
        WorkIllustrator,
        expect.anything(),
      );
      expect(entityManager.update).toHaveBeenCalledWith(
        Work,
        { id: 'work-1' },
        {},
      );
    });

    it('deveria manter os ilustradores atuais e adicionar os novos', async () => {
      await service.update('work-1', {
        illustrators: ['illustrator-1', 'illustrator-2'],
      });

      expect(entityManager.delete).not.toHaveBeenCalled();
      expect(entityManager.create).toHaveBeenCalledWith(WorkIllustrator, {
        workId: 'work-1',
        illustratorId: 'illustrator-2',
      });
      expect(entityManager.save).toHaveBeenCalledWith([
        { workId: 'work-1', illustratorId: 'illustrator-2' },
      ]);
    });

    it('deveria lançar ConflictException quando o volume já pertence a outra obra da serie', async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 'work-2' });

      await expect(service.update('work-1', { volume: 2 })).rejects.toThrow(
        ConflictException,
      );

      expect(entityManager.update).not.toHaveBeenCalled();
    });

    it('não deveria acusar conflito quando o volume é da própria obra', async () => {
      entityManager.findOne
        .mockResolvedValueOnce({ id: 'work-1' })
        .mockResolvedValueOnce(value[0]);

      const result = await service.update('work-1', { volume: 2 });

      expect(entityManager.findOne).toHaveBeenCalledWith(Work, {
        where: { serieId: 'serie-1', volume: 2 },
      });
      expect(entityManager.update).toHaveBeenCalledWith(
        Work,
        { id: 'work-1' },
        { volume: 2 },
      );
      expect(result).toEqual(value[0]);
    });

    it('não deveria validar volume quando a obra não tem serie', async () => {
      workRepository.findOne.mockResolvedValue({
        ...work,
        serieId: null,
        volume: null,
      });

      await service.update('work-1', { name: 'Outro nome' });

      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
      expect(seriesService.invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deveria retornar tudo sem filtro já paginado usando os padrões', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 3]);

      const result = await service.findAll({});

      expect(queryBuilder.take).toHaveBeenCalledWith(30);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: value,
        total: 3,
        pages: 1,
        current_page: 1,
      });
    });

    it('deveria calcular pages e current_page fora da primeira página', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 65]);

      const result = await service.findAll({ take: 30, skip: 30 });

      expect(result).toMatchObject({ total: 65, pages: 3, current_page: 2 });
    });

    it('deveria aplicar os filtros de nome, media, idioma e edição especial', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[value[0]], 1]);

      await service.findAll({
        name: 'obra',
        mediaIds: ['media-1'],
        languageIds: ['lang-1'],
        isSpecialEdition: false,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'work.name ILIKE :name',
        {
          name: '%obra%',
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'media.id IN (:...mediaIds)',
        { mediaIds: ['media-1'] },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'language.id IN (:...languageIds)',
        { languageIds: ['lang-1'] },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'work.isSpecialEdition = :isSpecialEdition',
        { isSpecialEdition: false },
      );
    });

    it('deveria aplicar os filtros de autor e ilustrador por subquery', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[value[0]], 1]);

      await service.findAll({
        authorIds: ['author-1'],
        illustratorIds: ['illustrator-1'],
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Function), {
        authorIds: ['author-1'],
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Function), {
        illustratorIds: ['illustrator-1'],
      });
      expect(subQueryBuilder.from).toHaveBeenCalledWith(WorkAuthor, 'wa');
      expect(subQueryBuilder.from).toHaveBeenCalledWith(WorkIllustrator, 'wi');
      expect(subQueryBuilder.andWhere).toHaveBeenCalledWith(
        'wa.authorId IN (:...authorIds)',
      );
      expect(subQueryBuilder.andWhere).toHaveBeenCalledWith(
        'wi.illustratorId IN (:...illustratorIds)',
      );
    });
  });

  describe('addCover', () => {
    const file = { originalname: 'capa.png' } as Express.Multer.File;

    beforeEach(() => {
      workRepository.findOne.mockResolvedValue({
        ...value[0],
        serieId: 'serie-1',
      });
      fileService.uploadImage.mockResolvedValue({
        url: 'http://storage/works/capa.png',
      });
      coverRepository.create.mockImplementation((data: unknown) => data);
    });

    it('deveria enviar a imagem e criar a capa na próxima posição', async () => {
      coverQueryBuilder.getRawOne.mockResolvedValue({ max: 2 });

      const result = await service.addCover('work-1', file, true);

      expect(fileService.uploadImage).toHaveBeenCalledWith(
        file,
        expect.stringMatching(/^works\//),
      );
      expect(coverRepository.create).toHaveBeenCalledWith({
        workId: 'work-1',
        url: 'http://storage/works/capa.png',
        isSpecialEdition: true,
        order: 3,
      });
      expect(coverRepository.save).toHaveBeenCalled();
      expect(seriesService.invalidateCache).toHaveBeenCalledWith('serie-1');
      expect(result).toEqual({ ...value[0], serieId: 'serie-1' });
    });

    it('deveria usar a posição 1 quando a obra não tem capas', async () => {
      coverQueryBuilder.getRawOne.mockResolvedValue({ max: null });

      await service.addCover('work-1', file);

      expect(coverRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 1, isSpecialEdition: false }),
      );
    });

    it('deveria lançar NotFoundException quando a obra não existe', async () => {
      workRepository.findOne.mockResolvedValue(null);

      await expect(service.addCover('nao-existo', file)).rejects.toThrow(
        NotFoundException,
      );

      expect(fileService.uploadImage).not.toHaveBeenCalled();
    });
  });

  describe('removeCover', () => {
    it('deveria remover a capa e o arquivo do storage', async () => {
      coverRepository.findOne.mockResolvedValue({
        id: 'cover-1',
        url: 'http://storage/works/capa.png',
      });
      workRepository.findOne.mockResolvedValue({
        ...value[0],
        serieId: 'serie-1',
      });
      fileService.keyFromUrl.mockReturnValue('works/capa.png');

      const result = await service.removeCover('work-1', 'cover-1');

      expect(coverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cover-1', workId: 'work-1' },
      });
      expect(coverRepository.delete).toHaveBeenCalledWith({ id: 'cover-1' });
      expect(fileService.deleteImage).toHaveBeenCalledWith('works/capa.png');
      expect(seriesService.invalidateCache).toHaveBeenCalledWith('serie-1');
      expect(result).toEqual({ ...value[0], serieId: 'serie-1' });
    });

    it('deveria lançar NotFoundException quando a capa não existe', async () => {
      coverRepository.findOne.mockResolvedValue(null);

      await expect(service.removeCover('work-1', 'nao-existo')).rejects.toThrow(
        NotFoundException,
      );

      expect(coverRepository.delete).not.toHaveBeenCalled();
      expect(fileService.deleteImage).not.toHaveBeenCalled();
    });
  });
});
