import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      tap({
        next: () => this.record(request, response, startedAt),
        error: () => this.record(request, response, startedAt),
      }),
    );
  }

  private record(request: Request, response: Response, startedAt: number) {
    const route = request.originalUrl.split('?')[0] ?? request.path;
    this.metricsService.recordHttp(
      request.method,
      route,
      response.statusCode,
      Date.now() - startedAt,
    );
  }
}
