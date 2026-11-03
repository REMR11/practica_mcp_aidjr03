import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OpenApiParser } from '../../../src/infrastructure/parsers/OpenApiParser.js';
import { DocumentationLoadError } from '../../../src/domain/errors/DomainError.js';

describe('OpenApiParser', () => {
  const parser = new OpenApiParser();

  it('parses JSON OpenAPI documents', async () => {
    const file = path.join(process.cwd(), 'tests/fixtures/minimal-openapi.json');
    const content = await fs.readFile(file, 'utf8');
    const doc = await parser.parse(content);

    expect(doc.overview.title).toBe('Minimal');
    expect(doc.endpoints).toHaveLength(1);
    expect(doc.endpoints[0]?.path).toBe('/health');
  });

  it('parses YAML example documentation', async () => {
    const file = path.join(process.cwd(), 'examples/openapi.yaml');
    const content = await fs.readFile(file, 'utf8');
    const doc = await parser.parse(content);

    expect(doc.endpoints.length).toBeGreaterThanOrEqual(3);
    expect(doc.schemas.some((s) => s.name === 'User')).toBe(true);
  });

  it('rejects invalid documents', async () => {
    await expect(parser.parse('not-json-or-yaml')).rejects.toBeInstanceOf(DocumentationLoadError);
  });
});
