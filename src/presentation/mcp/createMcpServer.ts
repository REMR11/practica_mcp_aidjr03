import { McpServer } from '@modelcontextprotocol/server';

import type { DocumentationService } from '../../application/services/DocumentationService.js';
import { SERVER_NAME, SERVER_VERSION } from '../../config/constants.js';
import { registerTools } from './tools/registerTools.js';

export async function createMcpServer(service: DocumentationService): Promise<McpServer> {
  const endpoints = await service.list();
  const operations =
    endpoints.length === 1 ? '1 operación cargada' : `${endpoints.length} operaciones cargadas`;
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        `Servidor de documentación OpenAPI. Hay ${operations}. ` +
        'Herramientas: search_documentation, list_endpoints, get_endpoint y get_schema. ' +
        'Responde únicamente con la información que devuelvan.',
    },
  );
  registerTools(server, service);
  return server;
}
