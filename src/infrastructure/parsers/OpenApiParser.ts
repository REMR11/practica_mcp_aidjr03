import SwaggerParser from '@apidevtools/swagger-parser';
import { parse as parseYaml } from 'yaml';
import type {
  ApiDocumentation,
  ApiDocumentationOverview,
} from '../../domain/entities/ApiDocumentation.js';
import type {
  ApiEndpoint,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
} from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema, ApiSchemaProperty } from '../../domain/entities/ApiSchema.js';
import { DocumentationLoadError } from '../../domain/errors/DomainError.js';
import { HTTP_METHODS, type HttpMethod } from '../../domain/types/HttpMethod.js';

type JsonObject = Record<string, unknown>;

function isRef(value: unknown): value is { $ref: string } {
  return typeof value === 'object' && value !== null && '$ref' in value;
}

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function parseOpenApiContent(content: string): JsonObject {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as JsonObject;
  } catch {
    const parsed = parseYaml(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Content is not a valid JSON or YAML OpenAPI document');
    }
    return parsed as JsonObject;
  }
}

export class OpenApiParser {
  async parse(content: string, sourceHint?: string): Promise<ApiDocumentation> {
    let spec: JsonObject;
    try {
      const document = parseOpenApiContent(content);
      spec = (await SwaggerParser.validate(document as never, {
        resolve: { external: false },
        dereference: { circular: 'ignore' },
      })) as unknown as JsonObject;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DocumentationLoadError(
        `Invalid OpenAPI document${sourceHint ? ` (${sourceHint})` : ''}: ${message}`,
      );
    }

    const endpoints = this.extractEndpoints(spec);
    const schemas = this.extractSchemas(spec);
    const overview = this.buildOverview(spec, endpoints, schemas);

    return { overview, endpoints, schemas };
  }

  private buildOverview(
    spec: JsonObject,
    endpoints: ApiEndpoint[],
    schemas: ApiSchema[],
  ): ApiDocumentationOverview {
    const info = asObject(spec.info) ?? {};
    const tagSet = new Set<string>();
    for (const endpoint of endpoints) {
      for (const tag of endpoint.tags) {
        tagSet.add(tag);
      }
    }

    return {
      title: typeof info.title === 'string' ? info.title : 'Unknown API',
      version: typeof info.version === 'string' ? info.version : '0.0.0',
      description: typeof info.description === 'string' ? info.description : undefined,
      openapiVersion: typeof spec.openapi === 'string' ? spec.openapi : 'unknown',
      endpointCount: endpoints.length,
      schemaCount: schemas.length,
      tags: [...tagSet].sort(),
    };
  }

  private extractEndpoints(spec: JsonObject): ApiEndpoint[] {
    const paths = asObject(spec.paths) ?? {};
    const endpoints: ApiEndpoint[] = [];

    for (const [pathKey, pathItemRaw] of Object.entries(paths)) {
      const pathItem = asObject(pathItemRaw);
      if (!pathItem) {
        continue;
      }

      for (const method of HTTP_METHODS) {
        const operation = asObject(pathItem[method.toLowerCase()]);
        if (!operation) {
          continue;
        }

        endpoints.push({
          path: pathKey,
          method,
          operationId:
            typeof operation.operationId === 'string' ? operation.operationId : undefined,
          summary: typeof operation.summary === 'string' ? operation.summary : undefined,
          description:
            typeof operation.description === 'string' ? operation.description : undefined,
          tags: Array.isArray(operation.tags)
            ? operation.tags.filter((t): t is string => typeof t === 'string')
            : [],
          deprecated: Boolean(operation.deprecated),
          parameters: this.mapParameters(operation.parameters),
          requestBody: this.mapRequestBody(operation.requestBody),
          responses: this.mapResponses(operation.responses),
          security: Array.isArray(operation.security)
            ? (operation.security as ApiEndpoint['security'])
            : undefined,
        });
      }
    }

    return endpoints.sort((a, b) => {
      const pathCompare = a.path.localeCompare(b.path);
      if (pathCompare !== 0) {
        return pathCompare;
      }
      return a.method.localeCompare(b.method);
    });
  }

