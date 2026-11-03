import { describe, expect, it } from 'vitest';

import { InvalidHttpMethodError } from '../../../src/domain/errors/DomainError.js';
import { isHttpMethod, parseHttpMethod } from '../../../src/domain/entities/HttpMethod.js';

describe('parseHttpMethod', () => {
  it('normaliza el método a mayúsculas', () => {
    expect(parseHttpMethod('get')).toBe('GET');
    expect(parseHttpMethod(' Post ')).toBe('POST');
  });

  it('rechaza un método desconocido', () => {
    expect(() => parseHttpMethod('FETCH')).toThrow(InvalidHttpMethodError);
    expect(isHttpMethod('CONNECT')).toBe(false);
  });
});
