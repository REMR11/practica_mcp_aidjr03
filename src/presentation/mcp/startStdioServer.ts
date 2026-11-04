import { serveStdio, type StdioServerHandle } from '@modelcontextprotocol/server/stdio';

import { DocumentationService } from '../../application/services/DocumentationService.js';
import { loadEnvironment } from '../../config/environment.js';
import { SERVER_NAME, SERVER_VERSION } from '../../config/constants.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { FileDocumentationRepository } from '../../infrastructure/repositories/FileDocumentationRepository.js';
import { createMcpServer } from './createMcpServer.js';

export async function startStdioServer(): Promise<StdioServerHandle> {
  const repository = new FileDocumentationRepository(loadEnvironment());
  try {
    await repository.load();
  } catch (error) {
    throw new Error(startupMessage(error), { cause: error });
  }

  const service = new DocumentationService(repository);
  const handle = serveStdio(() => createMcpServer(service));
  console.error(`${SERVER_NAME} v${SERVER_VERSION} escuchando por STDIO`);

  const shutdown = (): void => {
    void handle.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return handle;
}

function startupMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return 'No se pudo iniciar el servidor de documentación.';
}
