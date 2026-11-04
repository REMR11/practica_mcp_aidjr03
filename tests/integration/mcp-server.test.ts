import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { describe, expect, it } from 'vitest';

import { DocumentationService } from '../../src/application/services/DocumentationService.js';
import { createApiEndpoint } from '../../src/domain/entities/ApiEndpoint.js';
import type { ApiDocumentation } from '../../src/domain/entities/ApiDocumentation.js';
import { createMcpServer } from '../../src/presentation/mcp/createMcpServer.js';
import { InMemoryDocumentationRepository } from '../helpers/InMemoryDocumentationRepository.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tsx = path.join(root, 'node_modules/tsx/dist/cli.mjs');

const document: ApiDocumentation = {
  title: 'Users API',
  version: '1.0.0',
  openApiVersion: '3.0.3',
  sourceName: 'openapi.yaml',
  servers: [],
  tags: [],
  security: [],
  endpoints: [
    createApiEndpoint({
      path: '/api/users',
      method: 'GET',
      responses: [{ statusCode: '200', description: 'Correcto', content: [] }],
    }),
  ],
  schemas: [],
};

describe('servidor MCP', () => {
  it('completa el saludo initialize y expone su identidad', async () => {
    const service = new DocumentationService(new InMemoryDocumentationRepository(document));
    const server = await createMcpServer(service);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-harness', version: '1.0.0' });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    expect(client.getServerVersion()).toMatchObject({
      name: 'api-documentation-mcp',
      version: '1.0.0',
    });
    expect(client.getInstructions()).toContain('1 operación cargada');

    await client.close();
    await server.close();
  });

  it('habla MCP por STDIO y deja el registro en stderr', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [tsx, path.join(root, 'src/index.ts')],
      cwd: root,
      env: {
        ...getDefaultEnvironment(),
        DOCS_DIR: path.join(root, 'examples'),
        OPENAPI_FILE: 'openapi.yaml',
      },
      stderr: 'pipe',
    });
    const client = new Client({ name: 'stdio-test', version: '1.0.0' });
    let stderr = '';
    transport.stderr?.setEncoding('utf8');
    transport.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });

    await client.connect(transport);
    expect(client.getServerVersion()?.name).toBe('api-documentation-mcp');
    expect(stderr).toContain('escuchando por STDIO');

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      'get_endpoint',
      'get_schema',
      'list_endpoints',
      'search_documentation',
    ]);
    const resources = await client.listResources();
    expect(resources.resources.map((resource) => resource.uri)).toEqual(
      expect.arrayContaining([
        'api://documentation/overview',
        'api://documentation/endpoints',
        'api://documentation/schemas',
      ]),
    );
    const prompts = await client.listPrompts();
    expect(prompts.prompts.map((prompt) => prompt.name).sort()).toEqual([
      'explain_api',
      'generate_api_examples',
      'review_endpoint',
    ]);

    const search = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'autenticación' },
    });
    expect(search.isError).not.toBe(true);
    const block = search.content[0];
    expect(block?.type === 'text' ? block.text : '').toContain('/api/auth/login');

    await client.close();
  });

  it('falla al iniciar sin escribir el error en stdout', async () => {
    const child = spawn(process.execPath, [tsx, path.join(root, 'src/index.ts')], {
      cwd: root,
      env: {
        ...process.env,
        DOCS_DIR: path.join(root, 'examples'),
        OPENAPI_FILE: 'missing.yaml',
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      child.on('exit', resolve);
    });

    expect(exitCode).not.toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toContain('No se encontró el documento OpenAPI.');
    expect(stderr).not.toContain(root);
  });
});
