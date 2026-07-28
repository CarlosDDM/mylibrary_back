import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';

describe('WorksController', () => {
  let controller: WorksController;
  let worksService: {
    create: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    findAll: jest.Mock;
    findOneById: jest.Mock;
    addCover: jest.Mock;
    removeCover: jest.Mock;
  };

  const value = [
    { id: 'work-1', name: 'A obra' },
    { id: 'work-2', name: 'Qualquer coisa' },
    { id: 'work-3', name: 'A grande coisa' },
  ];

  const paginatedValue = {
    data: value,
    current_page: 1,
    pages: 1,
    total: 15,
  };

  beforeEach(async () => {
    worksService = {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      addCover: jest.fn(),
      removeCover: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksController],
      providers: [{ provide: WorksService, useValue: worksService }],
    }).compile();

    controller = module.get<WorksController>(WorksController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar a lista de obras paginada', async () => {
      worksService.findAll.mockResolvedValue(paginatedValue);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(worksService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedValue);
    });

    it('deveria repassar os filtros para o service', async () => {
      worksService.findAll.mockResolvedValue(paginatedValue);

      const filter = {
        skip: 0,
        take: 15,
        name: '1',
        mediaIds: ['media-1'],
        isSpecialEdition: true,
      };

      await controller.findAll(filter);

      expect(worksService.findAll).toHaveBeenCalledWith(filter);
    });
  });

  describe('findOne', () => {
    it('deveria retornar a obra pelo id', async () => {
      worksService.findOneById.mockResolvedValue(value[0]);

      const result = await controller.findOne('work-1');

      expect(worksService.findOneById).toHaveBeenCalledTimes(1);
      expect(worksService.findOneById).toHaveBeenCalledWith('work-1');
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando a obra não existe', async () => {
      worksService.findOneById.mockRejectedValue(
        new NotFoundException('Work não encontrado'),
      );

      await expect(controller.findOne('nao-existo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar a obra criada', async () => {
      worksService.create.mockResolvedValue(value[0]);
      const dto: CreateWorkDto = {
        name: 'A obra',
        mediaId: 'media-1',
        languageId: 'language-1',
      };

      const result = await controller.create(dto);

      expect(worksService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'A obra' }),
      );
      expect(worksService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso a obra já exista', async () => {
      worksService.create.mockRejectedValue(
        new ConflictException('work já existe'),
      );

      const dto = {
        name: 'A obra',
        mediaId: 'media-1',
        languageId: 'language-1',
      } as CreateWorkDto;

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deveria remover a obra pelo id', async () => {
      worksService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('work-1');

      expect(worksService.delete).toHaveBeenCalledWith({ id: 'work-1' });
      expect(worksService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando a obra não existe', async () => {
      worksService.delete.mockRejectedValue(
        new NotFoundException('Work não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateWorkDto = { name: 'O novo dado' };
      const atualizado = { ...value[0], name: dto.name };
      worksService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('work-1', dto);

      expect(worksService.update).toHaveBeenCalledTimes(1);
      expect(worksService.update).toHaveBeenCalledWith('work-1', dto);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando a obra não existe', async () => {
      const dto: UpdateWorkDto = { name: 'O novo dado' };

      worksService.update.mockRejectedValue(
        new NotFoundException('Work não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cover', () => {
    const file = {
      originalname: 'cover.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
    } as Express.Multer.File;

    it('deveria repassar a imagem, dto e id para adicionar um novo cover', async () => {
      worksService.addCover.mockResolvedValue(value[0]);

      const result = await controller.addCover('work-1', file, {
        isSpecialEdition: false,
      });

      expect(result).toEqual(value[0]);
      expect(worksService.addCover).toHaveBeenCalledWith('work-1', file, false);
    });

    it('deveria propagar NotFoundException quando repassar id que não existe', async () => {
      worksService.addCover.mockRejectedValue(
        new NotFoundException('Work não encontrado'),
      );

      await expect(
        controller.addCover('nao-existo', file, {
          isSpecialEdition: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deveria repassar o id e remover uma capa', async () => {
      const semCapas = { ...value[0], covers: [] };
      worksService.removeCover.mockResolvedValue(semCapas);

      const result = await controller.removeCover('work-1', 'cover-1');

      expect(result).toEqual(semCapas);
      expect(worksService.removeCover).toHaveBeenCalledWith(
        'work-1',
        'cover-1',
      );
    });

    it('deveria propagar NotFoundException quando a capa não existe', async () => {
      worksService.removeCover.mockRejectedValue(
        new NotFoundException('Capa não encontrada'),
      );

      await expect(
        controller.removeCover('work-1', 'nao-existo'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
