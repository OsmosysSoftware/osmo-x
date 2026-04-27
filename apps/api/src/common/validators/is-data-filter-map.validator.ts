import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const KEY_RE = /^[a-zA-Z0-9_]{1,64}$/;
const RESERVED_PROTO = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_VALUE_LEN = 255;

@ValidatorConstraint({ name: 'IsDataFilterMap', async: false })
export class IsDataFilterMap implements ValidatorConstraintInterface {
  validate(value: unknown, _args?: ValidationArguments): boolean {
    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (RESERVED_PROTO.has(k)) {
        return false;
      }

      if (!KEY_RE.test(k)) {
        return false;
      }

      if (typeof v !== 'string' || v.length === 0 || v.length > MAX_VALUE_LEN) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(_args?: ValidationArguments): string {
    return (
      'data_filter must be an object whose keys match ^[a-zA-Z0-9_]{1,64}$ and ' +
      `values are non-empty strings up to ${MAX_VALUE_LEN} chars`
    );
  }
}
