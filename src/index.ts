#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

import { SERVER_NAME, SERVER_VERSION } from './config/constants.js';
import { startStdioServer } from './presentation/mcp/startStdioServer.js';

export { SERVER_NAME, SERVER_VERSION };

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  void startStdioServer().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar el servidor.';
    console.error(message);
    process.exitCode = 1;
  });
}
