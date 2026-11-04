import { Client, InMemoryTransport } from '@modelcontextprotocol/client';

import type { DocumentationService } from '../../src/application/services/DocumentationService.js';
import { createMcpServer } from '../../src/presentation/mcp/createMcpServer.js';

export async function connectClient(service: DocumentationService): Promise<{
  client: Client;
  close: () => Promise<void>;
}> {
  const server = await createMcpServer(service);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-harness', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
