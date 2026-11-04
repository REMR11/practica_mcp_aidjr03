import type { McpServer } from '@modelcontextprotocol/server';

import type { DocumentationService } from '../../../application/services/DocumentationService.js';
import { DomainError } from '../../../domain/errors/DomainError.js';

const json = 'application/json';

export function registerResources(server: McpServer, service: DocumentationService): void {
  server.registerResource(
    'overview',
    'api://documentation/overview',
    {
      title: 'Información general',
      description: 'Metadatos de la especificación OpenAPI cargada.',
      mimeType: json,
    },
    async (uri) => readJson(uri, async () => overview(await service.documentation())),
  );

  server.registerResource(
    'endpoints',
    'api://documentation/endpoints',
    {
      title: 'Catálogo de endpoints',
      description: 'Operaciones documentadas, con parámetros, cuerpos, respuestas y seguridad.',
      mimeType: json,
    },
    async (uri) => readJson(uri, async () => (await service.documentation()).endpoints),
  );

  server.registerResource(
    'schemas',
    'api://documentation/schemas',
    {
      title: 'Catálogo de esquemas',
      description: 'Esquemas de components.schemas con propiedades y restricciones resueltas.',
      mimeType: json,
    },
    async (uri) => readJson(uri, async () => (await service.documentation()).schemas),
  );
}

async function readJson(uri: URL, produce: () => Promise<unknown>) {
  try {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: json,
          text: JSON.stringify(await produce(), null, 2),
        },
      ],
    };
  } catch (error) {
    const message =
      error instanceof DomainError ? error.message : 'No se pudo leer el recurso de documentación.';
    throw new Error(message, { cause: error });
  }
}

function overview(document: Awaited<ReturnType<DocumentationService['documentation']>>) {
  return {
    title: document.title,
    version: document.version,
    openApiVersion: document.openApiVersion,
    sourceName: document.sourceName,
    servers: document.servers,
    tags: document.tags,
    security: document.security,
    endpointCount: document.endpoints.length,
    schemaCount: document.schemas.length,
    ...(document.description !== undefined ? { description: document.description } : {}),
  };
}
