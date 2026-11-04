# Guía de desarrollo

## Capas

| Capa            | Directorio             | Puede depender de                           |
| --------------- | ---------------------- | ------------------------------------------- |
| Dominio         | `src/domain`           | Nada externo al dominio                     |
| Aplicación      | `src/application`      | Dominio                                     |
| Infraestructura | `src/infrastructure`   | Dominio y Swagger Parser                    |
| Presentación    | `src/presentation/mcp` | Aplicación y `@modelcontextprotocol/server` |

Una herramienta nueva llama a `DocumentationService`. No lee archivos ni recorre el documento OpenAPI por su cuenta. Un cambio de interpretación se hace en el parser y se refleja en las entidades.

## Comandos

```bash
npm run dev
npm test
npm run lint
npm run build
npm run format
```

Node.js 22.19 o superior. El proyecto es ESM: los imports relativos llevan extensión `.js`.

## Agregar una especificación

Coloca el archivo en el directorio autorizado y apunta `DOCS_DIR` y `OPENAPI_FILE` a él. El procedimiento y las restricciones están en [api-documentation.md](api-documentation.md) y [security.md](security.md).

## Ramas

Cada cambio funcional sigue Conventional Commits y una rama propia, por ejemplo `feature/03-openapi-parser`. La rama parte de `main` e integra hacia `main`.

## Contribución

1. Instala las dependencias y comprueba que `npm test`, `npm run lint`, `npm run build` y `npm run format:check` pasan antes de empezar.
2. Limita el cambio a una capa cuando sea posible. El dominio no importa el SDK de MCP ni `node:fs`.
3. Añade una prueba del caso exitoso y del caso que debe fallar.
4. No registres secretos, rutas absolutas de tu máquina ni documentos que el servidor no deba leer.
5. Actualiza el documento de `docs/` que corresponda.
6. Describe en el pull request el objetivo, lo implementado, las pruebas y las limitaciones.

Las referencias externas de OpenAPI no se descargan. Si una prueba necesita otro archivo, ponlo en `tests/fixtures/` y comprueba que el servidor lo rechaza cuando está fuera del directorio autorizado.
