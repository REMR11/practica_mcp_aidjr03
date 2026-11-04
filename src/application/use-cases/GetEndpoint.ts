import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import { parseHttpMethod } from '../../domain/entities/HttpMethod.js';
import { EndpointNotFoundError, InvalidQueryError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';

export class GetEndpoint {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(path: string, method: string): Promise<ApiEndpoint> {
    const normalizedPath = path.trim();
    if (normalizedPath.length === 0) {
      throw new InvalidQueryError('La ruta del endpoint es obligatoria.');
    }
    const normalizedMethod = parseHttpMethod(method);
    const endpoint = await this.repository.getEndpoint(normalizedPath, normalizedMethod);
    if (endpoint === undefined) {
      throw new EndpointNotFoundError(normalizedPath, normalizedMethod);
    }
    return endpoint;
  }
}
