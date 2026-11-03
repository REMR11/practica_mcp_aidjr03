export interface ApiSchemaProperty {
  name: string;
  type?: string;
  format?: string;
  description?: string;
  required: boolean;
  enumValues?: string[];
  items?: Record<string, unknown>;
  ref?: string;
  constraints?: Record<string, unknown>;
}

export interface ApiSchema {
  name: string;
  type?: string;
  description?: string;
  required: string[];
  properties: ApiSchemaProperty[];
  enumValues?: string[];
  items?: Record<string, unknown>;
  additionalProperties?: boolean | Record<string, unknown>;
  resolved?: Record<string, unknown>;
}
