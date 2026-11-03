import { describe, expect, it } from 'vitest';

import { createApiSchema } from '../../../src/domain/entities/ApiSchema.js';
import { InvalidSchemaError, SchemaNotFoundError } from '../../../src/domain/errors/DomainError.js';

describe('createApiSchema', () => {
  it('conserva propiedades, tipos y restricciones', () => {
    const schema = createApiSchema({
      name: 'User',
      description: 'Usuario',
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        age: { type: 'integer', minimum: 0 },
      },
    });

    expect(schema.name).toBe('User');
    expect(schema.required).toEqual(['id']);
    expect(schema.properties.age).toMatchObject({ minimum: 0 });
  });

  it('rechaza un nombre vacío o una propiedad obligatoria inexistente', () => {
    expect(() => createApiSchema({ name: '   ' })).toThrow(InvalidSchemaError);
    expect(() =>
      createApiSchema({
        name: 'User',
        required: ['email'],
        properties: { id: { type: 'string' } },
      }),
    ).toThrow(InvalidSchemaError);
  });
});

describe('errores de dominio', () => {
  it('expone un código estable sin incluir rutas internas', () => {
    const error = new SchemaNotFoundError('User');
    expect(error.code).toBe('SCHEMA_NOT_FOUND');
    expect(error.message).toContain('User');
    expect(error.message).not.toContain('/workspace');
  });
});
