import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../domain/entities/ApiSchema.js';

export interface EndpointMatch {
  readonly kind: 'endpoint';
  readonly score: number;
  readonly endpoint: ApiEndpoint;
}

export interface SchemaMatch {
  readonly kind: 'schema';
  readonly score: number;
  readonly schema: ApiSchema;
}

export type SearchMatch = EndpointMatch | SchemaMatch;

export interface SearchResult {
  readonly query: string;
  readonly matches: readonly SearchMatch[];
}
