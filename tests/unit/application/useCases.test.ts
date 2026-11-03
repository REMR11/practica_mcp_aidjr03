import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DocumentationService } from '../../../src/application/services/DocumentationService.js';
import { NotFoundError } from '../../../src/domain/errors/DomainError.js';
import { FileDocumentationRepository } from '../../../src/infrastructure/repositories/FileDocumentationRepository.js';

function createService(): DocumentationService {
  const repository = new FileDocumentationRepository({
    authorizedRootDir: path.join(process.cwd(), 'examples'),
    fileName: 'openapi.yaml',
    maxDocumentBytes: 5 * 1024 * 1024,
  });
  return new DocumentationService(repository);
}

describe('Documentation use cases', () => {
  const service = createService();

  it('searches endpoints by keyword', async () => {
    const results = await service.search('authentication');
    expect(results.some((e) => e.path.includes('/auth/login'))).toBe(true);
  });

  it('lists endpoints with filters', async () => {
    const results = await service.list({ method: 'GET', tag: 'users' });
    expect(results.every((e) => e.method === 'GET')).toBe(true);
    expect(results.every((e) => e.tags.includes('users'))).toBe(true);
  });

  it('returns endpoint details', async () => {
    const endpoint = await service.getEndpoint('/api/users', 'POST');
    expect(endpoint.requestBody?.required).toBe(true);
  });

  it('returns schema details', async () => {
    const schema = await service.getSchema('User');
    expect(schema.properties.some((p) => p.name === 'email')).toBe(true);
  });

  it('throws when endpoint is missing', async () => {
    await expect(service.getEndpoint('/missing', 'GET')).rejects.toBeInstanceOf(NotFoundError);
  });
});
