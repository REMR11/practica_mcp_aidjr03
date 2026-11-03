import { describe, expect, it } from 'vitest';

import { createApiEndpoint, endpointKey } from '../../../src/domain/entities/ApiEndpoint.js';
import { InvalidEndpointError } from '../../../src/domain/errors/DomainError.js';

describe('createApiEndpoint', () => {
  it('acepta una operación sin cuerpo de solicitud', () => {
    const endpoint = createApiEndpoint({
      path: '/api/users',
      method: 'get',
      summary: 'Lista usuarios',
      parameters: [{ name: 'id', location: 'path', description: 'Identificador' }],
      responses: [{ statusCode: '200', description: 'Correcto', content: [] }],
    });

    expect(endpoint.method).toBe('GET');
    expect(endpoint.requestBody).toBeUndefined();
    expect(endpoint.parameters[0]).toMatchObject({ name: 'id', location: 'path', required: true });
    expect(endpointKey(endpoint.path, endpoint.method)).toBe('GET /api/users');
  });

  it('rechaza una ruta inválida, un parámetro vacío y un código repetido', () => {
    expect(() => createApiEndpoint({ path: 'users', method: 'GET' })).toThrow(InvalidEndpointError);
    expect(() =>
      createApiEndpoint({
        path: '/users',
        method: 'GET',
        parameters: [{ name: ' ', location: 'query' }],
      }),
    ).toThrow(InvalidEndpointError);
    expect(() =>
      createApiEndpoint({
        path: '/users/{id}',
        method: 'DELETE',
        parameters: [{ name: 'id', location: 'path', required: false }],
      }),
    ).toThrow(/obligatorio/);
    expect(() =>
      createApiEndpoint({
        path: '/users',
        method: 'GET',
        responses: [
          { statusCode: '200', description: 'Uno', content: [] },
          { statusCode: '200', description: 'Dos', content: [] },
        ],
      }),
    ).toThrow(/repite el código/);
  });
});
