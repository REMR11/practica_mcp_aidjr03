import type { ApiDocumentation } from '../entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../entities/ApiEndpoint.js';
import type { ApiSchema } from '../entities/ApiSchema.js';
import type { HttpMethod } from '../entities/HttpMethod.js';

export interface EndpointQuery {
  readonly method?: HttpMethod;
  readonly tag?: string;
  readonly path?: string;
}

/**
 * Contrato de acceso a la documentación. La aplicación depende de esta interfaz;
 * la lectura de archivos vive en infraestructura.
 */
export interface DocumentationRepository {
  load(): Promise<ApiDocumentation>;
  listEndpoints(query?: EndpointQuery): Promise<readonly ApiEndpoint[]>;
  getEndpoint(path: string, method: HttpMethod): Promise<ApiEndpoint | undefined>;
  listSchemas(): Promise<readonly ApiSchema[]>;
  getSchema(schemaName: string): Promise<ApiSchema | undefined>;
}
