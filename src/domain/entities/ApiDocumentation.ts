import type { ApiEndpoint } from './ApiEndpoint.js';
import type { ApiSchema } from './ApiSchema.js';

export interface ApiDocumentationOverview {
  title: string;
  version: string;
  description?: string;
  openapiVersion: string;
  endpointCount: number;
  schemaCount: number;
  tags: string[];
}

export interface ApiDocumentation {
  overview: ApiDocumentationOverview;
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
}
