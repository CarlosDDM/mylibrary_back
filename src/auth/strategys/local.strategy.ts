import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('Auth');

  constructor(private authService: AuthService) {
    super({ passReqToCallback: true });
  }

  async validate(
    req: Request,
    username: string,
    password: string,
  ): Promise<any> {
    try {
      const user = await this.authService.login({ username, password });
      this.logger.log(`Login OK: "${username}" (${req.ip})`);
      return user;
    } catch (err) {
      this.logger.warn(`Login FALHOU: "${username}" (${req.ip})`);
      throw err;
    }
  }
}
