import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException('Você precisa estar autenticado');
    }

    if (user.role === Role.ADMIN || user.userId === request.params.id) {
      return true;
    }

    throw new ForbiddenException('Você só pode acessar os seus próprios dados');
  }
}
