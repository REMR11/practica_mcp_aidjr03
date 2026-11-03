import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocumentationService } from '../../../application/services/DocumentationService.js';
import { HTTP_METHODS } from '../../../domain/types/HttpMethod.js';
import { formatToolError, jsonText } from '../formatError.js';

const httpMethodSchema = z.enum(HTTP_METHODS);

export function registerTools(server: McpServer, service: DocumentationService): void {
  server.registerTool(
    'search_documentation',
    {
      title: 'Search documentation',
      description: 'Search endpoints by path, method, description, tags, or operationId',
      inputSchema: {
        query: z.string().min(1).describe('Search keyword'),
      },
    },
    async ({ query }) => {
      try {
        const results = await service.search(query);
        return jsonText({ count: results.length, results });
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.registerTool(
    'list_endpoints',
    {
      title: 'List endpoints',
      description: 'List available API endpoints with optional filters',
      inputSchema: {
        method: httpMethodSchema.optional().describe('Filter by HTTP method'),
        tag: z.string().optional().describe('Filter by OpenAPI tag'),
      },
    },
    async (filters) => {
      try {
        const results = await service.list(filters);
        return jsonText({ count: results.length, results });
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.registerTool(
    'get_endpoint',
    {
      title: 'Get endpoint',
      description: 'Get detailed documentation for a specific endpoint',
      inputSchema: {
        path: z.string().min(1).describe('Endpoint path, e.g. /api/users'),
        method: httpMethodSchema.describe('HTTP method'),
      },
    },
    async ({ path, method }) => {
      try {
        const endpoint = await service.getEndpoint(path, method);
        return jsonText(endpoint);
      } catch (error) {
        return formatToolError(error);
      }
    },
  );

  server.registerTool(
    'get_schema',
    {
      title: 'Get schema',
      description: 'Get an OpenAPI schema definition by name',
      inputSchema: {
        schemaName: z.string().min(1).describe('Component schema name'),
      },
    },
    async ({ schemaName }) => {
      try {
        const schema = await service.getSchema(schemaName);
        return jsonText(schema);
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
