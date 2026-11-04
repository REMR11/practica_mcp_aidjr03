import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadEnvironment } from '../../../src/config/environment.js';
import {
  DocumentTooLargeError,
  DocumentationNotFoundError,
  InvalidDocumentationError,
  UnauthorizedPathError,
} from '../../../src/domain/errors/DomainError.js';
import { FileDocumentationRepository } from '../../../src/infrastructure/repositories/FileDocumentationRepository.js';

const root = path.resolve(import.meta.dirname, '../../..');

describe('FileDocumentationRepository', () => {
  it('carga el ejemplo y consulta endpoints y esquemas', async () => {
    const repository = repositoryFor({
      docsDir: path.join(root, 'examples'),
      fileName: 'openapi.yaml',
      maxDocumentBytes: 1_048_576,
    });

    const document = await repository.load();
    expect(document.sourceName).toBe('openapi.yaml');
    expect(document.title).toBe('Users API');

    const users = await repository.listEndpoints({ method: 'GET', tag: 'Users' });
    expect(users.map((endpoint) => endpoint.path)).toEqual(['/api/users', '/api/users/{userId}']);

    const created = await repository.getEndpoint('/api/users', 'POST');
    expect(created?.operationId).toBe('createUser');
    expect(await repository.getEndpoint('/api/missing', 'GET')).toBeUndefined();

    const schema = await repository.getSchema('User');
    expect(schema?.properties.email).toMatchObject({ format: 'email' });
    expect(await repository.getSchema('Missing')).toBeUndefined();
  });

  it('rechaza rutas fuera del directorio, archivos ausentes y documentos grandes', async () => {
    const docsDir = await createTemporaryDirectory();
    const outside = await createTemporaryDirectory();
    await writeFile(
      path.join(outside, 'secret.yaml'),
      'openapi: 3.0.3\ninfo:\n  title: Secreto\n  version: "1.0.0"\npaths: {}\n',
    );
    await symlink(path.join(outside, 'secret.yaml'), path.join(docsDir, 'linked.yaml'));
    await writeFile(path.join(docsDir, 'big.yaml'), 'openapi: 3.0.3\ninfo:\n  title: Grande\n');

    await expect(
      repositoryFor({ docsDir, fileName: '../package.json', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(UnauthorizedPathError);
    await expect(
      repositoryFor({ docsDir, fileName: '/etc/passwd', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(UnauthorizedPathError);
    await expect(
      repositoryFor({ docsDir, fileName: 'notes.txt', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(UnauthorizedPathError);
    await expect(
      repositoryFor({
        docsDir,
        fileName: 'openapi\u0000.yaml',
        maxDocumentBytes: 1_048_576,
      }).load(),
    ).rejects.toBeInstanceOf(UnauthorizedPathError);
    await expect(
      repositoryFor({ docsDir, fileName: 'linked.yaml', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(UnauthorizedPathError);
    await expect(
      repositoryFor({ docsDir, fileName: 'missing.yaml', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(DocumentationNotFoundError);
    await expect(
      repositoryFor({ docsDir, fileName: 'big.yaml', maxDocumentBytes: 16 }).load(),
    ).rejects.toBeInstanceOf(DocumentTooLargeError);
    await expect(
      repositoryFor({
        docsDir: path.join(docsDir, 'no-existe'),
        fileName: 'openapi.yaml',
        maxDocumentBytes: 1_048_576,
      }).load(),
    ).rejects.toBeInstanceOf(DocumentationNotFoundError);

    try {
      await repositoryFor({ docsDir, fileName: 'linked.yaml', maxDocumentBytes: 1_048_576 }).load();
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedPathError);
      expect((error as Error).message).not.toContain(docsDir);
      expect((error as Error).message).not.toContain(outside);
    }
  });

  it('informa un error de lectura cuando el origen no es un archivo', async () => {
    const docsDir = await createTemporaryDirectory();
    await mkdir(path.join(docsDir, 'openapi.yaml'));

    await expect(
      repositoryFor({ docsDir, fileName: 'openapi.yaml', maxDocumentBytes: 1_048_576 }).load(),
    ).rejects.toBeInstanceOf(InvalidDocumentationError);
  });
});

describe('loadEnvironment', () => {
  it('usa valores por defecto y valida el tamaño máximo', () => {
    expect(loadEnvironment({})).toEqual({
      docsDir: './examples',
      fileName: 'openapi.yaml',
      maxDocumentBytes: 1_048_576,
    });
    expect(() => loadEnvironment({ MAX_DOCUMENT_BYTES: '0' })).toThrow(/entero positivo/);
  });
});

function repositoryFor(source: {
  docsDir: string;
  fileName: string;
  maxDocumentBytes: number;
}): FileDocumentationRepository {
  return new FileDocumentationRepository(source);
}

async function createTemporaryDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'api-docs-'));
}
