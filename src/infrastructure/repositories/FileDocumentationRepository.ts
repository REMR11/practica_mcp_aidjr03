import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';

import type { DocumentationSource } from '../../config/environment.js';
import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import type { ApiEndpoint } from '../../domain/entities/ApiEndpoint.js';
import type { ApiSchema } from '../../domain/entities/ApiSchema.js';
import type { HttpMethod } from '../../domain/entities/HttpMethod.js';
import {
  DocumentTooLargeError,
  DocumentationNotFoundError,
  InvalidDocumentationError,
  UnauthorizedPathError,
} from '../../domain/errors/DomainError.js';
import type {
  DocumentationRepository,
  EndpointQuery,
} from '../../domain/interfaces/DocumentationRepository.js';
import { OpenApiParser } from '../parsers/OpenApiParser.js';

const ALLOWED_EXTENSIONS = new Set(['.json', '.yaml', '.yml']);

export class FileDocumentationRepository implements DocumentationRepository {
  private cached: ApiDocumentation | undefined;

  constructor(
    private readonly source: DocumentationSource,
    private readonly parser: OpenApiParser = new OpenApiParser(),
  ) {}

  async load(): Promise<ApiDocumentation> {
    return this.document();
  }

  async listEndpoints(query: EndpointQuery = {}): Promise<readonly ApiEndpoint[]> {
    const document = await this.document();
    const tag = query.tag?.trim().toLowerCase();
    return document.endpoints.filter((endpoint) => {
      if (query.method !== undefined && endpoint.method !== query.method) {
        return false;
      }
      if (
        tag !== undefined &&
        tag.length > 0 &&
        !endpoint.tags.some((item) => item.toLowerCase() === tag)
      ) {
        return false;
      }
      if (query.path !== undefined && endpoint.path !== query.path) {
        return false;
      }
      return true;
    });
  }

  async getEndpoint(endpointPath: string, method: HttpMethod): Promise<ApiEndpoint | undefined> {
    const endpoints = await this.listEndpoints({ path: endpointPath, method });
    return endpoints[0];
  }

  async listSchemas(): Promise<readonly ApiSchema[]> {
    const document = await this.document();
    return document.schemas;
  }

  async getSchema(schemaName: string): Promise<ApiSchema | undefined> {
    const schemas = await this.listSchemas();
    return schemas.find((schema) => schema.name === schemaName);
  }

  private async document(): Promise<ApiDocumentation> {
    if (this.cached === undefined) {
      const located = await this.locateAuthorizedFile();
      this.cached = await this.parser.parseFile(located.filePath, located.sourceName);
    }
    return this.cached;
  }

  private async locateAuthorizedFile(): Promise<{ filePath: string; sourceName: string }> {
    const fileName = this.source.fileName.trim();
    const extension = path.extname(fileName).toLowerCase();
    if (
      fileName.length === 0 ||
      fileName.includes('\0') ||
      path.isAbsolute(fileName) ||
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      throw new UnauthorizedPathError();
    }

    let root: string;
    try {
      root = await realpath(path.resolve(this.source.docsDir));
    } catch (error) {
      if (isErrno(error, 'ENOENT')) {
        throw new DocumentationNotFoundError('El directorio de documentación no está disponible.');
      }
      throw new InvalidDocumentationError('No se pudo leer el directorio de documentación.');
    }

    const candidate = path.resolve(root, fileName);
    if (!isInside(root, candidate)) {
      throw new UnauthorizedPathError();
    }

    let fileInfo: Awaited<ReturnType<typeof stat>>;
    try {
      fileInfo = await stat(candidate);
    } catch (error) {
      if (isErrno(error, 'ENOENT')) {
        throw new DocumentationNotFoundError('No se encontró el documento OpenAPI.');
      }
      throw new InvalidDocumentationError('No se pudo leer el documento OpenAPI.');
    }

    if (!fileInfo.isFile()) {
      throw new InvalidDocumentationError('El origen indicado no es un archivo.');
    }
    if (fileInfo.size > this.source.maxDocumentBytes) {
      throw new DocumentTooLargeError();
    }

    let realFile: string;
    try {
      realFile = await realpath(candidate);
    } catch {
      throw new InvalidDocumentationError('No se pudo leer el documento OpenAPI.');
    }
    if (!isInside(root, realFile)) {
      throw new UnauthorizedPathError();
    }

    return {
      filePath: realFile,
      sourceName: path.relative(root, realFile).split(path.sep).join('/'),
    };
  }
}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

function isErrno(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
