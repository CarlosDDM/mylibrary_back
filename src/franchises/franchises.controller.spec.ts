import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FranchisesController } from './franchises.controller';
import { FranchisesService } from './franchises.service';
import { ResponseFranchiseDto } from './dto/response-franchise.dto';
import { PaginatedFranchiseResponse } from './dto/paginated-franchise.dto';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';

describe('FranchisesController', () => {
  let controller: FranchisesController;
  let franchiseService: {
    create: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    findAllByName: jest.Mock;
    findOneByCache: jest.Mock;
  };
  const value: ResponseFranchiseDto[] = [
    { id: 'franchise-1', name: 'A franquia', series: [] },
    { id: 'franchise-2', name: 'Qualquer coisa', series: [] },
    { id: 'franchise-3', name: 'A grande coisa', series: [] },
  ];

  const paginatedValue: PaginatedFranchiseResponse = {
    data: value,
    current_page: 1,
    pages: 1,
    total: 15,
  };

  beforeEach(async () => {
    franchiseService = {
      findAllByName: jest.fn(),
      findOneByCache: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FranchisesController],
      providers: [{ provide: FranchisesService, useValue: franchiseService }],
    }).compile();

    controller = module.get<FranchisesController>(FranchisesController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar a lista de franquias paginada', async () => {
      franchiseService.findAllByName.mockResolvedValue(paginatedValue);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(franchiseService.findAllByName).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedValue);
    });

    it('deveria repassar skip, take e name para o service', async () => {
      franchiseService.findAllByName.mockResolvedValue(paginatedValue);

      await controller.findAll({ skip: 0, take: 15, name: '1' });

      expect(franchiseService.findAllByName).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        name: '1',
      });
    });
  });

  describe('findOne', () => {
    it('deveria retornar a franquia pelo id', async () => {
      franchiseService.findOneByCache.mockResolvedValue(value[0]);

      const result = await controller.findOne('franchise-1');

      expect(franchiseService.findOneByCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando a franquia não existe', async () => {
      franchiseService.findOneByCache.mockRejectedValue(
        new NotFoundException('Franchise não encontrado'),
      );

      await expect(controller.findOne('nao-existo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar a franquia criada', async () => {
      franchiseService.create.mockResolvedValue(value[0]);
      const dto: CreateFranchiseDto = {
        name: 'franchise-1',
      };

      const result = await controller.create(dto);

      expect(franchiseService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'franchise-1' }),
      );
      expect(franchiseService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso o nome for igual', async () => {
      franchiseService.create.mockRejectedValue(
        new ConflictException('franchise já existe'),
      );

      const dto: CreateFranchiseDto = { name: 'franchise-1' };

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deveria remover a franquia pelo id', async () => {
      franchiseService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('franchise-1');

      expect(franchiseService.delete).toHaveBeenCalledWith({
        id: 'franchise-1',
      });
      expect(franchiseService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando a franquia não existe', async () => {
      franchiseService.delete.mockRejectedValue(
        new NotFoundException('Franchise não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateFranchiseDto = { name: 'O novo dado' };
      const atualizado = { ...value[0], name: dto.name };
      franchiseService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('franchise-1', dto);

      expect(franchiseService.update).toHaveBeenCalledTimes(1);
      expect(franchiseService.update).toHaveBeenCalledWith('franchise-1', dto);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando a franquia não existe', async () => {
      const dto: UpdateFranchiseDto = { name: 'O novo dado' };

      franchiseService.update.mockRejectedValue(
        new NotFoundException('Franchise não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deveria propagar ConflictException ao tentar colocar um nome que já existe', async () => {
      franchiseService.update.mockRejectedValue(
        new ConflictException('franchise já existe'),
      );

      const dto: UpdateFranchiseDto = { name: 'franchise-1' };

      await expect(controller.update('franchise-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
