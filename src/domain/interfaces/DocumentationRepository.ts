import type { ApiDocumentation } from '../entities/ApiDocumentation.js';

export interface DocumentationRepository {
  load(): Promise<ApiDocumentation>;
}
