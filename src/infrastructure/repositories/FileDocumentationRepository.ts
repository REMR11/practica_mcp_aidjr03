import fs from 'node:fs/promises';
import path from 'node:path';
import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import { DocumentationLoadError, ValidationError } from '../../domain/errors/DomainError.js';
import type { DocumentationRepository } from '../../domain/interfaces/DocumentationRepository.js';
import { OpenApiParser } from '../parsers/OpenApiParser.js';

export interface FileDocumentationRepositoryOptions {
  authorizedRootDir: string;
  fileName: string;
  maxDocumentBytes: number;
}

export class FileDocumentationRepository implements DocumentationRepository {
  private cached: ApiDocumentation | null = null;
  private readonly parser = new OpenApiParser();
  private readonly resolvedFilePath: string;

  constructor(private readonly options: FileDocumentationRepositoryOptions) {
    this.resolvedFilePath = this.resolveAuthorizedPath(options.authorizedRootDir, options.fileName);
  }

  async load(): Promise<ApiDocumentation> {
    if (this.cached) {
      return this.cached;
    }

    let stat;
    try {
      stat = await fs.stat(this.resolvedFilePath);
    } catch {
      throw new DocumentationLoadError(
        `OpenAPI file not found: ${path.basename(this.resolvedFilePath)}`,
      );
    }

    if (!stat.isFile()) {
      throw new DocumentationLoadError('Documentation path is not a file');
    }

    if (stat.size > this.options.maxDocumentBytes) {
      throw new ValidationError(
        `Document exceeds maximum size of ${this.options.maxDocumentBytes} bytes`,
      );
    }

    let content: string;
    try {
      content = await fs.readFile(this.resolvedFilePath, 'utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DocumentationLoadError(`Failed to read documentation file: ${message}`);
    }

    this.cached = await this.parser.parse(content, path.basename(this.resolvedFilePath));
    return this.cached;
  }

  /** @internal */
  resolveAuthorizedPath(rootDir: string, fileName: string): string {
    const resolvedRoot = path.resolve(rootDir);
    const candidate = path.resolve(resolvedRoot, fileName);

    const relative = path.relative(resolvedRoot, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new ValidationError('Access to files outside the authorized directory is not allowed');
    }

    return candidate;
  }
}
