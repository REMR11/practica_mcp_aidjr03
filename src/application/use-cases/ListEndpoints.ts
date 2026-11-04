import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import { parseHttpMethod } from '../../domain/entities/HttpMethod.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';

export interface ListEndpointsInput {
  readonly method?: string;
  readonly tag?: string;
}

export class ListEndpoints {
  constructor(private readonly repository: DocumentationRepository) {}

  async execute(input: ListEndpointsInput = {}): Promise<readonly ApiEndpoint[]> {
    const method = normalizeMethod(input.method);
    const tag = normalizeTag(input.tag);
    return this.repository.listEndpoints({
      ...(method !== undefined ? { method } : {}),
      ...(tag !== undefined ? { tag } : {}),
    });
  }
}

function normalizeMethod(
  method: string | undefined,
): ReturnType<typeof parseHttpMethod> | undefined {
  if (method === undefined || method.trim().length === 0) {
    return undefined;
  }
  return parseHttpMethod(method);
}

function normalizeTag(tag: string | undefined): string | undefined {
  const trimmed = tag?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}
