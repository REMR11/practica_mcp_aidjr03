import path from 'node:path';

export interface AppEnvironment {
  documentationDir: string;
  openApiFile: string;
  maxDocumentBytes: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): AppEnvironment {
  const documentationDir = path.resolve(
    env.DOCUMENTATION_DIR?.trim() || path.join(process.cwd(), 'examples'),
  );
  const openApiFile = env.OPENAPI_FILE?.trim() || 'openapi.yaml';
  const maxDocumentBytes = parsePositiveInt(env.MAX_DOCUMENT_BYTES, 5 * 1024 * 1024);

  return {
    documentationDir,
    openApiFile,
    maxDocumentBytes,
  };
}
