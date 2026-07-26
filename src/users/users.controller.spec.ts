import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    findAllByName: jest.Mock;
    findOne: jest.Mock;
    updatePassword: jest.Mock;
    updatePasswordAdmin: jest.Mock;
    promoteRole: jest.Mock;
    demoteRole: jest.Mock;
  };

  const value = [
    { id: 'user-1', name: 'O usuário', username: 'user1', email: 'a@a.com' },
    { id: 'user-2', name: 'Qualquer um', username: 'user2', email: 'b@b.com' },
    { id: 'user-3', name: 'A grande um', username: 'user3', email: 'c@c.com' },
  ];

  const paginatedValue = {
    data: value,
    current_page: 1,
    pages: 1,
    total: 15,
  };

  beforeEach(async () => {
    usersService = {
      findAllByName: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updatePassword: jest.fn(),
      updatePasswordAdmin: jest.fn(),
      promoteRole: jest.fn(),
      demoteRole: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deveria retornar a lista de usuários paginada', async () => {
      usersService.findAllByName.mockResolvedValue(paginatedValue);

      const result = await controller.findAll({ skip: 0, take: 20 });

      expect(usersService.findAllByName).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginatedValue);
    });

    it('deveria repassar skip, take e name para o service', async () => {
      usersService.findAllByName.mockResolvedValue(paginatedValue);

      await controller.findAll({ skip: 0, take: 15, name: '1' });

      expect(usersService.findAllByName).toHaveBeenCalledWith({
        skip: 0,
        take: 15,
        name: '1',
      });
    });
  });

  describe('findOne', () => {
    it('deveria retornar o usuário pelo id', async () => {
      usersService.findOne.mockResolvedValue(value[0]);

      const result = await controller.findOne('user-1');

      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(usersService.findOne).toHaveBeenCalledWith({ id: 'user-1' });
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o usuário não existe', async () => {
      usersService.findOne.mockRejectedValue(
        new NotFoundException('User não encontrado'),
      );

      await expect(controller.findOne('nao-existo')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deveria repassar o dto e retornar o usuário criado', async () => {
      usersService.create.mockResolvedValue(value[0]);
      const dto: CreateUserDto = {
        username: 'user1',
        password: 'Senha@123',
      };

      const result = await controller.create(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'user1' }),
      );
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar ConflictException caso o username já exista', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('user já existe'),
      );

      const dto = {
        username: 'user1',
        password: 'Senha@123',
      } as CreateUserDto;

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deveria remover o usuário pelo id', async () => {
      usersService.delete.mockResolvedValue(value[0]);

      const result = await controller.remove('user-1');

      expect(usersService.delete).toHaveBeenCalledWith({ id: 'user-1' });
      expect(usersService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(value[0]);
    });

    it('deveria propagar NotFoundException quando o usuário não existe', async () => {
      usersService.delete.mockRejectedValue(
        new NotFoundException('User não encontrado'),
      );

      await expect(controller.remove('qualquer-coisa')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deveria repassar um dto e retornar o objeto atualizado', async () => {
      const dto: UpdateUserDto = { name: 'O novo nome' };
      const atualizado = { ...value[0], name: dto.name };
      usersService.update.mockResolvedValueOnce(atualizado);

      const result = await controller.update('user-1', dto);

      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(usersService.update).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(atualizado);
    });

    it('deveria propagar NotFoundException quando o usuário não existe', async () => {
      const dto: UpdateUserDto = { name: 'O novo nome' };

      usersService.update.mockRejectedValue(
        new NotFoundException('User não encontrado'),
      );

      await expect(controller.update('nao-tem', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('deveria repassar o id e o dto para o service', async () => {
      const dto = {
        currentPassword: 'Senha@123',
        newPassword: 'Nova@1234',
        confirmPassword: 'Nova@1234',
      };
      usersService.updatePassword.mockResolvedValue(undefined);

      await controller.updatePassword('user-1', dto);

      expect(usersService.updatePassword).toHaveBeenCalledTimes(1);
      expect(usersService.updatePassword).toHaveBeenCalledWith('user-1', dto);
    });

    it('deveria propagar erro vindo do service', async () => {
      usersService.updatePassword.mockRejectedValue(
        new BadRequestException('A nova senha e a confirmação não conferem'),
      );

      await expect(
        controller.updatePassword('user-1', {
          currentPassword: 'Senha@123',
          newPassword: 'Nova@1234',
          confirmPassword: 'Outra@1234',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePasswordAdmin', () => {
    it('deveria repassar o id e o dto para o service', async () => {
      const dto = { newPassword: 'Nova@1234' };
      usersService.updatePasswordAdmin.mockResolvedValue(undefined);

      await controller.updatePasswordAdmin('user-1', dto);

      expect(usersService.updatePasswordAdmin).toHaveBeenCalledTimes(1);
      expect(usersService.updatePasswordAdmin).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
    });

    it('deveria propagar NotFoundException quando o usuário não existe', async () => {
      usersService.updatePasswordAdmin.mockRejectedValue(
        new NotFoundException('Users não encontrado'),
      );

      await expect(
        controller.updatePasswordAdmin('nao-tem', { newPassword: 'Nova@1234' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('promoteRole', () => {
    it('deveria repassar o id e retornar o usuário promovido', async () => {
      const promovido = { ...value[0], role: 'admin' };
      usersService.promoteRole.mockResolvedValue(promovido);

      const result = await controller.promoteRole('user-1');

      expect(usersService.promoteRole).toHaveBeenCalledWith('user-1');
      expect(usersService.promoteRole).toHaveBeenCalledTimes(1);
      expect(result).toEqual(promovido);
    });

    it('deveria propagar BadRequestException quando já é administrador', async () => {
      usersService.promoteRole.mockRejectedValue(
        new BadRequestException('O usuário já é um administrador'),
      );

      await expect(controller.promoteRole('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('demoteRole', () => {
    it('deveria repassar o id e retornar o usuário rebaixado', async () => {
      const rebaixado = { ...value[0], role: 'user' };
      usersService.demoteRole.mockResolvedValue(rebaixado);

      const result = await controller.demoteRole('user-1');

      expect(usersService.demoteRole).toHaveBeenCalledWith('user-1');
      expect(usersService.demoteRole).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rebaixado);
    });

    it('deveria propagar BadRequestException quando não pode ser rebaixado', async () => {
      usersService.demoteRole.mockRejectedValue(
        new BadRequestException('Deve existir pelo menos 1 administrador'),
      );

      await expect(controller.demoteRole('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
