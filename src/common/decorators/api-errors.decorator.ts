import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

const corpo = (statusCode: number, error: string, ...message: string[]) => ({
  message,
  error,
  statusCode,
});

export const ApiUnauthorized = () =>
  ApiUnauthorizedResponse({
    description: 'Sessão ausente, inválida ou expirada',
    type: ErrorResponseDto,
    example: corpo(401, 'Unauthorized', 'Você precisa estar autenticado'),
  });

export const ApiAdminOnly = () =>
  ApiForbiddenResponse({
    description: 'Autenticado, mas sem permissão de ADMIN',
    type: ErrorResponseDto,
    example: corpo(
      403,
      'Forbidden',
      'Você não tem permissão para usar esse conteúdo',
    ),
  });

export const ApiSelfOrAdmin = () =>
  ApiForbiddenResponse({
    description: 'Só o próprio usuário ou um ADMIN pode acessar',
    type: ErrorResponseDto,
    example: corpo(
      403,
      'Forbidden',
      'Você só pode acessar os seus próprios dados',
    ),
  });

export const ApiInvalidBody = () =>
  ApiBadRequestResponse({
    description:
      'Corpo reprovado pelo ValidationPipe. Roda com whitelist e forbidNonWhitelisted, então campo desconhecido também derruba.',
    type: ErrorResponseDto,
    example: corpo(
      400,
      'Bad Request',
      'name should not be empty',
      'property apelido should not exist',
    ),
  });

export const ApiUuidParam = (name: string, description: string) =>
  ApiParam({
    name,
    format: 'uuid',
    description,
  });

export const ApiFindById = (entidade: string, param = 'id') =>
  applyDecorators(
    ApiUuidParam(param, `Identificador de ${entidade}`),
    ApiNotFoundResponse({
      description: `Nenhum registro de ${entidade} com esse id`,
      type: ErrorResponseDto,
      example: corpo(404, 'Not Found', `${entidade} não encontrado`),
    }),
  );

export const ApiThrottled = () =>
  ApiTooManyRequestsResponse({
    description:
      'Estourou um dos limites globais do ThrottlerGuard: 20 req/s, 100 req/10s ou 300 req/min por IP',
    type: ErrorResponseDto,
    example: corpo(
      429,
      'TOO_MANY_REQUESTS',
      'ThrottlerException: Too Many Requests',
    ),
  });

export const ApiConflict = (...message: string[]) =>
  ApiConflictResponse({
    description: 'Já existe um registro com esse valor único',
    type: ErrorResponseDto,
    example: corpo(409, 'Conflict', ...message),
  });
