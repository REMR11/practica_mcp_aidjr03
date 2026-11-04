export interface DocumentationSource {
  readonly docsDir: string;
  readonly fileName: string;
  readonly maxDocumentBytes: number;
}

const DEFAULT_MAX_DOCUMENT_BYTES = 1_048_576;

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): DocumentationSource {
  const docsDir = readValue(env.DOCS_DIR) ?? './examples';
  const fileName = readValue(env.OPENAPI_FILE) ?? 'openapi.yaml';
  const rawMax = readValue(env.MAX_DOCUMENT_BYTES) ?? String(DEFAULT_MAX_DOCUMENT_BYTES);
  if (!/^[1-9]\d*$/.test(rawMax)) {
    throw new Error('MAX_DOCUMENT_BYTES debe ser un entero positivo.');
  }

  return {
    docsDir,
    fileName,
    maxDocumentBytes: Number(rawMax),
  };
}

function readValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}
