import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { DocumentationService } from '../../application/services/DocumentationService.js';
import { registerPrompts } from './prompts/registerPrompts.js';
import { registerResources } from './resources/registerResources.js';
import { registerTools } from './tools/registerTools.js';

export function createMcpServer(service: DocumentationService): McpServer {
  const server = new McpServer({
    name: 'api-documentation-mcp',
    version: '1.0.0',
  });

  registerTools(server, service);
  registerResources(server, service);
  registerPrompts(server, service);

  return server;
}

export async function startStdioMcpServer(service: DocumentationService): Promise<void> {
  const server = createMcpServer(service);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
