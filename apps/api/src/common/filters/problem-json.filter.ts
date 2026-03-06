/**
 * RFC 7807 Problem JSON Exception Filter
 * Formats all HTTP exceptions as application/problem+json responses
 *
 * This filter is applied ONLY to v1 endpoints (via controller-level @UseFilters).
 * Existing endpoints continue to use HttpExceptionFilter + JSend format.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorCodes } from '../constants/error-codes';
import { ProblemJsonBuilder } from '../exceptions/problem-json.builder';
import { ValidationError } from 'class-validator';

@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const protocol = request.protocol;
    const hostName = request.get('host');
    const baseUrl = `${protocol}://${hostName}/problems`;

    let problemJson: Record<string, unknown>;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // Custom AppException format with errorCode
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'errorCode' in exceptionResponse
      ) {
        const customError = exceptionResponse as Record<string, unknown>;
        problemJson = ProblemJsonBuilder.build(
          customError.errorCode as ErrorCode,
          customError.message as string,
          request.url,
          baseUrl,
          status,
          customError.details ? { details: customError.details } : undefined,
        );
      }
      // Validation errors from class-validator (BadRequestException with message array)
      else if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse &&
        Array.isArray((exceptionResponse as Record<string, unknown>).message)
      ) {
        const messages = (exceptionResponse as Record<string, unknown>).message as unknown[];
        const validationErrors = this.extractValidationErrors(messages);

        if (validationErrors.length > 0) {
          problemJson = ProblemJsonBuilder.buildValidationProblem(
            validationErrors,
            request.url,
            baseUrl,
          );
        } else {
          problemJson = ProblemJsonBuilder.build(
            ErrorCodes.VALIDATION_FAILED,
            'Validation failed',
            request.url,
            baseUrl,
            status,
            { validation_errors: messages },
          );
        }
      }
      // Standard NestJS exceptions
      else {
        const message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : ((exceptionResponse as Record<string, unknown>).message as string) ||
              'An error occurred';

        const errorCode = this.getErrorCodeForStatus(status, message);

        problemJson = ProblemJsonBuilder.build(errorCode, message, request.url, baseUrl, status);
      }
    } else {
      // Unknown error (not an HttpException)
      const error = exception as Error;
      this.logger.error(`Unhandled exception: ${error?.message || 'Unknown error'}`, error?.stack);

      problemJson = ProblemJsonBuilder.build(
        ErrorCodes.GENERAL_INTERNAL_ERROR,
        'Internal server error',
        request.url,
        baseUrl,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.error(
      `${request.method} ${request.url} - ${problemJson.error_code}: ${problemJson.detail}`,
    );

    response.status(status).contentType('application/problem+json').json(problemJson);
  }

  /**
   * Extract ValidationError objects from error messages
   */
  private extractValidationErrors(messages: unknown[]): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    for (const msg of messages) {
      if (typeof msg === 'object' && msg !== null && 'property' in msg && 'constraints' in msg) {
        validationErrors.push(msg as ValidationError);
      }
    }

    return validationErrors;
  }

  /**
   * Map HTTP status codes to error codes when not explicitly provided
   */
  private getErrorCodeForStatus(status: HttpStatus, message?: string): ErrorCode {
    if (typeof message === 'string') {
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('validation')) {
        return ErrorCodes.VALIDATION_FAILED;
      }

      if (lowerMessage.includes('not found')) {
        return ErrorCodes.GENERAL_NOT_FOUND;
      }

      if (lowerMessage.includes('unauthorized')) {
        return ErrorCodes.AUTH_UNAUTHORIZED;
      }

      if (lowerMessage.includes('forbidden')) {
        return ErrorCodes.GENERAL_FORBIDDEN;
      }
    }

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.GENERAL_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.GENERAL_NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.GENERAL_BAD_REQUEST;
      case HttpStatus.CONFLICT:
        return ErrorCodes.GENERAL_CONFLICT;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCodes.GENERAL_INTERNAL_ERROR;
      default:
        return ErrorCodes.GENERAL_INTERNAL_ERROR;
    }
  }
}
