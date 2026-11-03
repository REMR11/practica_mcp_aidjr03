import { pathToFileURL } from 'node:url';

export const SERVER_NAME = 'api-documentation-mcp';
export const SERVER_VERSION = '0.1.0';

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  console.error(`${SERVER_NAME} v${SERVER_VERSION} — entorno inicializado`);
}
