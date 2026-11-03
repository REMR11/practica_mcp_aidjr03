import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import type { HttpMethod } from '../../domain/types/HttpMethod.js';

export class GetEndpoint {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(path: string, method: HttpMethod): Promise<ApiEndpoint> {
    const documentation = await this.repository.load();
    const endpoint = documentation.endpoints.find(
      (item) => item.path === path && item.method === method,
    );

    if (!endpoint) {
      throw new NotFoundError(`Endpoint not found: ${method} ${path}`);
    }

    return endpoint;
  }
}
