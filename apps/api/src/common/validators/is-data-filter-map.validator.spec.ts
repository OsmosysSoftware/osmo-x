import { IsDataFilterMap } from './is-data-filter-map.validator';

describe('IsDataFilterMap', () => {
  let validator: IsDataFilterMap;

  beforeEach(() => {
    validator = new IsDataFilterMap();
  });

  it('accepts undefined and null', () => {
    expect(validator.validate(undefined)).toBe(true);
    expect(validator.validate(null)).toBe(true);
  });

  it('accepts a flat object of string values with valid keys', () => {
    expect(validator.validate({ template: 'otp_v2', locale: 'en' })).toBe(true);
    expect(validator.validate({ a: 'x', _b: 'y', c1: 'z' })).toBe(true);
  });

  it('rejects arrays', () => {
    expect(validator.validate([])).toBe(false);
    expect(validator.validate(['template', 'otp_v2'])).toBe(false);
  });

  it('rejects non-object primitives', () => {
    expect(validator.validate('string')).toBe(false);
    expect(validator.validate(42)).toBe(false);
    expect(validator.validate(true)).toBe(false);
  });

  it('rejects prototype-pollution keys directly invoked', () => {
    // Express qs typically strips these before class-validator sees them, but the
    // validator must still reject them as defense in depth.
    // Object.fromEntries is required because a literal { __proto__: 'x' } sets the
    // prototype slot, not an own property — Object.entries returns [] and the
    // validator never sees the key.
    expect(validator.validate(Object.fromEntries([['__proto__', 'x']]))).toBe(false);
    expect(validator.validate(Object.fromEntries([['constructor', 'x']]))).toBe(false);
    expect(validator.validate(Object.fromEntries([['prototype', 'x']]))).toBe(false);
  });

  it('rejects keys outside [a-zA-Z0-9_] or longer than 64 chars', () => {
    expect(validator.validate({ 'bad-key': 'x' })).toBe(false);
    expect(validator.validate({ 'bad key': 'x' })).toBe(false);
    expect(validator.validate({ 'bad.key': 'x' })).toBe(false);
    expect(validator.validate({ ['a'.repeat(65)]: 'x' })).toBe(false);
    expect(validator.validate({ '': 'x' })).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(validator.validate({ k: 1 } as Record<string, unknown>)).toBe(false);
    expect(validator.validate({ k: true } as Record<string, unknown>)).toBe(false);
    expect(validator.validate({ k: null } as Record<string, unknown>)).toBe(false);
    expect(validator.validate({ k: { nested: 'object' } } as Record<string, unknown>)).toBe(false);
    expect(validator.validate({ k: ['a', 'b'] } as Record<string, unknown>)).toBe(false);
  });

  it('rejects empty string values and oversized values', () => {
    expect(validator.validate({ k: '' })).toBe(false);
    expect(validator.validate({ k: 'a'.repeat(256) })).toBe(false);
    expect(validator.validate({ k: 'a'.repeat(255) })).toBe(true);
  });

  it('exposes a default message', () => {
    expect(validator.defaultMessage()).toContain('data_filter');
  });
});
