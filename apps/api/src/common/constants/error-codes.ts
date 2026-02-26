/**
 * Application Error Codes
 *
 * Format: MODULE_ERROR_TYPE
 * These codes are used by the frontend for localization and user-friendly error messages
 */

export const ErrorCodes = {
  // Authentication Errors (AUTH_*)
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_ALREADY_EXISTS: 'AUTH_USER_ALREADY_EXISTS',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_INVALID_REFRESH_TOKEN: 'AUTH_INVALID_REFRESH_TOKEN',
  AUTH_INVALID_API_KEY: 'AUTH_INVALID_API_KEY',

  // Organization Errors (ORG_*)
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  ORG_ALREADY_EXISTS: 'ORG_ALREADY_EXISTS',
  ORG_INACTIVE: 'ORG_INACTIVE',

  // User Errors (USER_*)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // Application Errors (APP_*)
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_ALREADY_EXISTS: 'APP_ALREADY_EXISTS',
  APP_INACTIVE: 'APP_INACTIVE',

  // Provider Errors (PROVIDER_*)
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_DISABLED: 'PROVIDER_DISABLED',
  PROVIDER_DELIVERY_FAILED: 'PROVIDER_DELIVERY_FAILED',
  PROVIDER_CONFIGURATION_INVALID: 'PROVIDER_CONFIGURATION_INVALID',

  // Provider Chain Errors (CHAIN_*)
  CHAIN_NOT_FOUND: 'CHAIN_NOT_FOUND',
  CHAIN_ALREADY_EXISTS: 'CHAIN_ALREADY_EXISTS',
  CHAIN_EXHAUSTED: 'CHAIN_EXHAUSTED',
  CHAIN_MEMBER_NOT_FOUND: 'CHAIN_MEMBER_NOT_FOUND',
  CHAIN_MEMBER_DUPLICATE: 'CHAIN_MEMBER_DUPLICATE',

  // Notification Errors (NOTIFICATION_*)
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_ALREADY_PROCESSED: 'NOTIFICATION_ALREADY_PROCESSED',
  NOTIFICATION_INVALID_CHANNEL: 'NOTIFICATION_INVALID_CHANNEL',
  NOTIFICATION_DELIVERY_FAILED: 'NOTIFICATION_DELIVERY_FAILED',

  // API Key Errors (API_KEY_*)
  API_KEY_NOT_FOUND: 'API_KEY_NOT_FOUND',
  API_KEY_INVALID: 'API_KEY_INVALID',

  // Webhook Errors (WEBHOOK_*)
  WEBHOOK_NOT_FOUND: 'WEBHOOK_NOT_FOUND',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',

  // Validation Errors (VALIDATION_*)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_INVALID_UUID: 'VALIDATION_INVALID_UUID',
  VALIDATION_INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
  INVALID_INPUT: 'INVALID_INPUT',

  // General Errors (GENERAL_*)
  GENERAL_INTERNAL_ERROR: 'GENERAL_INTERNAL_ERROR',
  GENERAL_NOT_FOUND: 'GENERAL_NOT_FOUND',
  GENERAL_BAD_REQUEST: 'GENERAL_BAD_REQUEST',
  GENERAL_FORBIDDEN: 'GENERAL_FORBIDDEN',
  GENERAL_CONFLICT: 'GENERAL_CONFLICT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error messages mapping for development/fallback
 * Frontend should use these codes for i18n
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid username or password',
  [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: 'User with this username already exists',
  [ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.AUTH_INVALID_REFRESH_TOKEN]: 'Invalid refresh token',
  [ErrorCodes.AUTH_INVALID_API_KEY]: 'Invalid API key',

  // Organization
  [ErrorCodes.ORG_NOT_FOUND]: 'Organization not found',
  [ErrorCodes.ORG_ALREADY_EXISTS]: 'Organization already exists',
  [ErrorCodes.ORG_INACTIVE]: 'Organization is inactive',

  // User
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_INACTIVE]: 'User account is inactive',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User already exists',

  // Application
  [ErrorCodes.APP_NOT_FOUND]: 'Application not found',
  [ErrorCodes.APP_ALREADY_EXISTS]: 'Application already exists',
  [ErrorCodes.APP_INACTIVE]: 'Application is inactive',

  // Provider
  [ErrorCodes.PROVIDER_NOT_FOUND]: 'Provider not found',
  [ErrorCodes.PROVIDER_DISABLED]: 'Provider is disabled',
  [ErrorCodes.PROVIDER_DELIVERY_FAILED]: 'Provider delivery failed',
  [ErrorCodes.PROVIDER_CONFIGURATION_INVALID]: 'Provider configuration is invalid',

  // Provider Chain
  [ErrorCodes.CHAIN_NOT_FOUND]: 'Provider chain not found',
  [ErrorCodes.CHAIN_ALREADY_EXISTS]: 'Provider chain already exists',
  [ErrorCodes.CHAIN_EXHAUSTED]: 'All providers in chain have been exhausted',
  [ErrorCodes.CHAIN_MEMBER_NOT_FOUND]: 'Provider chain member not found',
  [ErrorCodes.CHAIN_MEMBER_DUPLICATE]: 'Provider is already a member of this chain',

  // Notification
  [ErrorCodes.NOTIFICATION_NOT_FOUND]: 'Notification not found',
  [ErrorCodes.NOTIFICATION_ALREADY_PROCESSED]: 'Notification has already been processed',
  [ErrorCodes.NOTIFICATION_INVALID_CHANNEL]: 'Invalid notification channel type',
  [ErrorCodes.NOTIFICATION_DELIVERY_FAILED]: 'Notification delivery failed',

  // API Key
  [ErrorCodes.API_KEY_NOT_FOUND]: 'API key not found',
  [ErrorCodes.API_KEY_INVALID]: 'API key is invalid',

  // Webhook
  [ErrorCodes.WEBHOOK_NOT_FOUND]: 'Webhook not found',
  [ErrorCodes.WEBHOOK_DELIVERY_FAILED]: 'Webhook delivery failed',

  // Validation
  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCodes.VALIDATION_INVALID_UUID]: 'Invalid ID format',
  [ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Invalid email format',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',

  // General
  [ErrorCodes.GENERAL_INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.GENERAL_NOT_FOUND]: 'Resource not found',
  [ErrorCodes.GENERAL_BAD_REQUEST]: 'Bad request',
  [ErrorCodes.GENERAL_FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.GENERAL_CONFLICT]: 'Resource conflict',
};
