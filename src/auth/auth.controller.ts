import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  login() {}

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  me(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise<void>((resolve, reject) => {
      req.logout((err: unknown) => {
        if (err) return reject(err);
        req.session.destroy((err: unknown) => {
          if (err) return reject(err);

          res.clearCookie(this.configService.get('COOKIE_NAME')!);
          resolve();
        });
      });
    });
  }
}
