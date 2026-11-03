import { DomainError } from '../../domain/errors/DomainError.js';

export function formatToolError(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  if (error instanceof DomainError) {
    return {
      content: [{ type: 'text', text: `${error.name}: ${error.message}` }],
      isError: true,
    };
  }

  if (error instanceof Error) {
    return {
      content: [{ type: 'text', text: error.message }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: 'Unknown error' }],
    isError: true,
  };
}

export function jsonText(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}
