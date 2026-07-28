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
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { ResponseSessionUserDto } from './dto/response-session-user.dto';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import {
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';

@ApiTags('auth')
@ApiThrottled()
@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  /** Autentica e abre a sessão */
  @ApiBody({ type: AuthDto })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Sessão criada. O corpo vem vazio; o que importa é o cookie de sessão no Set-Cookie.',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário ou senha inválidos',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description:
      'Mais de 5 tentativas em 60 segundos. Limite próprio desta rota, mais apertado que o global.',
    type: ErrorResponseDto,
    example: {
      message: ['ThrottlerException: Too Many Requests'],
      error: 'TOO_MANY_REQUESTS',
      statusCode: 429,
    },
  })
  login() {}

  /** Devolve o usuário da sessão atual */
  @Get('me')
  @ApiCookieAuth()
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseSessionUserDto })
  @ApiUnauthorized()
  me(@Req() req: Request) {
    return req.user;
  }

  /** Encerra a sessão e limpa o cookie */
  @Post('logout')
  @ApiCookieAuth()
  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Sessão destruída e cookie limpo. Corpo vazio.',
  })
  @ApiUnauthorized()
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const toError = (err: unknown) =>
      err instanceof Error ? err : new Error(String(err));

    return new Promise<void>((resolve, reject) => {
      req.logout((err: unknown) => {
        if (err) return reject(toError(err));
        req.session.destroy((err: unknown) => {
          if (err) return reject(toError(err));

          res.clearCookie(this.configService.get('COOKIE_NAME')!);
          resolve();
        });
      });
    });
  }
}
