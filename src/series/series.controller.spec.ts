import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

describe('SeriesController', () => {
  let controller: SeriesController;
  let serieService: {
    findAll: jest.Mock;
    findOneById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    setCover: jest.Mock;
    removeCover: jest.Mock;
  };

  const value = [
    { id: 'serie-1', name: 'A serie' },
    { id: 'serie-2', name: 'O serie' },
    { id: 'serie-3', name: 'I serie' },
  ];

  beforeEach(async () => {
    serieService = {
      findAll: jest.fn(),
      findOneById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      setCover: jest.fn(),
      removeCover: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeriesController],
      providers: [{ provide: SeriesService, useValue: serieService }],
    }).compile();

    controller = module.get<SeriesController>(SeriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria repassar os filtros e retornar as series paginadas', async () => {
      const paginatedValue = {
        data: value,
        current_page: 1,
        pages: 1,
        total: 3,
      };
      serieService.findAll.mockResolvedValue(paginatedValue);

      const filter = {
        take: 20,
        skip: 0,
        franchiseIds: ['franchise-1'],
        name: 'serie',
        statusIds: ['status-1'],
      };

      const result = await controller.findAll(filter);

      expect(result).toEqual(paginatedValue);
      expect(serieService.findAll).toHaveBeenCalledWith(filter);
      expect(serieService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('deveria chamar o FindOneById e retornar um dado', async () => {
      serieService.findOneById.mockResolvedValue(value[0]);

      const result = await controller.findOne('serie-1');

      expect(result).toEqual(value[0]);
      expect(serieService.findOneById).toHaveBeenCalledTimes(1);
      expect(serieService.findOneById).toHaveBeenCalledWith('serie-1');
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar a serie criada', async () => {
      serieService.create.mockResolvedValue(value[0]);
      const dto: CreateSeriesDto = {
        name: 'serie-1',
        statusId: 'status-1',
      };

      const result = await controller.create(dto);

      expect(serieService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'serie-1' }),
      );
      expect(serieService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso o nome for igual', async () => {
      serieService.create.mockRejectedValue(
        new ConflictException('serie já existe'),
      );

      const dto = {
        name: 'serie-1',
        statusId: 'status-1',
      } as CreateSeriesDto;

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateSeriesDto = { name: 'O novo dado' };
      const atualizado = { ...value[0], name: dto.name };
      serieService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('serie-1', dto);

      expect(serieService.update).toHaveBeenCalledTimes(1);
      expect(serieService.update).toHaveBeenCalledWith('serie-1', dto);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando a serie não existe', async () => {
      const dto: UpdateSeriesDto = { name: 'O novo dado' };

      serieService.update.mockRejectedValue(
        new NotFoundException('Serie não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deveria propagar ConflictException ao tentar colocar um nome que já existe', async () => {
      serieService.update.mockRejectedValue(
        new ConflictException('serie já existe'),
      );

      const dto: UpdateSeriesDto = { name: 'serie-1' };

      await expect(controller.update('serie-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('deveria remover a serie pelo id', async () => {
      serieService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('serie-1');

      expect(serieService.delete).toHaveBeenCalledWith({ id: 'serie-1' });
      expect(serieService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando a serie não existe', async () => {
      serieService.delete.mockRejectedValue(
        new NotFoundException('Serie não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cover', () => {
    it('deveria repassar o arquivo para o setCover e retornar a serie', async () => {
      const file = {
        originalname: 'cover.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image'),
      } as Express.Multer.File;
      const atualizado = { ...value[0], coverUrl: 'http://cdn/cover.jpg' };
      serieService.setCover.mockResolvedValue(atualizado);

      const result = await controller.setCover('serie-1', file);

      expect(serieService.setCover).toHaveBeenCalledWith('serie-1', file);
      expect(serieService.setCover).toHaveBeenCalledTimes(1);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando a serie não existe', async () => {
      const file = {
        originalname: 'cover.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image'),
      } as Express.Multer.File;
      serieService.setCover.mockRejectedValue(
        new NotFoundException('Serie não encontrado'),
      );

      await expect(controller.setCover('serie-1', file)).rejects.toThrow(
        NotFoundException,
      );

      expect(serieService.setCover).toHaveBeenCalledWith('serie-1', file);
      expect(serieService.setCover).toHaveBeenCalledTimes(1);
    });

    it('deveria remover a cover da serie pelo id', async () => {
      serieService.removeCover.mockResolvedValue(value[0]);

      const result = await controller.removeCover('serie-1');

      expect(serieService.removeCover).toHaveBeenCalledWith('serie-1');
      expect(serieService.removeCover).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });
    it('deveria remover a cover da serie pelo id', async () => {
      serieService.removeCover.mockRejectedValue(
        new NotFoundException('Serie não encontrado'),
      );

      await expect(controller.removeCover('serie-1')).rejects.toThrow(
        NotFoundException,
      );

      expect(serieService.removeCover).toHaveBeenCalledWith('serie-1');
      expect(serieService.removeCover).toHaveBeenCalledTimes(1);
    });
  });
});
