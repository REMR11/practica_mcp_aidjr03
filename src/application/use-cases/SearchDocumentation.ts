import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import { InvalidQueryError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import type { SearchMatch, SearchResult } from '../models/SearchResult.js';
import { scoreFields, searchTokens } from '../search.js';

export class SearchDocumentation {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(query: string): Promise<SearchResult> {
    const tokens = searchTokens(query);
    if (tokens.length === 0) {
      throw new InvalidQueryError('La búsqueda no puede estar vacía.');
    }

    const [endpoints, schemas] = await Promise.all([
      this.repository.listEndpoints(),
      this.repository.listSchemas(),
    ]);

    const ranked = [
      ...endpoints.map((endpoint, index) => ({
        kind: 'endpoint' as const,
        score: scoreEndpoint(endpoint, tokens),
        endpoint,
        index,
      })),
      ...schemas.map((schema, index) => ({
        kind: 'schema' as const,
        score: scoreSchema(schema, tokens),
        schema,
        index: endpoints.length + index,
      })),
    ].filter((match) => match.score > 0);

    ranked.sort((left, right) => right.score - left.score || left.index - right.index);

    return {
      query: tokens.join(' '),
      matches: ranked.map((match) => toMatch(match)),
    };
  }
}

function toMatch(match: {
  kind: 'endpoint' | 'schema';
  score: number;
  endpoint?: ApiEndpoint;
  schema?: ApiSchema;
}): SearchMatch {
  if (match.kind === 'endpoint' && match.endpoint !== undefined) {
    return { kind: 'endpoint', score: match.score, endpoint: match.endpoint };
  }
  if (match.kind === 'schema' && match.schema !== undefined) {
    return { kind: 'schema', score: match.score, schema: match.schema };
  }
  throw new InvalidQueryError('No se pudo construir el resultado de la búsqueda.');
}

function scoreEndpoint(endpoint: ApiEndpoint, tokens: readonly string[]): number {
  return scoreFields(tokens, [
    { value: endpoint.path, weight: 40, exact: true },
    { value: endpoint.method, weight: 40, exact: true },
    { value: endpoint.operationId, weight: 25 },
    { value: endpoint.summary, weight: 20 },
    { value: endpoint.description, weight: 20 },
    { value: endpoint.tags.join(' '), weight: 30 },
  ]);
}

function scoreSchema(schema: ApiSchema, tokens: readonly string[]): number {
  return scoreFields(tokens, [
    { value: schema.name, weight: 50, exact: true },
    { value: schema.description, weight: 20 },
    { value: Object.keys(schema.properties).join(' '), weight: 15 },
  ]);
}
