import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Base application exception with error code support.
 * All v1 API exceptions should extend this class.
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode,
        errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * Authentication related exceptions (401)
 */
export class AuthException extends AppException {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Resource not found exceptions (404)
 */
export class NotFoundException extends AppException {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, HttpStatus.NOT_FOUND, details);
  }
}

/**
 * Conflict exceptions (409) — duplicate resources, already processed, etc.
 */
export class ConflictException extends AppException {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, HttpStatus.CONFLICT, details);
  }
}

/**
 * Validation exceptions (400)
 */
export class ValidationException extends AppException {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, HttpStatus.BAD_REQUEST, details);
  }
}

/**
 * Forbidden access exceptions (403)
 */
export class ForbiddenException extends AppException {
  constructor(errorCode: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(errorCode, message, HttpStatus.FORBIDDEN, details);
  }
}
