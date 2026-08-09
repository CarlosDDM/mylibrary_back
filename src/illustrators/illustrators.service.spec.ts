import { Test, TestingModule } from '@nestjs/testing';
import { IllustratorsService } from './illustrators.service';
import { CacheService } from 'src/cache/cache.service';
import { Illustrator } from './entities/illustrator.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResponseIllustratorDto } from './dto/response-illustrator.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';

describe('IllustratorsService', () => {
  let service: IllustratorsService;
  let cacheService: {
    wrap: jest.Mock;
    del: jest.Mock;
    invalidateByPrefix: jest.Mock;
  };

  let illustratorRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };

  const value: ResponseIllustratorDto[] = [
    { id: 'illustrator-1', name: 'O ilustrador' },
    { id: 'illustrator-2', name: 'Qualquer coisa' },
    { id: 'illustrator-3', name: 'A grande coisa' },
  ];

  let queryBuilder: {
    where: jest.Mock;
    take: jest.Mock;
    skip: jest.Mock;
    setFindOptions: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      setFindOptions: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    illustratorRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    cacheService = {
      wrap: jest.fn((_key, loader: () => unknown) => loader()),
      del: jest.fn(),
      invalidateByPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IllustratorsService,
        { provide: CacheService, useValue: cacheService },
        {
          provide: getRepositoryToken(Illustrator),
          useValue: illustratorRepository,
        },
      ],
    }).compile();

    service = module.get<IllustratorsService>(IllustratorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByName', () => {
    it('busca por full text quando tem name e retorna paginado', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([value, 2]);

      const result = await service.findAllByName({
        name: 'coisa',
        take: 20,
        skip: 0,
      });

      expect(result).toEqual({
        data: value,
        total: 2,
        pages: 1,
        current_page: 1,
      });
      expect(illustratorRepository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('to_tsquery'),
        { term: 'coisa' },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('sem name, busca sem where de nome', async () => {
      illustratorRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllByName({ take: 20, skip: 0 });
      expect(illustratorRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('calcula pages e current_page fora da primeira página', async () => {
      illustratorRepository.findAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAllByName({ take: 20, skip: 20 });

      expect(result).toMatchObject({ total: 45, pages: 3, current_page: 2 });
    });

    it('pagina corretamente quando não há resultados', async () => {
      illustratorRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllByName({ take: 20, skip: 0 });

      expect(result).toEqual({
        data: [],
        total: 0,
        pages: 0,
        current_page: 1,
      });
    });
  });

  describe('findOne', () => {
    it('deveria buscar ilustrador por id e retornar', async () => {
      illustratorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'illustrator-1' });

      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'illustrator-1' },
        relations: undefined,
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando o ilustrador não existe', async () => {
      illustratorRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id e retornar o objeto deletado', async () => {
      illustratorRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      illustratorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'illustrator-1' });

      expect(illustratorRepository.delete).toHaveBeenCalledWith({
        id: 'illustrator-1',
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando o ilustrador não existe ao deletar', async () => {
      illustratorRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(illustratorRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deveria atualizar o objeto e retornar o novo valor', async () => {
      const dto: UpdateIllustratorDto = { name: 'novo ilustrador' };
      const updatedIllustrator = { ...value[0], name: dto.name };
      illustratorRepository.update.mockResolvedValue(updatedIllustrator);
      illustratorRepository.exists.mockResolvedValue(false);
      illustratorRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(updatedIllustrator);

      const result = await service.update('illustrator-1', dto);

      expect(result).toEqual(updatedIllustrator);
      expect(illustratorRepository.update).toHaveBeenCalledWith(
        { id: 'illustrator-1' },
        dto,
      );
      expect(illustratorRepository.findOne).toHaveBeenCalledTimes(2);
      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'illustrator-1',
        },
      });
    });

    it('deveria lançar NotFoundException quando o ilustrador não existe ao atualizar', async () => {
      const dto: UpdateIllustratorDto = { name: 'novo ilustrador' };

      illustratorRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nao_tem', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nao_tem' },
      });
      expect(illustratorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(illustratorRepository.exists).not.toHaveBeenCalled();
      expect(illustratorRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o novo nome já existe', async () => {
      const dto: UpdateIllustratorDto = { name: 'Qualquer coisa' };

      illustratorRepository.findOne.mockResolvedValue(value[0]);
      illustratorRepository.exists.mockResolvedValue(true);

      await expect(service.update('illustrator-1', dto)).rejects.toThrow(
        ConflictException,
      );

      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'illustrator-1' },
      });
      expect(illustratorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(illustratorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'Qualquer coisa' },
      });
      expect(illustratorRepository.update).not.toHaveBeenCalled();
    });

    it('não deveria atualizar quando o nome não muda e retorna o valor atual', async () => {
      illustratorRepository.findOne.mockResolvedValue(value[0]);
      const dto: UpdateIllustratorDto = { name: 'O ilustrador' };

      const result = await service.update('illustrator-1', dto);

      expect(result).toEqual(value[0]);
      expect(illustratorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'illustrator-1' },
      });
      expect(illustratorRepository.exists).not.toHaveBeenCalled();
      expect(illustratorRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deveria criar um novo ilustrador', async () => {
      const dto: CreateIllustratorDto = { name: 'O ilustrador' };
      illustratorRepository.save.mockResolvedValue({ id: 'illustrator-1' });
      illustratorRepository.exists.mockResolvedValue(false);
      illustratorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.create(dto);

      expect(result).toEqual(value[0]);
      expect(illustratorRepository.exists).toHaveBeenCalledTimes(1);
      expect(illustratorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'O ilustrador' },
      });
      expect(illustratorRepository.save).toHaveBeenCalledWith(dto);
      expect(illustratorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'illustrator-1' },
      });
      expect(cacheService.invalidateByPrefix).toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o nome já existe', async () => {
      const dto: CreateIllustratorDto = { name: 'O ilustrador' };
      illustratorRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(illustratorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'O ilustrador' },
      });
      expect(illustratorRepository.save).not.toHaveBeenCalled();
      expect(illustratorRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
