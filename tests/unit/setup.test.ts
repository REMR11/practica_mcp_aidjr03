import { describe, expect, it } from 'vitest';

import { SERVER_NAME, SERVER_VERSION } from '../../src/index.js';

describe('inicialización del proyecto', () => {
  it('expone el nombre y la versión del servidor', () => {
    expect(SERVER_NAME).toBe('api-documentation-mcp');
    expect(SERVER_VERSION).toBe('0.1.0');
  });
});
