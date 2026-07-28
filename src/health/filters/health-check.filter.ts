import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * O AllExceptionsFilter é global e reescreve toda HttpException para
 * { message, error, statusCode }. Isso apaga o corpo do Terminus, que é
 * { status, info, error, details } — ou seja, apaga justamente qual
 * dependência caiu, que é a única informação útil de um 503 aqui.
 *
 * Este filtro é escopado no HealthController e só re-emite o corpo original.
 * Não toca no formato de erro das outras rotas.
 */
@Catch(ServiceUnavailableException)
export class HealthCheckFilter implements ExceptionFilter {
  catch(exception: ServiceUnavailableException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
