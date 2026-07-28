import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiPayloadTooLargeResponse,
} from '@nestjs/swagger';
import type { ApiResponseSchemaHost } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

type SchemaObject = ApiResponseSchemaHost['schema'];
type SchemaProperty = NonNullable<SchemaObject['properties']>[string];

export const ApiImageUpload = (
  extraProperties: Record<string, SchemaProperty> = {},
) =>
  applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'jpeg, png ou webp, no máximo 5 MB',
          },
          ...extraProperties,
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Nenhum arquivo enviado ou formato fora de jpeg/png/webp',
      type: ErrorResponseDto,
      example: {
        message: ['Somente imagens são permitidas'],
        error: 'Bad Request',
        statusCode: 400,
      },
    }),
    ApiPayloadTooLargeResponse({
      description: 'Arquivo acima do limite de 5 MB do FileInterceptor',
      type: ErrorResponseDto,
      example: {
        message: ['File too large'],
        error: 'Payload Too Large',
        statusCode: 413,
      },
    }),
  );
