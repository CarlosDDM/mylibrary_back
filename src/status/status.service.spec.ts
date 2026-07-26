import { Test, TestingModule } from '@nestjs/testing';
import { StatusService } from './status.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Status } from './entities/status.entity';
import { StatusType } from 'src/common/enums/status-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('StatusService', () => {
  let service: StatusService;
  let statusRepository: { find: jest.Mock; exists: jest.Mock };
  const status: { id: string; type: StatusType }[] = [
    { id: 'status-1', type: StatusType.CANCELLED },
    { id: 'status-2', type: StatusType.COMPLETED },
    { id: 'status-3', type: StatusType.HIATUS },
    { id: 'status-4', type: StatusType.ONGOING },
  ];

  beforeEach(async () => {
    statusRepository = {
      find: jest.fn().mockResolvedValue(status),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: getRepositoryToken(Status),
          useValue: statusRepository,
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar todos os status', async () => {
      const result = await service.findAll();

      expect(result).toEqual(status);
    });
  });

  describe('validateExists', () => {
    it('nao deveria lancar quando a status existe', async () => {
      statusRepository.exists.mockResolvedValue(true);

      await expect(
        service.validateExists({ id: 'status-1' }),
      ).resolves.toBeUndefined();
    });

    it('deveria lancar quando o status nao existe', async () => {
      statusRepository.exists.mockResolvedValue(false);
      await expect(
        service.validateExists({ id: 'nao_existo' }),
      ).rejects.toThrow(new NotFoundException('Status não encontrado'));
    });
  });
});
