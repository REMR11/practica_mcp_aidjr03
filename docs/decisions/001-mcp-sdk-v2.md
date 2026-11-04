# ADR 001 — SDK de MCP v2

## Contexto

El paquete histórico `@modelcontextprotocol/sdk` 1.32 permanece como línea de mantenimiento. Su README indica que la versión estable actual es la v2 y que el soporte del borrador 2026-07-28 no está previsto en v1.

## Decisión

El servidor usa `@modelcontextprotocol/server` 2.4.0 y las pruebas de cliente usan `@modelcontextprotocol/client` 2.4.0.

- Las herramientas, recursos y prompts se registran con `registerTool`, `registerResource` y `registerPrompt`.
- La entrada STDIO es `serveStdio(factory)`. El proceso no escribe el protocolo con `console.log`; los registros van a stderr.
- El cierre usa `StdioServerHandle.close()` ante `SIGINT` y `SIGTERM`.
- Los esquemas de entrada usan Zod 4, que es la dependencia del SDK.

## Consecuencias

Los ejemplos de la documentación v1 que importan `@modelcontextprotocol/sdk/server/mcp.js` no aplican a este proyecto. La guía de referencia es https://ts.sdk.modelcontextprotocol.io/v2/.
