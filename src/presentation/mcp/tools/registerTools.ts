import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { DocumentationService } from '../../../application/services/DocumentationService.js';
import { toolFailure, toolJson } from '../toolResult.js';

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function registerTools(server: McpServer, service: DocumentationService): void {
  server.registerTool(
    'search_documentation',
    {
      title: 'Buscar documentación',
      description:
        'Busca en rutas, métodos HTTP, descripciones, etiquetas y esquemas de la documentación cargada.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Texto a buscar. No puede estar vacío.'),
      }),
      annotations: readOnly,
    },
    async ({ query }) => {
      try {
        return toolJson(await service.search(query));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    'list_endpoints',
    {
      title: 'Listar endpoints',
      description:
        'Lista las operaciones documentadas. El método y la etiqueta son filtros opcionales.',
      inputSchema: z.object({
        method: z.string().optional().describe('Método HTTP, por ejemplo GET.'),
        tag: z.string().optional().describe('Etiqueta OpenAPI.'),
      }),
      annotations: readOnly,
    },
    async ({ method, tag }) => {
      try {
        return toolJson(
          await service.list({
            ...(method !== undefined ? { method } : {}),
            ...(tag !== undefined ? { tag } : {}),
          }),
        );
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    'get_endpoint',
    {
      title: 'Detalle de endpoint',
      description:
        'Devuelve método, ruta, descripción, parámetros, cuerpo, respuestas, esquemas relacionados y seguridad declarada.',
      inputSchema: z.object({
        path: z.string().min(1).describe('Ruta OpenAPI, por ejemplo /api/users.'),
        method: z.string().min(1).describe('Método HTTP.'),
      }),
      annotations: readOnly,
    },
    async ({ path, method }) => {
      try {
        return toolJson(await service.endpoint(path, method));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  server.registerTool(
    'get_schema',
    {
      title: 'Detalle de esquema',
      description:
        'Devuelve propiedades, tipos, restricciones y referencias ya resueltas de un esquema.',
      inputSchema: z.object({
        schemaName: z.string().min(1).describe('Nombre del esquema en components.schemas.'),
      }),
      annotations: readOnly,
    },
    async ({ schemaName }) => {
      try {
        return toolJson(await service.schema(schemaName));
      } catch (error) {
        return toolFailure(error);
      }
    },
  );
}
