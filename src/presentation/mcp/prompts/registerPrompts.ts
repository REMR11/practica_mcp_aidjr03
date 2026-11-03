import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocumentationService } from '../../../application/services/DocumentationService.js';
import { HTTP_METHODS } from '../../../domain/types/HttpMethod.js';

const httpMethodSchema = z.enum(HTTP_METHODS);

export function registerPrompts(server: McpServer, service: DocumentationService): void {
  server.registerPrompt(
    'explain_api',
    {
      title: 'Explain API',
      description: 'Explain the overall API structure using only loaded OpenAPI documentation',
      argsSchema: {},
    },
    async () => {
      const documentation = await service.loadDocumentation();
      const endpointSummary = documentation.endpoints
        .slice(0, 50)
        .map((e) => `- ${e.method} ${e.path}${e.summary ? `: ${e.summary}` : ''}`)
        .join('\n');

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Explain this API using ONLY the documentation below. Do not invent endpoints or schemas.',
                '',
                'Overview:',
                JSON.stringify(documentation.overview, null, 2),
                '',
                'Sample endpoints (max 50):',
                endpointSummary || '(none)',
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'review_endpoint',
    {
      title: 'Review endpoint',
      description: 'Review an endpoint design based on documented OpenAPI details',
      argsSchema: {
        path: z.string().describe('Endpoint path'),
        method: httpMethodSchema.describe('HTTP method'),
      },
    },
    async ({ path, method }) => {
      const endpoint = await service.getEndpoint(path, method);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Review the following endpoint design. Use ONLY the documented fields. Flag gaps or inconsistencies.',
                '',
                JSON.stringify(endpoint, null, 2),
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'generate_api_examples',
    {
      title: 'Generate API examples',
      description: 'Generate request/response examples grounded in documented schemas',
      argsSchema: {
        path: z.string().describe('Endpoint path'),
        method: httpMethodSchema.describe('HTTP method'),
      },
    },
    async ({ path, method }) => {
      const endpoint = await service.getEndpoint(path, method);
      const schemaNames = new Set<string>();

      const collectRef = (schema?: Record<string, unknown>): void => {
        const ref = schema?.$ref;
        if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
          schemaNames.add(ref.replace('#/components/schemas/', ''));
        }
      };

      collectRef(endpoint.requestBody?.schema);
      for (const response of endpoint.responses) {
        collectRef(response.schema);
      }

      const schemas = await Promise.all(
        [...schemaNames].map(async (name) => service.getSchema(name)),
      );

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Generate illustrative HTTP request and response examples using ONLY the documentation below.',
                'Do not add properties or status codes that are not documented.',
                '',
                'Endpoint:',
                JSON.stringify(endpoint, null, 2),
                '',
                'Related schemas:',
                JSON.stringify(schemas, null, 2),
              ].join('\n'),
            },
          },
        ],
      };
    },
  );
}
