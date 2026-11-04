import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import { InvalidQueryError, SchemaNotFoundError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';

export class GetSchema {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(schemaName: string): Promise<ApiSchema> {
    const name = schemaName.trim();
    if (name.length === 0) {
      throw new InvalidQueryError('El nombre del esquema es obligatorio.');
    }
    const schema = await this.repository.getSchema(name);
    if (schema === undefined) {
      throw new SchemaNotFoundError(name);
    }
    return schema;
  }
}
