import { Test, TestingModule } from '@nestjs/testing';
import { FranchisesService } from './franchises.service';
import { CacheService } from 'src/cache/cache.service';
import { Franchise } from './entities/franchise.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResponseFranchiseDto } from './dto/response-franchise.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';

describe('FranchisesService', () => {
  let service: FranchisesService;
  let cacheService: {
    wrap: jest.Mock;
    del: jest.Mock;
    invalidateByPrefix: jest.Mock;
  };

  let franchiseRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findAllByName: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const value: ResponseFranchiseDto[] = [
    { id: 'franchise-1', name: 'A franquia', series: [] },
    { id: 'franchise-2', name: 'Qualquer coisa', series: [] },
    { id: 'franchise-3', name: 'A grande coisa', series: [] },
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

    franchiseRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findAllByName: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    cacheService = {
      wrap: jest.fn((_key, loader: () => unknown) => loader()),
      del: jest.fn(),
      invalidateByPrefix: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchisesService,
        { provide: CacheService, useValue: cacheService },
        {
          provide: getRepositoryToken(Franchise),
          useValue: franchiseRepository,
        },
      ],
    }).compile();

    service = module.get<FranchisesService>(FranchisesService);
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
      expect(franchiseRepository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('to_tsquery'),
        { term: 'coisa' },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('sem name, busca sem where de nome', async () => {
      franchiseRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllByName({ take: 20, skip: 0 });
      expect(franchiseRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('calcula pages e current_page fora da primeira página', async () => {
      franchiseRepository.findAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAllByName({ take: 20, skip: 20 });

      expect(result).toMatchObject({ total: 45, pages: 3, current_page: 2 });
    });

    it('pagina corretamente quando não há resultados', async () => {
      franchiseRepository.findAndCount.mockResolvedValue([[], 0]);

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
    it('deveria buscar franquia por id e retornar', async () => {
      franchiseRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'franchise-1' });

      expect(franchiseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'franchise-1' },
        relations: { series: true },
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando a franquia não existe', async () => {
      franchiseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id e retornar o objeto deletado', async () => {
      franchiseRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      franchiseRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'franchise-1' });

      expect(franchiseRepository.delete).toHaveBeenCalledWith({
        id: 'franchise-1',
      });
      expect(result).toEqual(value[0]);
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
    });

    it('deveria lançar NotFoundException quando a franquia não existe ao deletar', async () => {
      franchiseRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(franchiseRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deveria atualizar a franquia quando o nome muda', async () => {
      const dto = { name: 'qualquer coisa' };
      const valorUptd = { ...value[0], name: dto.name };
      franchiseRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(valorUptd);
      franchiseRepository.exists.mockResolvedValue(false);
      franchiseRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      const result = await service.update('franchise-1', dto);

      expect(franchiseRepository.update).toHaveBeenCalledWith(
        { id: 'franchise-1' },
        dto,
      );
      expect(result).toEqual(valorUptd);
      expect(franchiseRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('deveria lançar NotFoundException quando a franquia não existe ao atualizar', async () => {
      const dto = { name: 'qualquer coisa' };
      franchiseRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nao-existo', dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(franchiseRepository.findOne).toHaveBeenCalledTimes(1);
      expect(franchiseRepository.exists).not.toHaveBeenCalled();
      expect(franchiseRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o novo nome já existe', async () => {
      const dto = { name: 'A grande coisa' };
      franchiseRepository.findOne.mockResolvedValue(value[0]);
      franchiseRepository.exists.mockResolvedValue(true);

      await expect(service.update('franchise-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(franchiseRepository.findOne).toHaveBeenCalledTimes(1);
      expect(franchiseRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A grande coisa' },
      });
      expect(franchiseRepository.update).not.toHaveBeenCalled();
    });

    it('deveria atualizar sem validar unicidade quando o nome não muda', async () => {
      const dto = { name: value[0].name };
      franchiseRepository.findOne
        .mockResolvedValueOnce(value[0])
        .mockResolvedValueOnce(value[0]);
      franchiseRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      const result = await service.update('franchise-1', dto);

      expect(result).toEqual(value[0]);
      expect(franchiseRepository.exists).not.toHaveBeenCalled();
      expect(franchiseRepository.update).toHaveBeenCalledWith(
        { id: 'franchise-1' },
        dto,
      );
      expect(franchiseRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('create', () => {
    it('deveria criar uma nova franquia', async () => {
      franchiseRepository.save.mockResolvedValue({ id: 'franchise-1' });
      franchiseRepository.findOne.mockResolvedValue(value[0]);
      franchiseRepository.exists.mockResolvedValue(false);

      const dto = { name: 'A franquia' };

      const result = await service.create(dto);

      expect(result).toEqual(value[0]);
      expect(franchiseRepository.save).toHaveBeenCalledWith(dto);
      expect(franchiseRepository.exists).toHaveBeenCalledTimes(1);
      expect(franchiseRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A franquia' },
      });
      expect(franchiseRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'franchise-1',
        },
        relations: { series: true },
      });
      expect(cacheService.invalidateByPrefix).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalledWith(DASHBOARD_STATS_KEY);
    });

    it('deveria lançar ConflictException quando o nome já existe', async () => {
      franchiseRepository.exists.mockResolvedValue(true);

      const dto = { name: 'A franquia' };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(franchiseRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A franquia' },
      });
      expect(franchiseRepository.save).not.toHaveBeenCalled();
      expect(franchiseRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
