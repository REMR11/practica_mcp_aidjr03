import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';

export class GetSchema {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(schemaName: string): Promise<ApiSchema> {
    const documentation = await this.repository.load();
    const schema = documentation.schemas.find(
      (item) => item.name.toLowerCase() === schemaName.toLowerCase(),
    );

    if (!schema) {
      throw new NotFoundError(`Schema not found: ${schemaName}`);
    }

    return schema;
  }
}
