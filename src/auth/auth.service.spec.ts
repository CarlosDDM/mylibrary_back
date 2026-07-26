import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { HashingService } from 'src/common/hashing/hashing.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findOneOrNull: jest.Mock };
  let hashingService: { compare: jest.Mock };

  beforeEach(async () => {
    userService = {
      findOneOrNull: jest.fn(),
    };

    hashingService = {
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: userService },
        { provide: HashingService, useValue: hashingService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const dto = {
      username: 'carlos.daniel',
      password: 'senha123',
    };

    const user = {
      username: 'carlos.daniel',
      name: 'Carlos Daniel',
      email: 'carlos@email.com',
      hashedPassword: 'hash_da_senha',
    };

    it('deveria achar o usuário comparar a senha e fazer o login', async () => {
      userService.findOneOrNull.mockResolvedValue(user);
      hashingService.compare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result).toEqual(user);
      expect(userService.findOneOrNull).toHaveBeenCalledWith(dto.username);
      expect(hashingService.compare).toHaveBeenCalledWith(
        dto.password,
        user.hashedPassword,
      );
    });

    it('deveria propagar UnauthorizedException caso user não existir', async () => {
      userService.findOneOrNull.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(userService.findOneOrNull).toHaveBeenCalledWith(dto.username);
      expect(hashingService.compare).not.toHaveBeenCalled();
    });

    it('deveria propagar UnauthorizedException caso senha não bater', async () => {
      userService.findOneOrNull.mockResolvedValue(user);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(userService.findOneOrNull).toHaveBeenCalledWith(dto.username);
      expect(hashingService.compare).toHaveBeenCalledWith(
        dto.password,
        user.hashedPassword,
      );
    });
  });
});
