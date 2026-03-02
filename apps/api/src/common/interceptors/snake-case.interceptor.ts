/**
 * Snake Case Transformation Interceptor
 * Automatically transforms response keys from camelCase to snake_case
 * and request body keys from snake_case to camelCase.
 * Following Zalando RESTful API Guidelines.
 *
 * Applied ONLY to v1 endpoints (via controller-level @UseInterceptors).
 * Existing endpoints are unaffected.
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Keys whose values are arbitrary JSON blobs (user/provider-defined).
 * The key itself is still converted, but the nested object is passed through as-is.
 */
const PASSTHROUGH_VALUE_KEYS = new Set([
  'configuration',
  'data',
  'result',
  'whitelistRecipients',
  'whitelist_recipients',
]);

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Transform request body from snake_case to camelCase
    if (request.body && typeof request.body === 'object') {
      request.body = this.transformToCamelCase(request.body);
    }

    // Transform response from camelCase to snake_case
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return data;
        }

        if (Buffer.isBuffer(data) || typeof data !== 'object') {
          return data;
        }

        return this.transformToSnakeCase(data);
      }),
    );
  }

  /**
   * Recursively transform object keys to snake_case
   */
  private transformToSnakeCase(obj: unknown, seen = new WeakSet()): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformToSnakeCase(item, seen));
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Detect circular references
    if (seen.has(obj as object)) {
      return undefined;
    }

    seen.add(obj as object);

    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const transformedKey = this.shouldPreserveKey(key) ? key : this.toSnakeCase(key);
      transformed[transformedKey] = PASSTHROUGH_VALUE_KEYS.has(key)
        ? value
        : this.transformToSnakeCase(value, seen);
    }

    return transformed;
  }

  /**
   * Recursively transform object keys to camelCase
   */
  private transformToCamelCase(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformToCamelCase(item));
    }

    if (typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }

    const transformed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const transformedKey = this.shouldPreserveKey(key) ? key : this.toCamelCase(key);
      transformed[transformedKey] = PASSTHROUGH_VALUE_KEYS.has(key)
        ? value
        : this.transformToCamelCase(value);
    }

    return transformed;
  }

  /**
   * Check if a key should be preserved (not transformed).
   * Preserve: _links, _metadata, _pagination (HATEOAS/metadata fields)
   */
  private shouldPreserveKey(key: string): boolean {
    return key.startsWith('_');
  }

  /**
   * Convert string from camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Convert string from snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  }
}
