import type { ApiEndpoint, ApiSecurityRequirement } from './ApiEndpoint.js';
import type { ApiSchema } from './ApiSchema.js';

export interface ApiTag {
  readonly name: string;
  readonly description?: string;
}

/**
 * Documentación ya interpretada. `sourceName` es el nombre relativo del archivo,
 * nunca una ruta absoluta del sistema.
 */
export interface ApiDocumentation {
  readonly title: string;
  readonly version: string;
  readonly openApiVersion: string;
  readonly sourceName: string;
  readonly servers: readonly string[];
  readonly tags: readonly ApiTag[];
  readonly endpoints: readonly ApiEndpoint[];
  readonly schemas: readonly ApiSchema[];
  readonly security: readonly ApiSecurityRequirement[];
  readonly description?: string;
}
