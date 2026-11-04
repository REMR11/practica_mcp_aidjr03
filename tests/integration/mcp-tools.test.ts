import { describe, expect, it } from 'vitest';

import { connectClient } from '../helpers/connectClient.js';
import { sampleService } from '../helpers/sampleDocumentation.js';

describe('herramientas MCP', () => {
  it('publica las cuatro herramientas y devuelve resultados del caso de uso', async () => {
    const { client, close } = await connectClient(sampleService());
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
      'get_endpoint',
      'get_schema',
      'list_endpoints',
      'search_documentation',
    ]);

    const search = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'autenticación' },
    });
    expect(search.isError).toBeUndefined();
    expect(text(search)).toContain('/api/auth/login');

    const listedEndpoints = await client.callTool({
      name: 'list_endpoints',
      arguments: { method: 'get', tag: 'users' },
    });
    expect(JSON.parse(text(listedEndpoints))).toMatchObject([
      { method: 'GET', path: '/api/users' },
    ]);

    const endpoint = await client.callTool({
      name: 'get_endpoint',
      arguments: { path: '/api/users', method: 'GET' },
    });
    expect(JSON.parse(text(endpoint))).toMatchObject({
      method: 'GET',
      path: '/api/users',
      responses: [{ statusCode: '200' }],
    });

    const schema = await client.callTool({
      name: 'get_schema',
      arguments: { schemaName: 'User' },
    });
    expect(JSON.parse(text(schema))).toMatchObject({
      name: 'User',
      properties: { email: { format: 'email', minLength: 3 } },
    });

    await close();
  });

  it('rechaza entradas inválidas y consultas sin resultado', async () => {
    const { client, close } = await connectClient(sampleService());

    const invalid = await client.callTool({
      name: 'search_documentation',
      arguments: {},
    });
    expect(invalid.isError).toBe(true);

    const unknownMethod = await client.callTool({
      name: 'list_endpoints',
      arguments: { method: 'FETCH' },
    });
    expect(unknownMethod.isError).toBe(true);
    expect(text(unknownMethod)).toContain('FETCH');

    const missing = await client.callTool({
      name: 'get_endpoint',
      arguments: { path: '/api/missing', method: 'GET' },
    });
    expect(missing.isError).toBe(true);
    expect(text(missing)).toContain('No existe el endpoint');

    const emptySearch = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'no-existe' },
    });
    expect(JSON.parse(text(emptySearch))).toMatchObject({ matches: [] });

    await close();
  });
});

function text(result: { content: readonly { type: string; text?: string }[] }): string {
  const block = result.content[0];
  if (block?.type !== 'text' || block.text === undefined) {
    throw new Error('La herramienta no devolvió texto.');
  }
  return block.text;
}
