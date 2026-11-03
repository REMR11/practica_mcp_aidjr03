import { describe, expect, it } from 'vitest';
import { normalizeHttpMethod } from '../../../src/domain/types/HttpMethod.js';

describe('HttpMethod', () => {
  it('normalizes method names to uppercase', () => {
    expect(normalizeHttpMethod('get')).toBe('GET');
    expect(normalizeHttpMethod('Post')).toBe('POST');
  });

  it('rejects unsupported methods', () => {
    expect(() => normalizeHttpMethod('TRACE')).toThrow(/Unsupported HTTP method/);
  });
});
