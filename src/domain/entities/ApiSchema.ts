import { InvalidSchemaError } from '../errors/DomainError.js';
import type { SchemaConstraint } from './SchemaConstraint.js';

export interface ApiSchema {
  readonly name: string;
  readonly required: readonly string[];
  readonly properties: Readonly<Record<string, SchemaConstraint>>;
  readonly constraints: SchemaConstraint;
  readonly description?: string;
  readonly type?: string;
}

export interface ApiSchemaInput {
  readonly name: string;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, SchemaConstraint>>;
  readonly constraints?: SchemaConstraint;
  readonly description?: string;
  readonly type?: string;
}

export function createApiSchema(input: ApiSchemaInput): ApiSchema {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new InvalidSchemaError('El nombre del esquema no puede estar vacío.');
  }

  const required = [...(input.required ?? [])];
  const properties = { ...(input.properties ?? {}) };
  for (const propertyName of required) {
    if (
      !(propertyName in properties) &&
      input.constraints?.properties?.[propertyName] === undefined
    ) {
      throw new InvalidSchemaError(
        `La propiedad obligatoria "${propertyName}" no existe en el esquema "${name}".`,
      );
    }
  }

  const description = input.description?.trim();
  const type = input.type?.trim();
  const definedType = type !== undefined && type.length > 0 ? type : undefined;
  const definedDescription =
    description !== undefined && description.length > 0 ? description : undefined;

  const constraints: SchemaConstraint = input.constraints ?? {
    properties,
    required,
    ...(definedType !== undefined ? { type: definedType } : {}),
  };

  return {
    name,
    required,
    properties,
    constraints,
    ...(definedDescription !== undefined ? { description: definedDescription } : {}),
    ...(definedType !== undefined ? { type: definedType } : {}),
  };
}
