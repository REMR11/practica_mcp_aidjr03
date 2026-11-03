import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../src/domain/errors/DomainError.js';
import { FileDocumentationRepository } from '../../../src/infrastructure/repositories/FileDocumentationRepository.js';

describe('FileDocumentationRepository', () => {
  const root = path.join(process.cwd(), 'examples');

  it('loads documentation from authorized directory', async () => {
    const repo = new FileDocumentationRepository({
      authorizedRootDir: root,
      fileName: 'openapi.yaml',
      maxDocumentBytes: 1024 * 1024,
    });

    const doc = await repo.load();
    expect(doc.overview.title).toBe('Sample Users API');
  });

  it('blocks path traversal', () => {
    const repo = new FileDocumentationRepository({
      authorizedRootDir: root,
      fileName: 'openapi.yaml',
      maxDocumentBytes: 1024 * 1024,
    });

    expect(() => repo.resolveAuthorizedPath(root, '../package.json')).toThrow(ValidationError);
  });
});
