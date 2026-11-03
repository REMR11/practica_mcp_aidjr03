import type { HttpMethod } from '../types/HttpMethod.js';

export interface ApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required: boolean;
  description?: string;
  schema?: Record<string, unknown>;
}

export interface ApiRequestBody {
  description?: string;
  required: boolean;
  contentTypes: string[];
  schema?: Record<string, unknown>;
}

export interface ApiResponse {
  statusCode: string;
  description?: string;
  contentTypes: string[];
  schema?: Record<string, unknown>;
}

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  deprecated: boolean;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  security?: Array<Record<string, string[]>>;
}
