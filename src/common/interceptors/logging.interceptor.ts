import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<Response>();
        const elapsed = Date.now() - start;
        this.logger.log(`${method} ${originalUrl} ${statusCode} +${elapsed}ms`);
      }),
    );
  }
}
