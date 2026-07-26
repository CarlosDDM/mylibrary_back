import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = { get: jest.fn().mockReturnValue('sid') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: ConfigService, useValue: configService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('não deveria retornar nada (o trabalho é feito pelo guard)', () => {
      expect(controller.login()).toBeUndefined();
    });
  });

  describe('me', () => {
    it('deveria retornar o usuário autenticado da requisição', () => {
      const user = { id: 'user-1', username: 'user1' };
      const req = { user } as unknown as Request;

      expect(controller.me(req)).toEqual(user);
    });
  });

  describe('logout', () => {
    it('deveria deslogar, destruir a sessão e limpar o cookie', async () => {
      const destroy = jest.fn((cb: (err?: unknown) => void) => cb());
      const logout = jest.fn((cb: (err?: unknown) => void) => cb());
      const clearCookie = jest.fn();
      const req = { logout, session: { destroy } } as unknown as Request;
      const res = { clearCookie } as unknown as Response;

      await expect(controller.logout(req, res)).resolves.toBeUndefined();

      expect(logout).toHaveBeenCalled();
      expect(destroy).toHaveBeenCalled();
      expect(configService.get).toHaveBeenCalledWith('COOKIE_NAME');
      expect(clearCookie).toHaveBeenCalledWith('sid');
    });

    it('deveria rejeitar quando o logout falha', async () => {
      const erro = new Error('falha no logout');
      const destroy = jest.fn();
      const logout = jest.fn((cb: (err?: unknown) => void) => cb(erro));
      const clearCookie = jest.fn();
      const req = { logout, session: { destroy } } as unknown as Request;
      const res = { clearCookie } as unknown as Response;

      await expect(controller.logout(req, res)).rejects.toBe(erro);

      expect(destroy).not.toHaveBeenCalled();
      expect(clearCookie).not.toHaveBeenCalled();
    });

    it('deveria rejeitar quando a destruição da sessão falha', async () => {
      const erro = new Error('falha ao destruir sessão');
      const destroy = jest.fn((cb: (err?: unknown) => void) => cb(erro));
      const logout = jest.fn((cb: (err?: unknown) => void) => cb());
      const clearCookie = jest.fn();
      const req = { logout, session: { destroy } } as unknown as Request;
      const res = { clearCookie } as unknown as Response;

      await expect(controller.logout(req, res)).rejects.toBe(erro);

      expect(clearCookie).not.toHaveBeenCalled();
    });
  });
});
