import type { ApiDocumentation, ApiTag } from '../../domain/entities/ApiDocumentation.js';
import {
  createApiEndpoint,
  type ApiEndpoint,
  type ApiMediaContent,
  type ApiParameterInput,
  type ApiRequestBody,
  type ApiResponse,
  type ApiSecurityRequirement,
} from '../../domain/entities/ApiEndpoint.js';
import { createApiSchema, type ApiSchema } from '../../domain/entities/ApiSchema.js';
import { HTTP_METHODS, type HttpMethod } from '../../domain/entities/HttpMethod.js';
import type { SchemaConstraint } from '../../domain/entities/SchemaConstraint.js';
import { InvalidDocumentationError } from '../../domain/errors/DomainError.js';

const MAX_SCHEMA_DEPTH = 32;

const OPERATION_METHODS = new Set<string>(HTTP_METHODS.map((method) => method.toLowerCase()));

export function mapOpenApiDocument(document: unknown, sourceName: string): ApiDocumentation {
  if (!isRecord(document)) {
    throw new InvalidDocumentationError('La especificación OpenAPI no es un objeto.');
  }
  if (typeof document.swagger === 'string') {
    throw new InvalidDocumentationError('Solo se admiten especificaciones OpenAPI 3.x.');
  }
  if (typeof document.openapi !== 'string' || !document.openapi.startsWith('3.')) {
    throw new InvalidDocumentationError('Solo se admiten especificaciones OpenAPI 3.x.');
  }

  const info = isRecord(document.info) ? document.info : undefined;
  const title = readText(info?.title);
  const version = readText(info?.version);
  if (title === undefined || version === undefined) {
    throw new InvalidDocumentationError(
      'La especificación debe incluir info.title e info.version.',
    );
  }

  const description = readText(info?.description);
  const globalSecurity = toSecurity(document.security);
  const endpoints = mapEndpoints(document.paths, globalSecurity);

  return {
    title,
    version,
    openApiVersion: document.openapi,
    sourceName,
    servers: mapServers(document.servers),
    tags: mapTags(document.tags),
    endpoints,
    schemas: mapSchemas(document.components),
    security: globalSecurity,
    ...(description !== undefined ? { description } : {}),
  };
}

function mapEndpoints(
  paths: unknown,
  globalSecurity: readonly ApiSecurityRequirement[],
): ApiEndpoint[] {
  if (paths === undefined) {
    return [];
  }
  if (!isRecord(paths)) {
    throw new InvalidDocumentationError('El campo paths no es un objeto.');
  }

  const endpoints: ApiEndpoint[] = [];
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      throw new InvalidDocumentationError(`La ruta ${path} no es un objeto.`);
    }
    rejectUnresolvedRef(pathItem, path);
    const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!OPERATION_METHODS.has(method) || !isRecord(operation)) {
        continue;
      }
      rejectUnresolvedRef(operation, `${method.toUpperCase()} ${path}`);
      const parameters = mergeParameters(pathParameters, operation.parameters, `${method} ${path}`);
      const requestBody = toRequestBody(operation.requestBody);
      endpoints.push(
        createApiEndpoint({
          path,
          method: method.toUpperCase() as HttpMethod,
          tags: readStringArray(operation.tags),
          deprecated: operation.deprecated === true,
          parameters,
          responses: toResponses(operation.responses),
          security: Object.hasOwn(operation, 'security')
            ? toSecurity(operation.security)
            : globalSecurity,
          ...defined({
            operationId: readText(operation.operationId),
            summary: readText(operation.summary) ?? readText(pathItem.summary),
            description: readText(operation.description) ?? readText(pathItem.description),
            requestBody,
          }),
        }),
      );
    }
  }
  return endpoints;
}

function mergeParameters(
  pathParameters: readonly unknown[],
  operationParameters: unknown,
  location: string,
): ApiParameterInput[] {
  const merged = new Map<string, ApiParameterInput>();
  const operationList = Array.isArray(operationParameters) ? operationParameters : [];
  for (const parameter of [...pathParameters, ...operationList]) {
    const mapped = toParameter(parameter, location);
    merged.set(`${mapped.location}:${mapped.name}`, mapped);
  }
  return [...merged.values()];
}