  private mapParameters(parameters?: unknown): ApiParameter[] {
    if (!Array.isArray(parameters)) {
      return [];
    }

    const result: ApiParameter[] = [];
    for (const item of parameters) {
      if (isRef(item)) {
        continue;
      }
      const param = asObject(item);
      if (!param || typeof param.name !== 'string' || typeof param.in !== 'string') {
        continue;
      }
      result.push({
        name: param.name,
        in: param.in as ApiParameter['in'],
        required: Boolean(param.required),
        description: typeof param.description === 'string' ? param.description : undefined,
        schema: asObject(param.schema),
      });
    }
    return result;
  }

  private mapRequestBody(requestBody?: unknown): ApiRequestBody | undefined {
    if (!requestBody || isRef(requestBody)) {
      return undefined;
    }
    const body = asObject(requestBody);
    if (!body) {
      return undefined;
    }

    const content = asObject(body.content) ?? {};
    const contentTypes = Object.keys(content);
    const firstSchema = contentTypes.length
      ? asObject(content[contentTypes[0]])?.schema
      : undefined;

    return {
      description: typeof body.description === 'string' ? body.description : undefined,
      required: Boolean(body.required),
      contentTypes,
      schema: asObject(firstSchema),
    };
  }

  private mapResponses(responses?: unknown): ApiResponse[] {
    const responsesObj = asObject(responses);
    if (!responsesObj) {
      return [];
    }

    return Object.entries(responsesObj).map(([statusCode, responseRaw]) => {
      if (isRef(responseRaw)) {
        return {
          statusCode,
          description: undefined,
          contentTypes: [],
        };
      }

      const response = asObject(responseRaw) ?? {};
      const content = asObject(response.content) ?? {};
      const contentTypes = Object.keys(content);
      const firstSchema = contentTypes.length
        ? asObject(content[contentTypes[0]])?.schema
        : undefined;

      return {
        statusCode,
        description: typeof response.description === 'string' ? response.description : undefined,
        contentTypes,
        schema: asObject(firstSchema),
      };
    });
  }

  private extractSchemas(spec: JsonObject): ApiSchema[] {
    const components = asObject(spec.components);
    const schemasObj = asObject(components?.schemas) ?? {};
    const schemas: ApiSchema[] = [];

    for (const [name, schemaOrRef] of Object.entries(schemasObj)) {
      if (isRef(schemaOrRef)) {
        continue;
      }
      const schema = asObject(schemaOrRef);
      if (schema) {
        schemas.push(this.mapSchema(name, schema));
      }
    }

    return schemas.sort((a, b) => a.name.localeCompare(b.name));
  }

  private mapSchema(name: string, schema: JsonObject): ApiSchema {
    const required = Array.isArray(schema.required)
      ? schema.required.filter((r): r is string => typeof r === 'string')
      : [];
    const requiredSet = new Set(required);
    const properties: ApiSchemaProperty[] = [];
    const props = asObject(schema.properties);

    if (props) {
      for (const [propName, propSchemaRaw] of Object.entries(props)) {
        if (isRef(propSchemaRaw)) {
          properties.push({
            name: propName,
            required: requiredSet.has(propName),
            ref: propSchemaRaw.$ref,
          });
          continue;
        }

        const ps = asObject(propSchemaRaw) ?? {};
        properties.push({
          name: propName,
          type: typeof ps.type === 'string' ? ps.type : undefined,
          format: typeof ps.format === 'string' ? ps.format : undefined,
          description: typeof ps.description === 'string' ? ps.description : undefined,
          required: requiredSet.has(propName),
          enumValues: Array.isArray(ps.enum) ? ps.enum.map(String) : undefined,
          items: asObject(ps.items),
          constraints: this.extractConstraints(ps),
        });
      }
    }

    return {
      name,
      type: typeof schema.type === 'string' ? schema.type : undefined,
      description: typeof schema.description === 'string' ? schema.description : undefined,
      required,
      properties,
      enumValues: Array.isArray(schema.enum) ? schema.enum.map(String) : undefined,
      items: asObject(schema.items),
      additionalProperties: schema.additionalProperties as ApiSchema['additionalProperties'],
      resolved: schema,
    };
  }

  private extractConstraints(schema: JsonObject): Record<string, unknown> {
    const keys = [
      'minimum',
      'maximum',
      'minLength',
      'maxLength',
      'pattern',
      'minItems',
      'maxItems',
      'nullable',
      'readOnly',
      'writeOnly',
    ];

    const constraints: Record<string, unknown> = {};
    for (const key of keys) {
      if (schema[key] !== undefined) {
        constraints[key] = schema[key];
      }
    }
    return constraints;
  }
}

export function isHttpMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value.toUpperCase());
}
