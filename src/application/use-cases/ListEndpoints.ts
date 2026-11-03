import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import type { HttpMethod } from '../../domain/types/HttpMethod.js';

export interface ListEndpointsFilters {
  method?: HttpMethod;
  tag?: string;
}

export class ListEndpoints {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(filters: ListEndpointsFilters = {}): Promise<ApiEndpoint[]> {
    const documentation = await this.repository.load();
    let results = documentation.endpoints;

    if (filters.method) {
      results = results.filter((endpoint) => endpoint.method === filters.method);
    }

    if (filters.tag) {
      const tag = filters.tag.toLowerCase();
      results = results.filter((endpoint) => endpoint.tags.some((t) => t.toLowerCase() === tag));
    }

    return results;
  }
}
