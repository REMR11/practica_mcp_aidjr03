import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { DocumentationService } from '../../../application/services/DocumentationService.js';
import type { ApiEndpoint } from '../../../domain/entities/ApiEndpoint.js';
import { DomainError } from '../../../domain/errors/DomainError.js';

const endpointArguments = z.object({
  path: z.string().min(1).describe('Ruta documentada, por ejemplo /api/users.'),
  method: z.string().min(1).describe('Método HTTP documentado.'),
});

const documentedOnly =
  'Usa exclusivamente el JSON incluido. No inventes rutas, métodos, parámetros, propiedades, códigos de respuesta ni requisitos de seguridad. Si un dato no está, dilo de forma explícita.';

export function registerPrompts(server: McpServer, service: DocumentationService): void {
  server.registerPrompt(
    'explain_api',
    {
      title: 'Explicar API',
      description:
        'Explica la estructura general de la API, sus funcionalidades y sus recursos principales.',
    },
    async () => {
      const document = await service.documentation();
      return userMessage(
        `${documentedOnly}\n\nExplica la estructura general de esta API, sus funcionalidades y sus recursos principales.\n\n${JSON.stringify(document, null, 2)}`,
      );
    },
  );

  server.registerPrompt(
    'review_endpoint',
    {
      title: 'Revisar endpoint',
      description:
        'Analiza el diseño de un endpoint usando exclusivamente la documentación disponible.',
      argsSchema: endpointArguments,
    },
    async ({ path, method }) => {
      const endpoint = await readEndpoint(service, path, method);
      return userMessage(
        `${documentedOnly}\n\nRevisa el diseño de esta operación. Señala qué está documentado y qué no lo está.\n\n${JSON.stringify(endpoint, null, 2)}`,
      );
    },
  );

  server.registerPrompt(
    'generate_api_examples',
    {
      title: 'Generar ejemplos',
      description:
        'Genera ejemplos ilustrativos de solicitud y respuesta a partir de los esquemas documentados.',
      argsSchema: endpointArguments,
    },
    async ({ path, method }) => {
      const endpoint = await readEndpoint(service, path, method);
      return userMessage(
        `${documentedOnly}\n\nGenera ejemplos ilustrativos de solicitud y respuesta solo a partir de los esquemas de esta operación. ` +
          'Si no hay cuerpo de solicitud, no lo inventes. Respeta enum, format, required y el resto de restricciones. ' +
          'Indica que los valores son ilustrativos.\n\n' +
          JSON.stringify(exampleSource(endpoint), null, 2),
      );
    },
  );
}

function userMessage(text: string) {
  return {
    messages: [
      {
        role: 'user' as const,
        content: { type: 'text' as const, text },
      },
    ],
  };
}

async function readEndpoint(
  service: DocumentationService,
  path: string,
  method: string,
): Promise<ApiEndpoint> {
  try {
    return await service.endpoint(path, method);
  } catch (error) {
    const message =
      error instanceof DomainError ? error.message : 'No se pudo consultar el endpoint.';
    throw new Error(message, { cause: error });
  }
}

function exampleSource(endpoint: ApiEndpoint) {
  return {
    method: endpoint.method,
    path: endpoint.path,
    parameters: endpoint.parameters,
    requestBody: endpoint.requestBody ?? null,
    responses: endpoint.responses,
  };
}
