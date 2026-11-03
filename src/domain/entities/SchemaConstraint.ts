/**
 * Subconjunto de JSON Schema que el dominio conserva de una especificación OpenAPI.
 * Es un dato plano: no contiene funciones ni referencias circulares.
 */
export interface SchemaConstraint {
  readonly type?: string;
  readonly format?: string;
  readonly title?: string;
  readonly description?: string;
  readonly nullable?: boolean;
  readonly required?: readonly string[];
  readonly properties?: Readonly<Record<string, SchemaConstraint>>;
  readonly items?: SchemaConstraint;
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly example?: unknown;
  readonly default?: unknown;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;
  readonly additionalProperties?: boolean | SchemaConstraint;
  readonly oneOf?: readonly SchemaConstraint[];
  readonly anyOf?: readonly SchemaConstraint[];
  readonly allOf?: readonly SchemaConstraint[];
}

export const PARAMETER_LOCATIONS = ['query', 'header', 'path', 'cookie'] as const;

export type ParameterLocation = (typeof PARAMETER_LOCATIONS)[number];

export function isParameterLocation(value: string): value is ParameterLocation {
  return (PARAMETER_LOCATIONS as readonly string[]).includes(value);
}
