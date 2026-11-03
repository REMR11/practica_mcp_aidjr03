import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentationService } from '../../../application/services/DocumentationService.js';

const OVERVIEW_URI = 'api://documentation/overview';
const ENDPOINTS_URI = 'api://documentation/endpoints';
const SCHEMAS_URI = 'api://documentation/schemas';

export function registerResources(server: McpServer, service: DocumentationService): void {
  server.registerResource(
    'documentation-overview',
    OVERVIEW_URI,
    {
      title: 'API documentation overview',
      description: 'General information about the loaded OpenAPI document',
      mimeType: 'application/json',
    },
    async (uri) => {
      const documentation = await service.loadDocumentation();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(documentation.overview, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    'documentation-endpoints',
    ENDPOINTS_URI,
    {
      title: 'API endpoints catalog',
      description: 'Catalog of all endpoints in the loaded OpenAPI document',
      mimeType: 'application/json',
    },
    async (uri) => {
      const documentation = await service.loadDocumentation();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(documentation.endpoints, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    'documentation-schemas',
    SCHEMAS_URI,
    {
      title: 'API schemas catalog',
      description: 'Catalog of component schemas in the loaded OpenAPI document',
      mimeType: 'application/json',
    },
    async (uri) => {
      const documentation = await service.loadDocumentation();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(documentation.schemas, null, 2),
          },
        ],
      };
    },
  );
}
