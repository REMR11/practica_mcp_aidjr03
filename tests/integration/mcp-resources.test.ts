import { describe, expect, it } from 'vitest';

import { DocumentationService } from '../../src/application/services/DocumentationService.js';
import { DocumentationNotFoundError } from '../../src/domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../src/domain/interfaces/DocumentationRepository.js';
import { connectClient } from '../helpers/connectClient.js';
import { sampleService } from '../helpers/sampleDocumentation.js';

describe('recursos MCP', () => {
  it('expone overview, endpoints y schemas con la documentación cargada', async () => {
    const { client, close } = await connectClient(sampleService());
    const listed = await client.listResources();
    expect(listed.resources.map((resource) => resource.uri).sort()).toEqual([
      'api://documentation/endpoints',
      'api://documentation/overview',
      'api://documentation/schemas',
    ]);

    const overview = JSON.parse(await read(client, 'api://documentation/overview'));
    expect(overview).toMatchObject({
      title: 'Users API',
      openApiVersion: '3.0.3',
      sourceName: 'openapi.yaml',
      endpointCount: 2,
      schemaCount: 1,
    });

    const endpoints = JSON.parse(await read(client, 'api://documentation/endpoints'));
    expect(endpoints).toHaveLength(2);
    expect(endpoints[1]).toMatchObject({ method: 'POST', path: '/api/auth/login' });

    const schemas = JSON.parse(await read(client, 'api://documentation/schemas'));
    expect(schemas[0]).toMatchObject({ name: 'User' });
    await close();
  });

  it('convierte un fallo de lectura en un error sin ruta interna', async () => {
    const { client, close } = await connectClient(new DocumentationService(new BrokenRepository()));
    await expect(client.readResource({ uri: 'api://documentation/overview' })).rejects.toThrow(
      /No hay documentación cargada/,
    );
    await close();
  });
});

async function read(
  client: {
    readResource(params: { uri: string }): Promise<{ contents: readonly { text?: string }[] }>;
  },
  uri: string,
): Promise<string> {
  const result = await client.readResource({ uri });
  const text = result.contents[0]?.text;
  if (text === undefined) {
    throw new Error(`El recurso ${uri} no devolvió texto.`);
  }
  return text;
}

class BrokenRepository implements DocumentationRepository {
  load(): Promise<never> {
    return Promise.reject(new DocumentationNotFoundError('No hay documentación cargada.'));
  }

  listEndpoints(): Promise<readonly []> {
    return Promise.resolve([]);
  }

  getEndpoint(): Promise<undefined> {
    return Promise.resolve(undefined);
  }

  listSchemas(): Promise<readonly []> {
    return Promise.resolve([]);
  }

  getSchema(): Promise<undefined> {
    return Promise.resolve(undefined);
  }
}
