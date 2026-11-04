import path from 'node:path';

import SwaggerParser from '@apidevtools/swagger-parser';

import type { ApiDocumentation } from '../../domain/entities/ApiDocumentation.js';
import { DomainError, InvalidDocumentationError } from '../../domain/errors/DomainError.js';
import { mapOpenApiDocument } from './mapOpenApiDocument.js';
import { openApiParserOptions } from './parserOptions.js';

export class OpenApiParser {
  async parseFile(filePath: string, sourceName: string): Promise<ApiDocumentation> {
    let document: unknown;
    try {
      document = await SwaggerParser.validate(filePath, openApiParserOptions);
    } catch (error) {
      throw toDocumentationError(error, filePath);
    }

    return mapOpenApiDocument(document, sourceName);
  }
}

function toDocumentationError(error: unknown, filePath: string): InvalidDocumentationError {
  if (error instanceof InvalidDocumentationError) {
    return error;
  }
  if (error instanceof DomainError) {
    return new InvalidDocumentationError(error.message);
  }

  const sanitized = sanitizeMessage(error instanceof Error ? error.message : '', filePath);
  if (/circular/i.test(sanitized)) {
    return new InvalidDocumentationError('El documento contiene referencias circulares.');
  }
  if (/\$ref|pointer|resolv/i.test(sanitized)) {
    return new InvalidDocumentationError(`Referencia no resuelta. ${clip(sanitized)}`);
  }
  if (sanitized.length === 0) {
    return new InvalidDocumentationError('No se pudo interpretar la especificación OpenAPI.');
  }
  return new InvalidDocumentationError(
    `La especificación OpenAPI no es válida: ${clip(sanitized)}`,
  );
}

function sanitizeMessage(message: string, filePath: string): string {
  const absolute = path.resolve(filePath);
  return message
    .split(absolute)
    .join('documento')
    .split(filePath)
    .join('documento')
    .split(process.cwd())
    .join('.');
}

function clip(message: string): string {
  const compact = message.replace(/\s+/g, ' ').trim();
  return compact.length > 300 ? `${compact.slice(0, 297)}...` : compact;
}
