/**
 * RFC 7807 Problem JSON Builder
 * Builds problem+json responses following RFC 7807 and Zalando API Guidelines
 *
 * Specification: https://datatracker.ietf.org/doc/html/rfc7807
 */

import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ErrorCode } from '../constants/error-codes';
import { getProblemType } from '../constants/problem-types';

/**
 * RFC 7807 Problem JSON structure
 */
export interface ProblemJson {
  /** A URI reference that identifies the problem type */
  type: string;
  /** A short, human-readable summary of the problem type */
  title: string;
  /** The HTTP status code */
  status: number;
  /** A human-readable explanation specific to this occurrence of the problem */
  detail?: string;
  /** A URI reference that identifies the specific occurrence of the problem */
  instance?: string;
  /** Additional extension members */
  [key: string]: unknown;
}

/**
 * Invalid parameter details for validation errors
 */
export interface InvalidParam {
  name: string;
  reason: string;
  value?: unknown;
}

export class ProblemJsonBuilder {
  /**
   * Build a Problem JSON response from an error code
   */
  static build(
    errorCode: ErrorCode,
    detail: string,
    instance: string,
    baseUrl: string,
    status?: HttpStatus,
    extensions?: Record<string, unknown>,
  ): ProblemJson {
    const problemType = getProblemType(errorCode);

    const problem: ProblemJson = {
      type: problemType.type.replace('${PROBLEM_BASE_URL}', baseUrl),
      title: problemType.title,
      status: status || problemType.defaultStatus,
      detail,
      instance,
    };

    if (extensions) {
      Object.assign(problem, extensions);
    }

    problem.error_code = errorCode;
    problem.timestamp = new Date().toISOString();

    return problem;
  }

  /**
   * Build a Problem JSON response for validation errors
   */
  static buildValidationProblem(
    validationErrors: ValidationError[],
    instance: string,
    baseUrl: string,
  ): ProblemJson {
    const invalidParams = this.extractInvalidParams(validationErrors);

    return this.build(
      'VALIDATION_FAILED' as ErrorCode,
      'Request validation failed',
      instance,
      baseUrl,
      HttpStatus.BAD_REQUEST,
      { invalid_params: invalidParams },
    );
  }

  /**
   * Build a Problem JSON response for a generic error
   */
  static buildGenericProblem(
    status: HttpStatus,
    title: string,
    detail: string,
    instance: string,
    baseUrl: string,
    extensions?: Record<string, unknown>,
  ): ProblemJson {
    const problem: ProblemJson = {
      type: `${baseUrl}/${this.statusToType(status)}`,
      title,
      status,
      detail,
      instance,
      timestamp: new Date().toISOString(),
    };

    if (extensions) {
      Object.assign(problem, extensions);
    }

    return problem;
  }

  /**
   * Extract invalid parameters from class-validator errors
   */
  private static extractInvalidParams(validationErrors: ValidationError[]): InvalidParam[] {
    const invalidParams: InvalidParam[] = [];

    for (const error of validationErrors) {
      if (error.constraints) {
        const reasons = Object.values(error.constraints);
        invalidParams.push({
          name: error.property,
          reason: reasons.join(', '),
          value: error.value,
        });
      }

      if (error.children && error.children.length > 0) {
        const nestedParams = this.extractInvalidParams(error.children);
        invalidParams.push(
          ...nestedParams.map((param) => ({
            ...param,
            name: `${error.property}.${param.name}`,
          })),
        );
      }
    }

    return invalidParams;
  }

  /**
   * Convert HTTP status code to problem type suffix
   */
  private static statusToType(status: HttpStatus): string {
    const statusMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'bad-request',
      [HttpStatus.UNAUTHORIZED]: 'unauthorized',
      [HttpStatus.FORBIDDEN]: 'forbidden',
      [HttpStatus.NOT_FOUND]: 'not-found',
      [HttpStatus.CONFLICT]: 'conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable-entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal-server-error',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'service-unavailable',
      [HttpStatus.BAD_GATEWAY]: 'bad-gateway',
    };

    return statusMap[status] || 'unknown-error';
  }
}
