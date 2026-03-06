/**
 * Correlation ID Interceptor
 *
 * Adds a correlation ID to response headers for request tracing.
 * The correlation ID is either:
 * - Taken from the incoming X-Correlation-ID header (client-provided)
 * - Generated as a new UUID if not provided
 *
 * This allows clients to track their requests through the system
 * and correlate logs across distributed services.
 */

import { randomUUID } from 'crypto';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();

    // Store on request for use in logging/downstream services
    (request as Request & { correlationId: string }).correlationId = correlationId;

    // Add to response headers
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle();
  }
}
