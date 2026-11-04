import { describe, expect, it } from 'vitest';

import { DocumentationService } from '../../../src/application/services/DocumentationService.js';
import { createApiEndpoint } from '../../../src/domain/entities/ApiEndpoint.js';
import type { ApiDocumentation } from '../../../src/domain/entities/ApiDocumentation.js';
import { createApiSchema } from '../../../src/domain/entities/ApiSchema.js';
import {
  EndpointNotFoundError,
  InvalidHttpMethodError,
  InvalidQueryError,
  SchemaNotFoundError,
} from '../../../src/domain/errors/DomainError.js';
import { InMemoryDocumentationRepository } from '../../helpers/InMemoryDocumentationRepository.js';

const document: ApiDocumentation = {
  title: 'Users API',
  version: '1.0.0',
  openApiVersion: '3.0.3',
  sourceName: 'openapi.yaml',
  servers: [],
  tags: [],
  security: [],
  endpoints: [
    createApiEndpoint({
      path: '/api/users',
      method: 'GET',
      tags: ['users'],
      summary: 'Lista usuarios',
      description: 'Devuelve los usuarios registrados.',
      responses: [{ statusCode: '200', description: 'Correcto', content: [] }],
    }),
    createApiEndpoint({
      path: '/api/auth/login',
      method: 'POST',
      tags: ['auth'],
      description: 'Autenticación con correo y contraseña.',
      responses: [{ statusCode: '200', description: 'Sesión creada', content: [] }],
    }),
  ],
  schemas: [
    createApiSchema({
      name: 'User',
      type: 'object',
      description: 'Usuario registrado',
      properties: { email: { type: 'string', format: 'email' } },
    }),
  ],
};

describe('casos de uso de documentación', () => {
  const service = new DocumentationService(new InMemoryDocumentationRepository(document));

  it('busca por ruta, método, descripción y etiqueta, y ordena de forma estable', async () => {
    const first = await service.search('  USER  ');
    const second = await service.search('user');

    expect(first.query).toBe('user');
    expect(first.matches.map(describeMatch)).toEqual(second.matches.map(describeMatch));
    expect(first.matches.map(describeMatch)).toEqual(['schema:User', 'endpoint:GET /api/users']);
    expect(await service.search('autenticación')).toMatchObject({
      matches: [{ kind: 'endpoint', endpoint: { path: '/api/auth/login', method: 'POST' } }],
    });
    expect(await service.search('GET')).toMatchObject({
      matches: [{ kind: 'endpoint', endpoint: { method: 'GET' } }],
    });
    expect((await service.search('no-existe')).matches).toEqual([]);
    await expect(service.search('   ')).rejects.toBeInstanceOf(InvalidQueryError);
  });

  it('normaliza los filtros y devuelve una lista vacía cuando no hay coincidencias', async () => {
    const endpoints = await service.list({ method: 'post', tag: ' Auth ' });
    expect(endpoints.map((endpoint) => endpoint.path)).toEqual(['/api/auth/login']);
    expect(await service.list({ tag: 'missing' })).toEqual([]);
    await expect(service.list({ method: 'FETCH' })).rejects.toBeInstanceOf(InvalidHttpMethodError);
  });

  it('obtiene un endpoint o un esquema y falla cuando no existen', async () => {
    await expect(service.endpoint(' /api/users ', 'get')).resolves.toMatchObject({
      method: 'GET',
      path: '/api/users',
    });
    await expect(service.endpoint('/api/missing', 'GET')).rejects.toBeInstanceOf(
      EndpointNotFoundError,
    );
    await expect(service.endpoint('  ', 'GET')).rejects.toBeInstanceOf(InvalidQueryError);

    await expect(service.schema(' User ')).resolves.toMatchObject({ name: 'User' });
    await expect(service.schema('Account')).rejects.toBeInstanceOf(SchemaNotFoundError);
    await expect(service.schema('   ')).rejects.toBeInstanceOf(InvalidQueryError);
  });
});

function describeMatch(match: {
  kind: string;
  endpoint?: { method: string; path: string };
  schema?: { name: string };
}): string {
  return match.kind === 'endpoint' && match.endpoint !== undefined
    ? `endpoint:${match.endpoint.method} ${match.endpoint.path}`
    : `schema:${match.schema?.name}`;
}
