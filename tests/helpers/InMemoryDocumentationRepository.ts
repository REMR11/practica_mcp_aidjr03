import type { ApiDocumentation } from '../../src/domain/entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../../src/domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../src/domain/entities/ApiSchema.js';
import type { HttpMethod } from '../../src/domain/entities/HttpMethod.js';
import type {
  DocumentationRepository,
  EndpointQuery,
} from '../../src/domain/interfaces/DocumentationRepository.js';

export class InMemoryDocumentationRepository implements DocumentationRepository {
  constructor(private readonly document: ApiDocumentation) {}

  load(): Promise<ApiDocumentation> {
    return Promise.resolve(this.document);
  }

  listEndpoints(query: EndpointQuery = {}): Promise<readonly ApiEndpoint[]> {
    const tag = query.tag?.trim().toLowerCase();
    return Promise.resolve(
      this.document.endpoints.filter((endpoint) => {
        if (query.method !== undefined && endpoint.method !== query.method) {
          return false;
        }
        if (
          tag !== undefined &&
          tag.length > 0 &&
          !endpoint.tags.some((item) => item.toLowerCase() === tag)
        ) {
          return false;
        }
        if (query.path !== undefined && endpoint.path !== query.path) {
          return false;
        }
        return true;
      }),
    );
  }

  getEndpoint(path: string, method: HttpMethod): Promise<ApiEndpoint | undefined> {
    return this.listEndpoints({ path, method }).then((endpoints) => endpoints[0]);
  }

  listSchemas(): Promise<readonly ApiSchema[]> {
    return Promise.resolve(this.document.schemas);
  }

  getSchema(schemaName: string): Promise<ApiSchema | undefined> {
    return this.listSchemas().then((schemas) =>
      schemas.find((schema) => schema.name === schemaName),
    );
  }
}