function toParameter(value: unknown, location: string): ApiParameterInput {
  if (!isRecord(value)) {
    throw new InvalidDocumentationError(`Parámetro inválido en ${location}.`);
  }
  rejectUnresolvedRef(value, location);
  const name = readText(value.name);
  const parameterLocation = readText(value.in);
  if (name === undefined || parameterLocation === undefined) {
    throw new InvalidDocumentationError(`Parámetro incompleto en ${location}.`);
  }
  const schema = value.schema === undefined ? undefined : toSchemaConstraint(value.schema);
  return {
    name,
    location: parameterLocation,
    required: value.required === true,
    deprecated: value.deprecated === true,
    ...defined({
      description: readText(value.description),
      schema,
      example: jsonData(value.example),
    }),
  };
}

function toRequestBody(value: unknown): ApiRequestBody | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new InvalidDocumentationError('El cuerpo de la solicitud no es un objeto.');
  }
  rejectUnresolvedRef(value, 'requestBody');
  return {
    required: value.required === true,
    content: toContent(value.content),
    ...defined({ description: readText(value.description) }),
  };
}

function toResponses(value: unknown): ApiResponse[] {
  if (value === undefined) {
    return [];
  }
  if (!isRecord(value)) {
    throw new InvalidDocumentationError('El campo responses no es un objeto.');
  }
  return Object.entries(value).map(([statusCode, response]) => {
    if (!isRecord(response)) {
      throw new InvalidDocumentationError(`La respuesta ${statusCode} no es un objeto.`);
    }
    rejectUnresolvedRef(response, statusCode);
    const description = readText(response.description);
    return {
      statusCode,
      description: description ?? '',
      content: toContent(response.content),
    };
  });
}

function toContent(value: unknown): ApiMediaContent[] {
  if (value === undefined) {
    return [];
  }
  if (!isRecord(value)) {
    throw new InvalidDocumentationError('El contenido de la operación no es un objeto.');
  }
  return Object.entries(value).map(([mediaType, media]) => {
    if (!isRecord(media)) {
      throw new InvalidDocumentationError(`El contenido ${mediaType} no es un objeto.`);
    }
    rejectUnresolvedRef(media, mediaType);
    const schema = media.schema === undefined ? undefined : toSchemaConstraint(media.schema);
    return {
      mediaType,
      ...defined({
        schema,
        example: jsonData(media.example),
      }),
    };
  });
}

function toSecurity(value: unknown): ApiSecurityRequirement[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new InvalidDocumentationError('El campo security no es una lista.');
  }
  const requirements: ApiSecurityRequirement[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      throw new InvalidDocumentationError('Un requisito de seguridad no es un objeto.');
    }
    for (const [name, scopes] of Object.entries(entry)) {
      requirements.push({
        name,
        scopes: Array.isArray(scopes)
          ? scopes.filter((scope): scope is string => typeof scope === 'string')
          : [],
      });
    }
  }
  return requirements;
}

function mapServers(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((server) => {
    if (!isRecord(server)) {
      return [];
    }
    const url = readText(server.url);
    return url === undefined ? [] : [url];
  });
}

function mapTags(value: unknown): ApiTag[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((tag) => {
    if (!isRecord(tag)) {
      return [];
    }
    const name = readText(tag.name);
    if (name === undefined) {
      return [];
    }
    const description = readText(tag.description);
    return [description === undefined ? { name } : { name, description }];
  });
}

function mapSchemas(components: unknown): ApiSchema[] {
  if (!isRecord(components) || !isRecord(components.schemas)) {
    return [];
  }
  return Object.entries(components.schemas).map(([name, schema]) => {
    const constraints = toSchemaConstraint(schema);
    return createApiSchema({
      name,
      required: [...(constraints.required ?? [])],
      properties: { ...(constraints.properties ?? {}) },
      constraints,
      ...defined({
        description: constraints.description,
        type: constraints.type,
      }),
    });
  });
}

