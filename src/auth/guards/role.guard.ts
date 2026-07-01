import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from 'src/common/enums/role.enum';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflectorService: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflectorService.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user) {
      throw new UnauthorizedException('Você precisa estar autenticado');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para usar esse conteúdo',
      );
    }
    return true;
  }
}
