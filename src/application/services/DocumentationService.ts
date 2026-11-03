import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import type { HttpMethod } from '../../domain/types/HttpMethod.js';
import { GetEndpoint } from '../use-cases/GetEndpoint.js';
import { GetSchema } from '../use-cases/GetSchema.js';
import { ListEndpoints, type ListEndpointsFilters } from '../use-cases/ListEndpoints.js';
import { SearchDocumentation } from '../use-cases/SearchDocumentation.js';

export class DocumentationService {
  private readonly searchUseCase: SearchDocumentation;
  private readonly listUseCase: ListEndpoints;
  private readonly getEndpointUseCase: GetEndpoint;
  private readonly getSchemaUseCase: GetSchema;

  constructor(repository: DocumentationRepository) {
    this.searchUseCase = new SearchDocumentation(repository);
    this.listUseCase = new ListEndpoints(repository);
    this.getEndpointUseCase = new GetEndpoint(repository);
    this.getSchemaUseCase = new GetSchema(repository);
  }

  async loadDocumentation(): Promise<ApiDocumentation> {
    return this.searchUseCase.loadDocumentation();
  }

  async search(query: string): Promise<ApiEndpoint[]> {
    return this.searchUseCase.execute(query);
  }

  async list(filters?: ListEndpointsFilters): Promise<ApiEndpoint[]> {
    return this.listUseCase.execute(filters);
  }

  async getEndpoint(path: string, method: HttpMethod): Promise<ApiEndpoint> {
    return this.getEndpointUseCase.execute(path, method);
  }

  async getSchema(schemaName: string): Promise<ApiSchema> {
    return this.getSchemaUseCase.execute(schemaName);
  }
}
