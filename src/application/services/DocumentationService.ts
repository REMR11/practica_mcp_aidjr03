import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import type { SearchResult } from '../models/SearchResult.js';
import { GetEndpoint } from '../use-cases/GetEndpoint.js';
import { GetSchema } from '../use-cases/GetSchema.js';
import { ListEndpoints, type ListEndpointsInput } from '../use-cases/ListEndpoints.js';
import { SearchDocumentation } from '../use-cases/SearchDocumentation.js';

/**
 * Fachada de los casos de uso. La capa MCP depende de este servicio y no
 * reimplementa la búsqueda ni los filtros.
 */
export class DocumentationService {
  private readonly repository: DocumentationRepository;
  private readonly searchDocumentation: SearchDocumentation;
  private readonly listEndpoints: ListEndpoints;
  private readonly getEndpoint: GetEndpoint;
  private readonly getSchema: GetSchema;

  constructor(repository: DocumentationRepository) {
    this.repository = repository;
    this.searchDocumentation = new SearchDocumentation(repository);
    this.listEndpoints = new ListEndpoints(repository);
    this.getEndpoint = new GetEndpoint(repository);
    this.getSchema = new GetSchema(repository);
  }

  documentation(): Promise<ApiDocumentation> {
    return this.repository.load();
  }

  search(query: string): Promise<SearchResult> {
    return this.searchDocumentation.execute(query);
  }

  list(input?: ListEndpointsInput): Promise<readonly ApiEndpoint[]> {
    return this.listEndpoints.execute(input);
  }

  endpoint(path: string, method: string): Promise<ApiEndpoint> {
    return this.getEndpoint.execute(path, method);
  }

  schema(schemaName: string): Promise<ApiSchema> {
    return this.getSchema.execute(schemaName);
  }
}
