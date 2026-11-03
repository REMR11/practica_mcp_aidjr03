# API Documentation MCP Server

Servidor [Model Context Protocol (MCP)](https://modelcontextprotocol.io) que expone documentación **OpenAPI 3.x** mediante herramientas, recursos y prompts reutilizables.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
git clone https://github.com/REMR11/practica_mcp_aidjr03.git
cd practica_mcp_aidjr03
npm install
npm run build
```

## Configuración

Copia `.env.example` y ajusta las variables:

| Variable             | Descripción                          | Valor por defecto |
| -------------------- | ------------------------------------ | ----------------- |
| `DOCUMENTATION_DIR`  | Directorio autorizado con el OpenAPI | `./examples`      |
| `OPENAPI_FILE`       | Nombre del archivo OpenAPI           | `openapi.yaml`    |
| `MAX_DOCUMENT_BYTES` | Tamaño máximo del documento          | `5242880`         |

## Ejecución

```bash
npm start
```

El servidor usa transporte **STDIO**. Los mensajes de error de arranque se escriben en **stderr** para no interferir con MCP.

### Cliente MCP (ejemplo)

```json
{
  "mcpServers": {
    "api-documentation": {
      "command": "node",
      "args": ["/ruta/al/proyecto/dist/index.js"],
      "env": {
        "DOCUMENTATION_DIR": "/ruta/al/proyecto/examples",
        "OPENAPI_FILE": "openapi.yaml"
      }
    }
  }
}
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Herramientas MCP

| Tool                   | Descripción                          |
| ---------------------- | ------------------------------------ |
| `search_documentation` | Busca endpoints por palabra clave    |
| `list_endpoints`       | Lista endpoints (filtros opcionales) |
| `get_endpoint`         | Detalle de un endpoint               |
| `get_schema`           | Esquema de componentes               |

Ver [docs/mcp-tools.md](docs/mcp-tools.md).

## Recursos MCP

- `api://documentation/overview`
- `api://documentation/endpoints`
- `api://documentation/schemas`

Ver [docs/mcp-resources.md](docs/mcp-resources.md).

## Prompts MCP

- `explain_api`
- `review_endpoint`
- `generate_api_examples`

Ver [docs/mcp-prompts.md](docs/mcp-prompts.md).

## Scripts

| Comando                | Acción                       |
| ---------------------- | ---------------------------- |
| `npm run build`        | Compila TypeScript a `dist/` |
| `npm start`            | Inicia el servidor MCP       |
| `npm test`             | Ejecuta pruebas (Vitest)     |
| `npm run lint`         | ESLint                       |
| `npm run format:check` | Verifica formato Prettier    |
| `npm run format`       | Formatea el código           |

## Arquitectura

Proyecto organizado en capas (dominio, aplicación, infraestructura, presentación MCP). Detalle en [docs/architecture.md](docs/architecture.md).

## Documentación adicional

- [Guía de desarrollo](docs/development-guide.md)
- [Interpretación OpenAPI](docs/api-documentation.md)
- [Pruebas](docs/testing-guide.md)
- [Seguridad](docs/security.md)

## Licencia

MIT — ver [LICENSE](LICENSE).
