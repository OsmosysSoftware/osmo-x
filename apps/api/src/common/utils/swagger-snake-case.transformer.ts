/**
 * Swagger Snake Case Transformer
 * Transforms an OpenAPI document to use snake_case for all property names.
 * This ensures Swagger documentation matches the actual API responses
 * transformed by SnakeCaseInterceptor.
 */

import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Converts a camelCase string to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transforms all property names in an object to snake_case
 */
function transformProperties(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformProperties);
  }

  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = toSnakeCase(key);
    transformed[snakeKey] = transformProperties(value);
  }

  return transformed;
}

/**
 * Transforms an OpenAPI document to use snake_case for all property names.
 * This ensures Swagger documentation matches the actual API responses
 * transformed by SnakeCaseInterceptor.
 */
export function transformSwaggerToSnakeCase(document: OpenAPIObject): OpenAPIObject {
  // Transform all schema properties
  if (document.components?.schemas) {
    for (const [, schema] of Object.entries(document.components.schemas)) {
      if (schema && typeof schema === 'object' && 'properties' in schema) {
        const properties = schema.properties as Record<string, unknown>;
        const transformedProperties: Record<string, unknown> = {};

        for (const [propName, propDef] of Object.entries(properties)) {
          const snakeName = toSnakeCase(propName);
          transformedProperties[snakeName] = propDef;
        }

        schema.properties = transformedProperties;

        if (Array.isArray(schema.required)) {
          schema.required = schema.required.map(toSnakeCase);
        }
      }
    }
  }

  // Transform request/response examples in paths
  if (document.paths) {
    for (const [, pathItem] of Object.entries(document.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [, operation] of Object.entries(pathItem)) {
        if (!operation || typeof operation !== 'object') continue;

        // Transform request body examples
        if ('requestBody' in operation && operation.requestBody) {
          const requestBody = operation.requestBody as Record<string, unknown>;

          if (requestBody.content) {
            for (const [, content] of Object.entries(
              requestBody.content as Record<string, unknown>,
            )) {
              if (content && typeof content === 'object' && 'example' in content) {
                (content as Record<string, unknown>).example = transformProperties(
                  (content as Record<string, unknown>).example,
                );
              }

              if (content && typeof content === 'object' && 'examples' in content) {
                const examples = (content as Record<string, unknown>).examples as Record<
                  string,
                  unknown
                >;

                for (const [, example] of Object.entries(examples)) {
                  if (example && typeof example === 'object' && 'value' in example) {
                    (example as Record<string, unknown>).value = transformProperties(
                      (example as Record<string, unknown>).value,
                    );
                  }
                }
              }
            }
          }
        }

        // Transform response examples
        if ('responses' in operation && operation.responses) {
          for (const [, resp] of Object.entries(operation.responses as Record<string, unknown>)) {
            if (!resp || typeof resp !== 'object') continue;
            const responseObj = resp as Record<string, unknown>;

            if (responseObj.content) {
              for (const [, content] of Object.entries(
                responseObj.content as Record<string, unknown>,
              )) {
                if (content && typeof content === 'object' && 'example' in content) {
                  (content as Record<string, unknown>).example = transformProperties(
                    (content as Record<string, unknown>).example,
                  );
                }

                if (content && typeof content === 'object' && 'examples' in content) {
                  const examples = (content as Record<string, unknown>).examples as Record<
                    string,
                    unknown
                  >;

                  for (const [, example] of Object.entries(examples)) {
                    if (example && typeof example === 'object' && 'value' in example) {
                      (example as Record<string, unknown>).value = transformProperties(
                        (example as Record<string, unknown>).value,
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return document;
}
