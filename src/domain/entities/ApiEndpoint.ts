import { InvalidEndpointError } from '../errors/DomainError.js';
import { parseHttpMethod, type HttpMethod } from './HttpMethod.js';
import {
  isParameterLocation,
  type ParameterLocation,
  type SchemaConstraint,
} from './SchemaConstraint.js';

export interface ApiParameter {
  readonly name: string;
  readonly location: ParameterLocation;
  readonly required: boolean;
  readonly deprecated: boolean;
  readonly description?: string;
  readonly schema?: SchemaConstraint;
  readonly example?: unknown;
}

export interface ApiMediaContent {
  readonly mediaType: string;
  readonly schema?: SchemaConstraint;
  readonly example?: unknown;
}

export interface ApiRequestBody {
  readonly required: boolean;
  readonly description?: string;
  readonly content: readonly ApiMediaContent[];
}

export interface ApiResponse {
  readonly statusCode: string;
  readonly description: string;
  readonly content: readonly ApiMediaContent[];
}

export interface ApiSecurityRequirement {
  readonly name: string;
  readonly scopes: readonly string[];
}

export interface ApiEndpoint {
  readonly path: string;
  readonly method: HttpMethod;
  readonly tags: readonly string[];
  readonly deprecated: boolean;
  readonly parameters: readonly ApiParameter[];
  readonly responses: readonly ApiResponse[];
  readonly security: readonly ApiSecurityRequirement[];
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly requestBody?: ApiRequestBody;
}

export interface ApiParameterInput {
  readonly name: string;
  readonly location: string;
  readonly required?: boolean;
  readonly deprecated?: boolean;
  readonly description?: string;
  readonly schema?: SchemaConstraint;
  readonly example?: unknown;
}

export interface ApiEndpointInput {
  readonly path: string;
  readonly method: string;
  readonly tags?: readonly string[];
  readonly deprecated?: boolean;
  readonly parameters?: readonly ApiParameterInput[];
  readonly responses?: readonly ApiResponse[];
  readonly security?: readonly ApiSecurityRequirement[];
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly requestBody?: ApiRequestBody;
}

export function createApiParameter(input: ApiParameterInput): ApiParameter {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new InvalidEndpointError('El nombre del parámetro no puede estar vacío.');
  }
  if (!isParameterLocation(input.location)) {
    throw new InvalidEndpointError(`Ubicación de parámetro no válida: ${input.location}`);
  }
  if (input.location === 'path' && input.required === false) {
    throw new InvalidEndpointError(`El parámetro de ruta "${name}" debe ser obligatorio.`);
  }

  return {
    name,
    location: input.location,
    required: input.location === 'path' ? true : (input.required ?? false),
    deprecated: input.deprecated ?? false,
    ...optionalFields({
      description: input.description,
      schema: input.schema,
      example: input.example,
    }),
  };
}

export function createApiEndpoint(input: ApiEndpointInput): ApiEndpoint {
  const path = input.path.trim();
  if (!path.startsWith('/') || /\s/.test(path)) {
    throw new InvalidEndpointError(`La ruta del endpoint no es válida: ${input.path}`);
  }

  const method = parseHttpMethod(input.method);
  const parameters = (input.parameters ?? []).map((parameter) => createApiParameter(parameter));
  const responses = (input.responses ?? []).map((response) => normalizeResponse(response));
  assertUniqueStatusCodes(path, method, responses);

  const operationId = normalizeOptionalText(input.operationId);
  if (input.operationId !== undefined && operationId === undefined) {
    throw new InvalidEndpointError('El operationId no puede estar vacío.');
  }

  return {
    path,
    method,
    tags: [...(input.tags ?? [])],
    deprecated: input.deprecated ?? false,
    parameters,
    responses,
    security: (input.security ?? []).map((requirement) => ({
      name: requirement.name,
      scopes: [...requirement.scopes],
    })),
    ...optionalFields({
      operationId,
      summary: normalizeOptionalText(input.summary),
      description: normalizeOptionalText(input.description),
      requestBody: input.requestBody,
    }),
  };
}

export function endpointKey(path: string, method: HttpMethod): string {
  return `${method} ${path}`;
}

function normalizeResponse(response: ApiResponse): ApiResponse {
  const statusCode = response.statusCode.trim();
  if (!/^(?:[1-5]\d{2}|default)$/.test(statusCode)) {
    throw new InvalidEndpointError(`Código de respuesta no válido: ${response.statusCode}`);
  }
  const description = response.description.trim();
  if (description.length === 0) {
    throw new InvalidEndpointError(`La respuesta ${statusCode} no tiene descripción.`);
  }
  return {
    statusCode,
    description,
    content: response.content.map((item) => ({
      mediaType: item.mediaType,
      ...optionalFields({ schema: item.schema, example: item.example }),
    })),
  };
}

function assertUniqueStatusCodes(
  path: string,
  method: HttpMethod,
  responses: readonly ApiResponse[],
): void {
  const seen = new Set<string>();
  for (const response of responses) {
    if (seen.has(response.statusCode)) {
      throw new InvalidEndpointError(
        `El endpoint ${method} ${path} repite el código ${response.statusCode}.`,
      );
    }
    seen.add(response.statusCode);
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalFields<T extends Record<string, unknown>>(
  fields: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const defined: { [K in keyof T]?: Exclude<T[K], undefined> } = {};
  for (const key of Object.keys(fields) as (keyof T)[]) {
    const value = fields[key];
    if (value !== undefined) {
      defined[key] = value as Exclude<T[keyof T], undefined>;
    }
  }
  return defined;
}
