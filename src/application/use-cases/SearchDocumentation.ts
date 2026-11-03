import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';

export class SearchDocumentation {
  constructor(private readonly repository: DocumentationRepository) {}

  async loadDocumentation(): Promise<ApiDocumentation> {
    return this.repository.load();
  }

  async execute(query: string): Promise<ApiEndpoint[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const documentation = await this.repository.load();

    if (!normalizedQuery) {
      return documentation.endpoints;
    }

    return documentation.endpoints.filter((endpoint) => this.matches(endpoint, normalizedQuery));
  }

  private matches(endpoint: ApiEndpoint, query: string): boolean {
    const haystacks = [
      endpoint.path,
      endpoint.method,
      endpoint.summary ?? '',
      endpoint.description ?? '',
      ...endpoint.tags,
      endpoint.operationId ?? '',
    ];

    return haystacks.some((value) => value.toLowerCase().includes(query));
  }
}
