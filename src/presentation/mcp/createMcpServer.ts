import { McpServer } from '@modelcontextprotocol/server';

import type { DocumentationService } from '../../application/services/DocumentationService.js';
import { SERVER_NAME, SERVER_VERSION } from '../../config/constants.js';

export async function createMcpServer(service: DocumentationService): Promise<McpServer> {
  const endpoints = await service.list();
  const operations =
    endpoints.length === 1 ? '1 operación cargada' : `${endpoints.length} operaciones cargadas`;
  return new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        `Servidor de documentación OpenAPI. Hay ${operations}. ` +
        'Responde únicamente con la información que devuelva este servidor.',
    },
  );
}
