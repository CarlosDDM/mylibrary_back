import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import type { ApiResponseSchemaHost } from '@nestjs/swagger';

type SchemaObject = ApiResponseSchemaHost['schema'];

const indicadores: SchemaObject = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['up', 'down'] },
      message: { type: 'string' },
      responseTime: { type: 'number' },
    },
  },
};

const healthCheckSchema = (status: 'ok' | 'error'): SchemaObject => ({
  type: 'object',
  required: ['status', 'details'],
  properties: {
    status: {
      type: 'string',
      enum: ['ok', 'error', 'shutting_down'],
      example: status,
    },
    info: { ...indicadores, nullable: true },
    error: { ...indicadores, nullable: true },
    details: indicadores,
  },
});

const postgresUp = { status: 'up' };
const cacheUp = { responseTime: 2, status: 'up' };
const sessionUp = { responseTime: 1, status: 'up' };

const postgresDown = { message: 'timeout of 2000ms exceeded', status: 'down' };
const cacheDown = { message: 'The client is offline', status: 'down' };
const sessionDown = { message: 'The client is offline', status: 'down' };

export const ApiHealthLive = () =>
  ApiOkResponse({
    description: 'O processo está de pé. Não consulta nenhuma dependência.',
    schema: {
      type: 'object',
      properties: { status: { type: 'string', example: 'ok' } },
    },
  });

export const ApiHealthReady = () =>
  applyDecorators(
    ApiOkResponse({
      description: 'Postgres e os dois Redis responderam',
      content: {
        'application/json': {
          schema: healthCheckSchema('ok'),
          example: {
            status: 'ok',
            info: {
              postgres: postgresUp,
              'redis-cache': cacheUp,
              'redis-session': sessionUp,
            },
            error: {},
            details: {
              postgres: postgresUp,
              'redis-cache': cacheUp,
              'redis-session': sessionUp,
            },
          },
        },
      },
    }),
    ApiServiceUnavailableResponse({
      description:
        'Qualquer uma das três dependências pode cair, sozinha ou junto com as outras. ' +
        '`error` lista só as que caíram e `details` lista todas — troque o exemplo no ' +
        'seletor acima do corpo para ver cada combinação.',
      content: {
        'application/json': {
          schema: healthCheckSchema('error'),
          examples: {
            'todas fora': {
              summary: 'As três caíram — error e details ficam iguais',
              value: {
                status: 'error',
                info: {},
                error: {
                  postgres: postgresDown,
                  'redis-cache': cacheDown,
                  'redis-session': sessionDown,
                },
                details: {
                  postgres: postgresDown,
                  'redis-cache': cacheDown,
                  'redis-session': sessionDown,
                },
              },
            },
            'só o postgres fora': {
              summary: 'Falha isolada no banco, os dois Redis respondendo',
              value: {
                status: 'error',
                info: { 'redis-cache': cacheUp, 'redis-session': sessionUp },
                error: { postgres: postgresDown },
                details: {
                  postgres: postgresDown,
                  'redis-cache': cacheUp,
                  'redis-session': sessionUp,
                },
              },
            },
            'só o redis de cache fora': {
              summary: 'Falha isolada num Redis, banco e sessão respondendo',
              value: {
                status: 'error',
                info: { postgres: postgresUp, 'redis-session': sessionUp },
                error: { 'redis-cache': cacheDown },
                details: {
                  postgres: postgresUp,
                  'redis-cache': cacheDown,
                  'redis-session': sessionUp,
                },
              },
            },
          },
        },
      },
    }),
  );
