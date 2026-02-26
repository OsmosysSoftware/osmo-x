/**
 * RFC 7807 Problem Types Registry
 * Maps error codes to problem type URIs following Zalando RESTful API Guidelines
 *
 * Each problem type has:
 * - type: URI reference identifying the problem type
 * - title: Short, human-readable summary
 * - defaultStatus: Default HTTP status code
 *
 * Specification: https://datatracker.ietf.org/doc/html/rfc7807
 */

import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodes } from './error-codes';

export interface ProblemType {
  type: string;
  title: string;
  defaultStatus: HttpStatus;
}

/**
 * Base URL placeholder for problem type documentation.
 * Replaced dynamically with the actual request host.
 * Example: http://localhost:3000/problems or https://api.osmox.com/problems
 */
const PROBLEM_BASE_URL = '${PROBLEM_BASE_URL}';

/**
 * Problem types registry mapping error codes to RFC 7807 problem types
 */
export const ProblemTypes: Record<ErrorCode, ProblemType> = {
  // Authentication Problems
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    type: `${PROBLEM_BASE_URL}/auth-invalid-credentials`,
    title: 'Invalid Credentials',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: {
    type: `${PROBLEM_BASE_URL}/auth-user-already-exists`,
    title: 'User Already Exists',
    defaultStatus: HttpStatus.CONFLICT,
  },
  [ErrorCodes.AUTH_INVALID_TOKEN]: {
    type: `${PROBLEM_BASE_URL}/auth-invalid-token`,
    title: 'Invalid Token',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: {
    type: `${PROBLEM_BASE_URL}/auth-token-expired`,
    title: 'Token Expired',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCodes.AUTH_UNAUTHORIZED]: {
    type: `${PROBLEM_BASE_URL}/auth-unauthorized`,
    title: 'Unauthorized',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCodes.AUTH_INVALID_REFRESH_TOKEN]: {
    type: `${PROBLEM_BASE_URL}/auth-invalid-refresh-token`,
    title: 'Invalid Refresh Token',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCodes.AUTH_INVALID_API_KEY]: {
    type: `${PROBLEM_BASE_URL}/auth-invalid-api-key`,
    title: 'Invalid API Key',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },

  // Organization Problems
  [ErrorCodes.ORG_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/org-not-found`,
    title: 'Organization Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.ORG_ALREADY_EXISTS]: {
    type: `${PROBLEM_BASE_URL}/org-already-exists`,
    title: 'Organization Already Exists',
    defaultStatus: HttpStatus.CONFLICT,
  },
  [ErrorCodes.ORG_INACTIVE]: {
    type: `${PROBLEM_BASE_URL}/org-inactive`,
    title: 'Organization Inactive',
    defaultStatus: HttpStatus.FORBIDDEN,
  },

  // User Problems
  [ErrorCodes.USER_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/user-not-found`,
    title: 'User Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.USER_INACTIVE]: {
    type: `${PROBLEM_BASE_URL}/user-inactive`,
    title: 'User Inactive',
    defaultStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCodes.USER_ALREADY_EXISTS]: {
    type: `${PROBLEM_BASE_URL}/user-already-exists`,
    title: 'User Already Exists',
    defaultStatus: HttpStatus.CONFLICT,
  },

  // Application Problems
  [ErrorCodes.APP_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/app-not-found`,
    title: 'Application Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.APP_ALREADY_EXISTS]: {
    type: `${PROBLEM_BASE_URL}/app-already-exists`,
    title: 'Application Already Exists',
    defaultStatus: HttpStatus.CONFLICT,
  },
  [ErrorCodes.APP_INACTIVE]: {
    type: `${PROBLEM_BASE_URL}/app-inactive`,
    title: 'Application Inactive',
    defaultStatus: HttpStatus.FORBIDDEN,
  },

  // Provider Problems
  [ErrorCodes.PROVIDER_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/provider-not-found`,
    title: 'Provider Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.PROVIDER_DISABLED]: {
    type: `${PROBLEM_BASE_URL}/provider-disabled`,
    title: 'Provider Disabled',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.PROVIDER_DELIVERY_FAILED]: {
    type: `${PROBLEM_BASE_URL}/provider-delivery-failed`,
    title: 'Provider Delivery Failed',
    defaultStatus: HttpStatus.BAD_GATEWAY,
  },
  [ErrorCodes.PROVIDER_CONFIGURATION_INVALID]: {
    type: `${PROBLEM_BASE_URL}/provider-configuration-invalid`,
    title: 'Provider Configuration Invalid',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },

  // Provider Chain Problems
  [ErrorCodes.CHAIN_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/chain-not-found`,
    title: 'Provider Chain Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.CHAIN_ALREADY_EXISTS]: {
    type: `${PROBLEM_BASE_URL}/chain-already-exists`,
    title: 'Provider Chain Already Exists',
    defaultStatus: HttpStatus.CONFLICT,
  },
  [ErrorCodes.CHAIN_EXHAUSTED]: {
    type: `${PROBLEM_BASE_URL}/chain-exhausted`,
    title: 'Provider Chain Exhausted',
    defaultStatus: HttpStatus.BAD_GATEWAY,
  },
  [ErrorCodes.CHAIN_MEMBER_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/chain-member-not-found`,
    title: 'Chain Member Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.CHAIN_MEMBER_DUPLICATE]: {
    type: `${PROBLEM_BASE_URL}/chain-member-duplicate`,
    title: 'Chain Member Duplicate',
    defaultStatus: HttpStatus.CONFLICT,
  },

  // Notification Problems
  [ErrorCodes.NOTIFICATION_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/notification-not-found`,
    title: 'Notification Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.NOTIFICATION_ALREADY_PROCESSED]: {
    type: `${PROBLEM_BASE_URL}/notification-already-processed`,
    title: 'Notification Already Processed',
    defaultStatus: HttpStatus.CONFLICT,
  },
  [ErrorCodes.NOTIFICATION_INVALID_CHANNEL]: {
    type: `${PROBLEM_BASE_URL}/notification-invalid-channel`,
    title: 'Invalid Notification Channel',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.NOTIFICATION_DELIVERY_FAILED]: {
    type: `${PROBLEM_BASE_URL}/notification-delivery-failed`,
    title: 'Notification Delivery Failed',
    defaultStatus: HttpStatus.BAD_GATEWAY,
  },

  // API Key Problems
  [ErrorCodes.API_KEY_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/api-key-not-found`,
    title: 'API Key Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.API_KEY_INVALID]: {
    type: `${PROBLEM_BASE_URL}/api-key-invalid`,
    title: 'API Key Invalid',
    defaultStatus: HttpStatus.UNAUTHORIZED,
  },

  // Webhook Problems
  [ErrorCodes.WEBHOOK_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/webhook-not-found`,
    title: 'Webhook Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.WEBHOOK_DELIVERY_FAILED]: {
    type: `${PROBLEM_BASE_URL}/webhook-delivery-failed`,
    title: 'Webhook Delivery Failed',
    defaultStatus: HttpStatus.BAD_GATEWAY,
  },

  // Validation Problems
  [ErrorCodes.VALIDATION_FAILED]: {
    type: `${PROBLEM_BASE_URL}/validation-failed`,
    title: 'Validation Failed',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.VALIDATION_INVALID_UUID]: {
    type: `${PROBLEM_BASE_URL}/validation-invalid-uuid`,
    title: 'Invalid UUID',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: {
    type: `${PROBLEM_BASE_URL}/validation-invalid-email`,
    title: 'Invalid Email',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.INVALID_INPUT]: {
    type: `${PROBLEM_BASE_URL}/invalid-input`,
    title: 'Invalid Input',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },

  // General Problems
  [ErrorCodes.GENERAL_INTERNAL_ERROR]: {
    type: `${PROBLEM_BASE_URL}/internal-error`,
    title: 'Internal Server Error',
    defaultStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCodes.GENERAL_NOT_FOUND]: {
    type: `${PROBLEM_BASE_URL}/not-found`,
    title: 'Not Found',
    defaultStatus: HttpStatus.NOT_FOUND,
  },
  [ErrorCodes.GENERAL_BAD_REQUEST]: {
    type: `${PROBLEM_BASE_URL}/bad-request`,
    title: 'Bad Request',
    defaultStatus: HttpStatus.BAD_REQUEST,
  },
  [ErrorCodes.GENERAL_FORBIDDEN]: {
    type: `${PROBLEM_BASE_URL}/forbidden`,
    title: 'Forbidden',
    defaultStatus: HttpStatus.FORBIDDEN,
  },
  [ErrorCodes.GENERAL_CONFLICT]: {
    type: `${PROBLEM_BASE_URL}/conflict`,
    title: 'Conflict',
    defaultStatus: HttpStatus.CONFLICT,
  },
};

/**
 * Get problem type information for an error code
 */
export function getProblemType(errorCode: ErrorCode): ProblemType {
  return ProblemTypes[errorCode] || ProblemTypes[ErrorCodes.GENERAL_INTERNAL_ERROR];
}
