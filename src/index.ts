#!/usr/bin/env node
import { DocumentationService } from './application/services/DocumentationService.js';
import { loadEnvironment } from './config/environment.js';
import { FileDocumentationRepository } from './infrastructure/repositories/FileDocumentationRepository.js';
import { startStdioMcpServer } from './presentation/mcp/McpServerFactory.js';

async function main(): Promise<void> {
  const env = loadEnvironment();
  const repository = new FileDocumentationRepository({
    authorizedRootDir: env.documentationDir,
    fileName: env.openApiFile,
    maxDocumentBytes: env.maxDocumentBytes,
  });

  const service = new DocumentationService(repository);

  try {
    await service.loadDocumentation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load OpenAPI documentation: ${message}`);
    process.exit(1);
  }

  await startStdioMcpServer(service);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
