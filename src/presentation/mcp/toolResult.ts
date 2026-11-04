import type { CallToolResult } from '@modelcontextprotocol/server';

import { DomainError } from '../../domain/errors/DomainError.js';

export function toolJson(value: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

export function toolFailure(error: unknown): CallToolResult {
  const message =
    error instanceof DomainError
      ? error.message
      : 'No se pudo completar la consulta de documentación.';
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
