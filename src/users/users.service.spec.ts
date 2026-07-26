import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HashingService } from 'src/common/hashing/hashing.service';
import { SessionService } from 'src/session/session.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    exists: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    countBy: jest.Mock;
  };
  let hashingService: { hash: jest.Mock; compare: jest.Mock };
  let sessionService: { destroyUserSessions: jest.Mock };

  const value = [
    { id: 'user-1', name: 'O usuário', username: 'user1', email: 'a@a.com' },
    { id: 'user-2', name: 'Qualquer um', username: 'user2', email: 'b@b.com' },
    { id: 'user-3', name: 'A grande um', username: 'user3', email: 'c@c.com' },
  ];

  beforeEach(async () => {
    userRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countBy: jest.fn(),
    };
    hashingService = { hash: jest.fn(), compare: jest.fn() };
    sessionService = { destroyUserSessions: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: HashingService, useValue: hashingService },
        { provide: SessionService, useValue: sessionService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByName', () => {
    it('busca com ILike quando tem name e retorna paginado', async () => {
      userRepository.findAndCount.mockResolvedValue([value, 2]);

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
      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: ILike('%coisa%') },
          take: 20,
          skip: 0,
        }),
      );
    });

    it('sem name, busca sem where de nome', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByName({ take: 20, skip: 0 });

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('calcula pages e current_page fora da primeira página', async () => {
      userRepository.findAndCount.mockResolvedValue([value, 45]);

      const result = await service.findAllByName({ take: 20, skip: 20 });

      expect(result).toMatchObject({ total: 45, pages: 3, current_page: 2 });
    });

    it('pagina corretamente quando não há resultados', async () => {
      userRepository.findAndCount.mockResolvedValue([[], 0]);

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
    it('deveria buscar usuário por id e retornar', async () => {
      userRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.findOne({ id: 'user-1' });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        relations: undefined,
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria lançar NotFoundException quando o usuário não existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ id: 'nao-existe' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deveria deletar pelo id, destruir as sessões e retornar o objeto', async () => {
      userRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
      userRepository.findOne.mockResolvedValue(value[0]);

      const result = await service.delete({ id: 'user-1' });

      expect(userRepository.delete).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toEqual(value[0]);
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('deveria lançar NotFoundException quando o usuário não existe ao deletar', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete({ id: 'nao-existo' })).rejects.toThrow(
        NotFoundException,
      );

      expect(userRepository.delete).not.toHaveBeenCalled();
      expect(sessionService.destroyUserSessions).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Novo',
      username: 'novo',
      email: 'novo@a.com',
      password: 'Senha@123',
    };

    beforeEach(() => {
      userRepository.exists.mockResolvedValue(false);
      hashingService.hash.mockResolvedValue('hashed');
      userRepository.save.mockImplementation((data: unknown) => data);
    });

    it('deveria criar o usuário com a senha hasheada', async () => {
      const result = await service.create(dto);

      expect(hashingService.hash).toHaveBeenCalledWith('Senha@123');
      expect(userRepository.save).toHaveBeenCalledWith({
        name: 'Novo',
        username: 'novo',
        email: 'novo@a.com',
        hashedPassword: 'hashed',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('deveria lançar ConflictException quando o email já existe', async () => {
      userRepository.exists.mockResolvedValueOnce(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { email: 'novo@a.com' },
      });
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('deveria lançar ConflictException quando o username já existe', async () => {
      userRepository.exists
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { username: 'novo' },
      });
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('deveria criar sem validar o email quando ele não é informado', async () => {
      await service.create({
        name: 'Novo',
        username: 'novo',
        password: 'Senha@123',
      });

      expect(userRepository.exists).toHaveBeenCalledTimes(1);
      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { username: 'novo' },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        name: 'Novo',
        username: 'novo',
        hashedPassword: 'hashed',
      });
    });
  });

  describe('update', () => {
    it('deveria validar o email e atualizar quando o email muda', async () => {
      userRepository.findOne.mockResolvedValue(value[0]);
      userRepository.exists.mockResolvedValue(false);

      const result = await service.update('user-1', { email: 'novo@a.com' });

      expect(userRepository.exists).toHaveBeenCalledWith({
        where: { email: 'novo@a.com' },
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { email: 'novo@a.com' },
      );
      expect(result).toEqual(value[0]);
    });

    it('não deveria validar o email quando ele não muda', async () => {
      userRepository.findOne.mockResolvedValue(value[0]);

      await service.update('user-1', { email: value[0].email });

      expect(userRepository.exists).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { email: value[0].email },
      );
    });

    it('deveria lançar ConflictException quando o novo email já existe', async () => {
      userRepository.findOne.mockResolvedValue(value[0]);
      userRepository.exists.mockResolvedValue(true);

      await expect(
        service.update('user-1', { email: 'ocupado@a.com' }),
      ).rejects.toThrow(ConflictException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const dto = {
      currentPassword: 'Senha@123',
      newPassword: 'Nova@1234',
      confirmPassword: 'Nova@1234',
    };

    beforeEach(() => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        hashedPassword: 'hash-atual',
      });
    });

    it('deveria trocar a senha e destruir as sessões', async () => {
      hashingService.compare
        .mockResolvedValueOnce(true) // senha atual confere
        .mockResolvedValueOnce(false); // nova é diferente da anterior
      hashingService.hash.mockResolvedValue('novo-hash');

      await service.updatePassword('user-1', dto);

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { hashedPassword: 'novo-hash' },
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('deveria lançar ForbiddenException quando a senha atual está incorreta', async () => {
      hashingService.compare.mockResolvedValueOnce(false);

      await expect(service.updatePassword('user-1', dto)).rejects.toThrow(
        ForbiddenException,
      );

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar BadRequestException quando a confirmação não confere', async () => {
      hashingService.compare.mockResolvedValueOnce(true);

      await expect(
        service.updatePassword('user-1', {
          ...dto,
          confirmPassword: 'Outra@1234',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar BadRequestException quando a nova senha é igual à anterior', async () => {
      hashingService.compare
        .mockResolvedValueOnce(true) // senha atual confere
        .mockResolvedValueOnce(true); // nova é igual à anterior

      await expect(service.updatePassword('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updatePasswordAdmin', () => {
    it('deveria resetar a senha e destruir as sessões', async () => {
      userRepository.exists.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('novo-hash');

      await service.updatePasswordAdmin('user-1', { newPassword: 'Nova@1234' });

      expect(hashingService.hash).toHaveBeenCalledWith('Nova@1234');
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { hashedPassword: 'novo-hash' },
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('deveria lançar NotFoundException quando o usuário não existe', async () => {
      userRepository.exists.mockResolvedValue(false);

      await expect(
        service.updatePasswordAdmin('nao-tem', { newPassword: 'Nova@1234' }),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('promoteRole', () => {
    it('deveria promover o usuário para admin e destruir as sessões', async () => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        role: Role.USER,
      });

      await service.promoteRole('user-1');

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { role: Role.ADMIN },
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('deveria lançar BadRequestException quando já é admin', async () => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        role: Role.ADMIN,
      });

      await expect(service.promoteRole('user-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('demoteRole', () => {
    it('deveria rebaixar o admin para usuário e destruir as sessões', async () => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        role: Role.ADMIN,
      });
      userRepository.countBy.mockResolvedValue(2);

      await service.demoteRole('user-1');

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: 'user-1' },
        { role: Role.USER },
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('deveria lançar BadRequestException quando o usuário não é admin', async () => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        role: Role.USER,
      });

      await expect(service.demoteRole('user-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('deveria lançar BadRequestException quando só existe 1 admin', async () => {
      userRepository.findOne.mockResolvedValue({
        ...value[0],
        role: Role.ADMIN,
      });
      userRepository.countBy.mockResolvedValue(1);

      await expect(service.demoteRole('user-1')).rejects.toThrow(
        BadRequestException,
      );

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('findOneOrNull', () => {
    it('deveria buscar pelo username e retornar o usuário', async () => {
      userRepository.findOneBy.mockResolvedValue(value[0]);

      const result = await service.findOneOrNull('user1');

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        username: 'user1',
      });
      expect(result).toEqual(value[0]);
    });

    it('deveria retornar null quando o usuário não existe', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOneOrNull('nao-tem');

      expect(result).toBeNull();
    });
  });
});
