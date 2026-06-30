import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.isUnauthenticated()) {
      throw new ForbiddenException('Você precisa estar autenticado');
    }

    return request.isAuthenticated();
  }
}
