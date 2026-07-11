import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.isAuthenticated()) {
      throw new UnauthorizedException('Você precisa estar autenticado');
    }
    return request.isAuthenticated();
  }
}
