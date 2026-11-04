# Guía de pruebas

## Comandos

```bash
npm test
npm run lint
npm run build
npm run format:check
```

`npm test` ejecuta Vitest una vez. No deja procesos en espera.

## Qué cubre la suite

| Área         | Ubicación                                                         | Escenarios                                                                                                                                   |
| ------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Dominio      | `tests/unit/domain`                                               | Métodos, rutas, parámetros obligatorios, esquemas y códigos de error                                                                         |
| Parser       | `tests/unit/infrastructure/openapi-parser.test.ts`                | YAML, JSON, referencias internas, Swagger 2.0, referencia ausente, referencia externa, archivo vecino, referencia circular y YAML malformado |
| Repositorio  | `tests/unit/infrastructure/file-documentation-repository.test.ts` | Carga, filtros, path traversal, enlace simbólico, archivo ausente, tamaño y directorio usado como archivo                                    |
| Casos de uso | `tests/unit/application`                                          | Búsqueda, orden estable, filtros, consultas vacías y elementos ausentes                                                                      |
| Servidor     | `tests/integration/mcp-server.test.ts`                            | `initialize` en memoria, STDIO con herramientas, recursos y prompts, y arranque fallido con stdout vacío                                     |
| Herramientas | `tests/integration/mcp-tools.test.ts`                             | Resultados y entradas inválidas                                                                                                              |
| Recursos     | `tests/integration/mcp-resources.test.ts`                         | Contenido y error de lectura                                                                                                                 |
| Prompts      | `tests/integration/mcp-prompts.test.ts`                           | Plantillas, argumentos y endpoint ausente                                                                                                    |

## Escenarios negativos

- Documento sin versión, Swagger 2.0, `$ref` interno inexistente, `$ref` HTTP y `$ref` a otro archivo.
- Referencia circular y YAML que no se puede leer.
- Ruta `../`, enlace simbólico hacia fuera del directorio, archivo mayor que el límite y origen que no es un archivo.
- Búsqueda vacía, método `FETCH`, endpoint o esquema inexistente.
- Herramienta sin argumentos obligatorios y prompt sin `path`.
- Arranque con `OPENAPI_FILE` inexistente: el proceso termina, stderr explica el problema y stdout queda vacío.

## MCP Inspector

Con el proyecto instalado:

```bash
npx @modelcontextprotocol/inspector npm run dev
```

Conecta el servidor y comprueba las pestañas Tools, Resources y Prompts. Una llamada de ejemplo es `search_documentation` con `query` igual a `usuarios`. La suite automática usa el cliente `@modelcontextprotocol/client` porque este entorno no abre el inspector en un navegador.
