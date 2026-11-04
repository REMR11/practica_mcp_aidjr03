import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { InvalidDocumentationError } from '../../../src/domain/errors/DomainError.js';
import { OpenApiParser } from '../../../src/infrastructure/parsers/OpenApiParser.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const parser = new OpenApiParser();

describe('OpenApiParser', () => {
  it('interpreta el ejemplo YAML y resuelve referencias internas', async () => {
    const document = await parser.parseFile(
      path.join(root, 'examples/openapi.yaml'),
      'openapi.yaml',
    );

    expect(document.title).toBe('Users API');
    expect(document.openApiVersion).toBe('3.0.3');
    expect(document.sourceName).toBe('openapi.yaml');
    expect(document.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      'GET /api/users',
      'POST /api/users',
      'GET /api/users/{userId}',
      'POST /api/auth/login',
    ]);

    const listUsers = document.endpoints[0];
    expect(listUsers?.requestBody).toBeUndefined();
    expect(listUsers?.parameters[0]).toMatchObject({ name: 'role', location: 'query' });
    expect(listUsers?.responses[0]?.content[0]?.schema?.items).toMatchObject({
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    });

    const getUser = document.endpoints[2];
    expect(getUser?.parameters[0]).toMatchObject({
      name: 'userId',
      location: 'path',
      required: true,
    });
    expect(getUser?.security).toEqual([{ name: 'bearerAuth', scopes: [] }]);

    const login = document.endpoints[3];
    expect(login?.security).toEqual([]);
    expect(login?.requestBody?.content[0]?.schema?.properties?.password).toMatchObject({
      minLength: 8,
      maxLength: 72,
    });

    const user = document.schemas.find((schema) => schema.name === 'User');
    expect(user?.required).toEqual(['id', 'email']);
    expect(user?.properties.role).toMatchObject({ enum: ['admin', 'member'] });
  });

  it('interpreta un documento JSON', async () => {
    const document = await parser.parseFile(
      path.join(root, 'tests/fixtures/users.json'),
      'users.json',
    );

    expect(document.endpoints).toHaveLength(1);
    expect(document.schemas[0]?.name).toBe('User');
    expect(document.endpoints[0]?.responses[0]?.content[0]?.schema?.items?.properties?.id).toEqual({
      type: 'string',
    });
  });

  it('rechaza documentos inválidos, Swagger 2.0 y referencias ausentes', async () => {
    await expect(
      parser.parseFile(
        path.join(root, 'tests/fixtures/invalid-openapi.yaml'),
        'invalid-openapi.yaml',
      ),
    ).rejects.toBeInstanceOf(InvalidDocumentationError);
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/swagger-v2.yaml'), 'swagger-v2.yaml'),
    ).rejects.toThrow(/OpenAPI 3\.x/);
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/missing-ref.yaml'), 'missing-ref.yaml'),
    ).rejects.toThrow(/[Rr]eferencia/);
  });

  it('rechaza referencias circulares y YAML malformado', async () => {
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/circular.yaml'), 'circular.yaml'),
    ).rejects.toThrow(/circulares/);
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/malformed.yaml'), 'malformed.yaml'),
    ).rejects.toBeInstanceOf(InvalidDocumentationError);
  });

  it('no descarga referencias externas ni lee archivos vecinos', async () => {
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/external-ref.yaml'), 'external-ref.yaml'),
    ).rejects.toThrow(/example\.invalid/);
    await expect(
      parser.parseFile(path.join(root, 'tests/fixtures/sibling-ref.yaml'), 'sibling-ref.yaml'),
    ).rejects.toThrow(InvalidDocumentationError);

    try {
      await parser.parseFile(
        path.join(root, 'tests/fixtures/sibling-ref.yaml'),
        'sibling-ref.yaml',
      );
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDocumentationError);
      expect((error as Error).message).not.toContain('SECRET_EXTERNAL_MARKER');
      expect((error as Error).message).not.toContain(root);
    }
  });
});
