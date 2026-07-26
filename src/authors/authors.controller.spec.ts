import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { ResponseAuthorDto } from './dto/response-author.dto';
import { PaginatedAuthorResponse } from './dto/pagination-author.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

describe('AuthorsController', () => {
  let controller: AuthorsController;
  let authorService: {
    create: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    findAllByName: jest.Mock;
    findOneByCache: jest.Mock;
  };
  const value: ResponseAuthorDto[] = [
    { id: 'author-1', name: 'A autora' },
    { id: 'author-2', name: 'Qualquer coisa' },
    { id: 'author-3', name: 'A grande coisa' },
  ];

  const paginatedValue: PaginatedAuthorResponse = {
    data: value,
    current_page: 1,
    pages: 1,
    total: 15,
  };

  beforeEach(async () => {
    authorService = {
      findAllByName: jest.fn(),
      findOneByCache: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [{ provide: AuthorsService, useValue: authorService }],
    }).compile();

    controller = module.get<AuthorsController>(AuthorsController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar a lista de autores paginada', async () => {
      authorService.findAllByName.mockResolvedValue(paginatedValue);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(authorService.findAllByName).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedValue);
    });

    it('deveria repassar skip, take e name para o service', async () => {
      authorService.findAllByName.mockResolvedValue(paginatedValue);

      await controller.findAll({ skip: 0, take: 15, name: '1' });

      expect(authorService.findAllByName).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        name: '1',
      });
    });
  });

  describe('findOne', () => {
    it('deveria retornar o autor pelo id', async () => {
      authorService.findOneByCache.mockResolvedValue(value[0]);

      const result = await controller.findOne('author-1');

      expect(authorService.findOneByCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o autor não existe', async () => {
      authorService.findOneByCache.mockRejectedValue(
        new NotFoundException('Author não encontrado'),
      );

      await expect(controller.findOne('nao-existo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar o autor criado', async () => {
      authorService.create.mockResolvedValue(value[0]);
      const dto: CreateAuthorDto = { name: 'author-1' };

      const result = await controller.create(dto);

      expect(authorService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'author-1' }),
      );
      expect(authorService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso o nome for igual', async () => {
      authorService.create.mockRejectedValue(
        new ConflictException('Author já existe'),
      );

      const dto: CreateAuthorDto = { name: 'author-1' };

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deveria remover o autor pelo id', async () => {
      authorService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('author-1');

      expect(authorService.delete).toHaveBeenCalledWith({ id: 'author-1' });
      expect(authorService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o autor não existe', async () => {
      authorService.delete.mockRejectedValue(
        new NotFoundException('Author não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateAuthorDto = { name: 'O novo dado' };
      const atualizado = { ...value[0], name: dto.name };
      authorService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('author-1', dto);

      expect(authorService.update).toHaveBeenCalledTimes(1);
      expect(authorService.update).toHaveBeenCalledWith('author-1', dto);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando o autor não existe', async () => {
      const dto: UpdateAuthorDto = { name: 'O novo dado' };

      authorService.update.mockRejectedValue(
        new NotFoundException('Author não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deveria propagar ConflictException ao tentar colocar um nome que já existe', async () => {
      authorService.update.mockRejectedValue(
        new ConflictException('Author já existe'),
      );

      const dto: UpdateAuthorDto = { name: 'author-1' };

      await expect(controller.update('author-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
