import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { IllustratorsController } from './illustrators.controller';
import { IllustratorsService } from './illustrators.service';
import { ResponseIllustratorDto } from './dto/response-illustrator.dto';
import { PaginatedIllustratorResponse } from './dto/paginated-illustrator.dto';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';

describe('IllustratorsController', () => {
  let controller: IllustratorsController;
  let illustratorService: {
    create: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    findAllByName: jest.Mock;
    findOneByCache: jest.Mock;
  };
  const value: ResponseIllustratorDto[] = [
    { id: 'illustrator-1', name: 'O ilustrador' },
    { id: 'illustrator-2', name: 'Qualquer coisa' },
    { id: 'illustrator-3', name: 'A grande coisa' },
  ];

  const paginatedValue: PaginatedIllustratorResponse = {
    data: value,
    current_page: 1,
    pages: 1,
    total: 15,
  };

  beforeEach(async () => {
    illustratorService = {
      findAllByName: jest.fn(),
      findOneByCache: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IllustratorsController],
      providers: [
        { provide: IllustratorsService, useValue: illustratorService },
      ],
    }).compile();

    controller = module.get<IllustratorsController>(IllustratorsController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar a lista de ilustradores paginada', async () => {
      illustratorService.findAllByName.mockResolvedValue(paginatedValue);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(illustratorService.findAllByName).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedValue);
    });

    it('deveria repassar skip, take e name para o service', async () => {
      illustratorService.findAllByName.mockResolvedValue(paginatedValue);

      await controller.findAll({ skip: 0, take: 15, name: '1' });

      expect(illustratorService.findAllByName).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        name: '1',
      });
    });
  });

  describe('findOne', () => {
    it('deveria retornar o ilustrador pelo id', async () => {
      illustratorService.findOneByCache.mockResolvedValue(value[0]);

      const result = await controller.findOne('illustrator-1');

      expect(illustratorService.findOneByCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o ilustrador não existe', async () => {
      illustratorService.findOneByCache.mockRejectedValue(
        new NotFoundException('Illustrator não encontrado'),
      );

      await expect(controller.findOne('nao-existo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar o ilustrador criado', async () => {
      illustratorService.create.mockResolvedValue(value[0]);
      const dto: CreateIllustratorDto = { name: 'illustrator-1' };

      const result = await controller.create(dto);

      expect(illustratorService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'illustrator-1' }),
      );
      expect(illustratorService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso o nome for igual', async () => {
      illustratorService.create.mockRejectedValue(
        new ConflictException('Illustrator já existe'),
      );

      const dto: CreateIllustratorDto = { name: 'illustrator-1' };

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deveria remover o ilustrador pelo id', async () => {
      illustratorService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('illustrator-1');

      expect(illustratorService.delete).toHaveBeenCalledWith({
        id: 'illustrator-1',
      });
      expect(illustratorService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o ilustrador não existe', async () => {
      illustratorService.delete.mockRejectedValue(
        new NotFoundException('Illustrator não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateIllustratorDto = { name: 'O novo dado' };
      const atualizado = { ...value[0], name: dto.name };
      illustratorService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('illustrator-1', dto);

      expect(illustratorService.update).toHaveBeenCalledTimes(1);
      expect(illustratorService.update).toHaveBeenCalledWith(
        'illustrator-1',
        dto,
      );
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando o ilustrador não existe', async () => {
      const dto: UpdateIllustratorDto = { name: 'O novo dado' };

      illustratorService.update.mockRejectedValue(
        new NotFoundException('Illustrator não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deveria propagar ConflictException ao tentar colocar um nome que já existe', async () => {
      illustratorService.update.mockRejectedValue(
        new ConflictException('Illustrator já existe'),
      );

      const dto: UpdateIllustratorDto = { name: 'illustrator-1' };

      await expect(controller.update('illustrator-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
