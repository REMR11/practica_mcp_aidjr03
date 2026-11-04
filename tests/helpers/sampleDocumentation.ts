import { DocumentationService } from '../../src/application/services/DocumentationService.js';
import { createApiEndpoint } from '../../src/domain/entities/ApiEndpoint.js';
import type { ApiDocumentation } from '../../src/domain/entities/ApiDocumentation.js';
import { createApiSchema } from '../../src/domain/entities/ApiSchema.js';
import { InMemoryDocumentationRepository } from './InMemoryDocumentationRepository.js';

export function sampleDocumentation(): ApiDocumentation {
  return {
    title: 'Users API',
    version: '1.0.0',
    openApiVersion: '3.0.3',
    sourceName: 'openapi.yaml',
    servers: ['https://api.example.com'],
    tags: [{ name: 'users', description: 'Gestión de usuarios' }],
    security: [{ name: 'bearerAuth', scopes: [] }],
    description: 'API de ejemplo.',
    endpoints: [
      createApiEndpoint({
        path: '/api/users',
        method: 'GET',
        tags: ['users'],
        summary: 'Lista usuarios',
        description: 'Devuelve los usuarios registrados.',
        responses: [{ statusCode: '200', description: 'Correcto', content: [] }],
      }),
      createApiEndpoint({
        path: '/api/auth/login',
        method: 'POST',
        tags: ['auth'],
        description: 'Autenticación con correo y contraseña.',
        security: [],
        responses: [{ statusCode: '200', description: 'Sesión creada', content: [] }],
      }),
    ],
    schemas: [
      createApiSchema({
        name: 'User',
        type: 'object',
        description: 'Usuario registrado',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', minLength: 3 } },
      }),
    ],
  };
}

export function sampleService(): DocumentationService {
  return new DocumentationService(new InMemoryDocumentationRepository(sampleDocumentation()));
}
