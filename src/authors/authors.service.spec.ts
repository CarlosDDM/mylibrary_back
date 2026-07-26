import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsService } from './authors.service';
import { CacheService } from 'src/cache/cache.service';
import { Author } from './entities/author.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResponseAuthorDto } from './dto/response-author.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { CreateAuthorDto } from './dto/create-author.dto';

describe('AuthorsService', () => {
  let service: AuthorsService;
  let cacheService: {
    wrap: jest.Mock;
    del: jest.Mock;
    invalidateByPrefix: jest.Mock;
  };

  let authorRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };

  const value: ResponseAuthorDto[] = [
    { id: 'author-1', name: 'A autora' },
    { id: 'author-2', name: 'Qualquer coisa' },
    { id: 'author-3', name: 'A grande coisa' },
  ];

  beforeEach(async () => {
    authorRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
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
        AuthorsService,
        { provide: CacheService, useValue: cacheService },
        {
          provide: getRepositoryToken(Author),
          useValue: authorRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByName', () => {
    it('busca com ILike quando tem name e retorna paginado', async () => {
      authorRepository.findAndCount.mockResolvedValue([value, 2]);

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
      expect(authorRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: expect.anything() }, // ILike('%coisa%')
          take: 20,
          skip: 0,
        }),
      );
    });

    it('sem name, busca sem where de nome', async () => {
      authorRepository.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllByName({ take: 20, skip: 0 });
      expect(authorRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('calcula pages e current_page fora da primeira página', async () => {
      authorRepository.findAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAllByName({ take: 20, skip: 20 });

      expect(result).toMatchObject({ total: 45, pages: 3, current_page: 2 });
    });

    it('pagina corretamente quando não há resultados', async () => {
      authorRepository.findAndCount.mockResolvedValue([[], 0]);

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
    it('deveria buscar autor por id e retornar', async () => {
      authorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'author-1' });

      expect(authorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
        relations: undefined,
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando o autor não existe', async () => {
      authorRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id e retornar o objeto deletado', async () => {
      authorRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      authorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'author-1' });

      expect(authorRepository.delete).toHaveBeenCalledWith({
        id: 'author-1',
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando o autor não existe ao deletar', async () => {
      authorRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(authorRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deveria atualizar o autor e retornar o novo valor', async () => {
      const dto: UpdateAuthorDto = { name: 'novo autor' };
      const updatedAuthor = { ...value[0], name: dto.name };
      authorRepository.exists.mockResolvedValue(false);
      authorRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      authorRepository.findOne
        .mockResolvedValueOnce(value[0]) // 1ª chamada: estado atual (compara nome)
        .mockResolvedValueOnce(updatedAuthor); // 2ª chamada: retorno final

      const result = await service.update('author-1', dto);

      expect(result).toEqual(updatedAuthor);
      expect(authorRepository.update).toHaveBeenCalledWith(
        { id: 'author-1' },
        dto,
      );
      expect(authorRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('deveria lançar NotFoundException quando o autor não existe ao atualizar', async () => {
      const dto: UpdateAuthorDto = { name: 'novo autor' };
      authorRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nao-existo', dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(authorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(authorRepository.exists).not.toHaveBeenCalled();
      expect(authorRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o novo nome já existe', async () => {
      const dto: UpdateAuthorDto = { name: 'Qualquer coisa' };
      authorRepository.findOne.mockResolvedValue(value[0]);
      authorRepository.exists.mockResolvedValue(true);

      await expect(service.update('author-1', dto)).rejects.toThrow(
        ConflictException,
      );

      expect(authorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(authorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'Qualquer coisa' },
      });
      expect(authorRepository.update).not.toHaveBeenCalled();
    });

    it('não deveria atualizar quando o nome não muda e retorna o valor atual', async () => {
      const dto: UpdateAuthorDto = { name: value[0].name };
      authorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.update('author-1', dto);

      expect(result).toEqual(value[0]);
      expect(authorRepository.findOne).toHaveBeenCalledTimes(1);
      expect(authorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
      });
      expect(authorRepository.exists).not.toHaveBeenCalled();
      expect(authorRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('deveria criar um novo autor', async () => {
      const dto: CreateAuthorDto = { name: 'A autora' };
      authorRepository.save.mockResolvedValue({ id: 'author-1' });
      authorRepository.exists.mockResolvedValue(false);
      authorRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.create(dto);

      expect(result).toEqual(value[0]);
      expect(authorRepository.exists).toHaveBeenCalledTimes(1);
      expect(authorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A autora' },
      });
      expect(authorRepository.save).toHaveBeenCalledWith(dto);
      expect(authorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'author-1' },
      });
      expect(cacheService.invalidateByPrefix).toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o nome já existe', async () => {
      const dto: CreateAuthorDto = { name: 'A autora' };
      authorRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(authorRepository.exists).toHaveBeenCalledWith({
        where: { name: 'A autora' },
      });
      expect(authorRepository.save).not.toHaveBeenCalled();
      expect(authorRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
