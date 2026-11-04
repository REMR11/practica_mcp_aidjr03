import { describe, expect, it } from 'vitest';

import { connectClient } from '../helpers/connectClient.js';
import { sampleService } from '../helpers/sampleDocumentation.js';

describe('prompts MCP', () => {
  it('publica las plantillas y las llena con la documentación', async () => {
    const { client, close } = await connectClient(sampleService());
    const listed = await client.listPrompts();
    expect(listed.prompts.map((prompt) => prompt.name).sort()).toEqual([
      'explain_api',
      'generate_api_examples',
      'review_endpoint',
    ]);

    const explained = await client.getPrompt({ name: 'explain_api' });
    const explanation = messageText(explained.messages[0]);
    expect(explanation).toContain('Users API');
    expect(explanation).toContain('/api/users');
    expect(explanation).toContain('No inventes');

    const review = await client.getPrompt({
      name: 'review_endpoint',
      arguments: { path: '/api/users', method: 'GET' },
    });
    const reviewText = messageText(review.messages[0]);
    expect(reviewText).toContain('"method": "GET"');
    expect(reviewText).toContain('No inventes');

    const examples = await client.getPrompt({
      name: 'generate_api_examples',
      arguments: { path: '/api/users', method: 'GET' },
    });
    const exampleText = messageText(examples.messages[0]);
    expect(exampleText).toContain('"requestBody": null');
    expect(exampleText).toContain('no lo inventes');

    await close();
  });

  it('valida los argumentos y no fabrica un endpoint ausente', async () => {
    const { client, close } = await connectClient(sampleService());
    await expect(client.getPrompt({ name: 'review_endpoint', arguments: {} })).rejects.toThrow(
      /path|Invalid/i,
    );
    await expect(
      client.getPrompt({
        name: 'generate_api_examples',
        arguments: { path: '/api/missing', method: 'GET' },
      }),
    ).rejects.toThrow(/No existe el endpoint/);
    await close();
  });
});

function messageText(
  message:
    | { content: { type: string; text?: string } | readonly { type: string; text?: string }[] }
    | undefined,
): string {
  const content = message?.content;
  const block = Array.isArray(content) ? content[0] : content;
  if (block?.type !== 'text' || block.text === undefined) {
    throw new Error('El prompt no devolvió texto.');
  }
  return block.text;
}