export function toSchemaConstraint(value: unknown, depth = 0): SchemaConstraint {
  if (depth > MAX_SCHEMA_DEPTH) {
    throw new InvalidDocumentationError('El esquema supera la profundidad permitida.');
  }
  if (!isRecord(value)) {
    throw new InvalidDocumentationError('Se encontró un esquema que no es un objeto.');
  }
  rejectUnresolvedRef(value, 'schema');

  const typeInfo = readSchemaType(value);
  const properties = mapSchemaMap(value.properties, depth);
  const items = value.items === undefined ? undefined : toSchemaConstraint(value.items, depth + 1);
  const additionalProperties = readAdditionalProperties(value.additionalProperties, depth);
  const required = readStringArray(value.required);

  return {
    ...defined({
      type: typeInfo.type,
      nullable: typeInfo.nullable || value.nullable === true ? true : undefined,
      format: readText(value.format),
      title: readText(value.title),
      description: readText(value.description),
      pattern: readText(value.pattern),
      required: required.length > 0 ? required : undefined,
      properties,
      items,
      additionalProperties,
      enum: Array.isArray(value.enum) ? value.enum.map((item) => jsonData(item)) : undefined,
      const: Object.hasOwn(value, 'const') ? jsonData(value.const) : undefined,
      example: jsonData(value.example),
      default: Object.hasOwn(value, 'default') ? jsonData(value.default) : undefined,
      minimum: readNumber(value.minimum),
      maximum: readNumber(value.maximum),
      exclusiveMinimum: readNumber(value.exclusiveMinimum),
      exclusiveMaximum: readNumber(value.exclusiveMaximum),
      minLength: readNumber(value.minLength),
      maxLength: readNumber(value.maxLength),
      minItems: readNumber(value.minItems),
      maxItems: readNumber(value.maxItems),
      uniqueItems: value.uniqueItems === true ? true : undefined,
      oneOf: mapSchemaList(value.oneOf, depth),
      anyOf: mapSchemaList(value.anyOf, depth),
      allOf: mapSchemaList(value.allOf, depth),
    }),
  };
}

function mapSchemaMap(value: unknown, depth: number): Record<string, SchemaConstraint> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new InvalidDocumentationError('Las propiedades de un esquema no son un objeto.');
  }
  return Object.fromEntries(
    Object.entries(value).map(([name, property]) => [
      name,
      toSchemaConstraint(property, depth + 1),
    ]),
  );
}

function mapSchemaList(value: unknown, depth: number): SchemaConstraint[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new InvalidDocumentationError('Una composición de esquemas no es una lista.');
  }
  return value.map((item) => toSchemaConstraint(item, depth + 1));
}

function readAdditionalProperties(
  value: unknown,
  depth: number,
): boolean | SchemaConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return toSchemaConstraint(value, depth + 1);
}

function readSchemaType(value: Record<string, unknown>): { type?: string; nullable: boolean } {
  const raw = value.type;
  if (typeof raw === 'string') {
    return raw === 'null' ? { nullable: true } : { type: raw, nullable: false };
  }
  if (Array.isArray(raw)) {
    const types = raw.filter((item): item is string => typeof item === 'string' && item !== 'null');
    const nullable = raw.includes('null');
    return {
      nullable,
      ...(types.length > 0 ? { type: types.join(' | ') } : {}),
    };
  }
  return { nullable: false };
}

function rejectUnresolvedRef(value: Record<string, unknown>, location: string): void {
  if (typeof value.$ref === 'string') {
    throw new InvalidDocumentationError(`Referencia no resuelta en ${location}: ${value.$ref}`);
  }
}

function jsonData(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    throw new InvalidDocumentationError('El documento contiene un valor que no es un dato.');
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => jsonData(item));
  }
  if (isRecord(value)) {
    rejectUnresolvedRef(value, 'schema');
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, jsonData(entry)]));
  }
  throw new InvalidDocumentationError('El documento contiene un valor que no es un dato.');
}

function readText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function defined<T extends Record<string, unknown>>(
  fields: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const result: { [K in keyof T]?: Exclude<T[K], undefined> } = {};
  for (const key of Object.keys(fields) as (keyof T)[]) {
    const value = fields[key];
    if (value !== undefined) {
      result[key] = value as Exclude<T[keyof T], undefined>;
    }
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
