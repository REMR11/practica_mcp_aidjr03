# API Documentation MCP

Servidor [Model Context Protocol](https://modelcontextprotocol.io) que permite a un asistente consultar una especificación OpenAPI 3.x. Interpreta el documento, busca operaciones, devuelve el detalle de un endpoint o de un esquema, y publica esa información como herramientas, recursos y prompts.

La versión 1.0 lee un archivo local. No llama a la API documentada ni modifica el archivo.

## Requisitos

- Node.js 22.19 o superior
- npm 10 o superior

## Instalación

```bash
npm install
```

El ejemplo incluido es `examples/openapi.yaml`, una API de usuarios. No hace falta descargar otra especificación para probar el servidor.

## Configuración

Las variables son opcionales. Sin ellas se usa el ejemplo.

| Variable             | Valor inicial  | Uso                           |
| -------------------- | -------------- | ----------------------------- |
| `DOCS_DIR`           | `./examples`   | Directorio autorizado         |
| `OPENAPI_FILE`       | `openapi.yaml` | Archivo relativo a `DOCS_DIR` |
| `MAX_DOCUMENT_BYTES` | `1048576`      | Tamaño máximo del archivo     |

```bash
export DOCS_DIR=./examples
export OPENAPI_FILE=openapi.yaml
```

El archivo tiene que ser `.yaml`, `.yml` o `.json` y quedar, también si es un enlace simbólico, dentro de `DOCS_DIR`. Los detalles están en [docs/security.md](docs/security.md).

## Ejecutar

```bash
npm run dev
```

El proceso espera mensajes MCP en stdin y responde por stdout. Los registros van a stderr. Si el documento no existe o no es OpenAPI 3.x válido, el proceso termina y stdout queda vacío.

Para el artefacto compilado:

```bash
npm run build
npm start
```

## Conectar un cliente

```json
{
  "mcpServers": {
    "api-documentation": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/ruta/al/proyecto",
      "env": {
        "DOCS_DIR": "./examples",
        "OPENAPI_FILE": "openapi.yaml"
      }
    }
  }
}
```

El servidor se identifica como `api-documentation-mcp` versión `1.0.0`.

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector npm run dev
```

Pulsa Connect. En Tools, Resources y Prompts aparecen las capacidades de abajo. El cliente de las pruebas automáticas es `@modelcontextprotocol/client`; el inspector usa el mismo transporte STDIO.

### Herramientas

| Nombre                 | Ejemplo de argumentos                        |
| ---------------------- | -------------------------------------------- |
| `search_documentation` | `{ "query": "autenticación" }`               |
| `list_endpoints`       | `{ "method": "GET", "tag": "users" }`        |
| `get_endpoint`         | `{ "path": "/api/users", "method": "POST" }` |
| `get_schema`           | `{ "schemaName": "User" }`                   |

`search_documentation` con `autenticación` devuelve `POST /api/auth/login`. `get_schema` con `User` devuelve `id`, `email` y `role`. Una búsqueda sin coincidencias devuelve `matches` vacío. Un método desconocido o un endpoint ausente vuelve como error de la herramienta.

### Recursos

| URI                             | Contenido                                                |
| ------------------------------- | -------------------------------------------------------- |
| `api://documentation/overview`  | Título, versión, servidores, etiquetas y conteos         |
| `api://documentation/endpoints` | Operaciones, parámetros, cuerpos, respuestas y seguridad |
| `api://documentation/schemas`   | Esquemas con propiedades y restricciones                 |

El overview del ejemplo informa la API `Users API`, cuatro operaciones y cuatro esquemas.

### Prompts

| Nombre                  | Argumentos       | Uso                                                      |
| ----------------------- | ---------------- | -------------------------------------------------------- |
| `explain_api`           | ninguno          | Explica la API con el documento cargado                  |
| `review_endpoint`       | `path`, `method` | Revisa una operación documentada                         |
| `generate_api_examples` | `path`, `method` | Pide ejemplos solo a partir de los esquemas documentados |

`review_endpoint` con `/api/users` y `GET` incluye esa operación y la instrucción de no inventar datos. Si la operación no existe, el prompt falla con el mensaje de dominio.

## Pruebas

```bash
npm test
npm run lint
npm run build
npm run format:check
```

`npm test` cubre el dominio, el parser, el repositorio, los casos de uso y el protocolo MCP, incluido un proceso STDIO real. La matriz está en [docs/testing-guide.md](docs/testing-guide.md).

## Documentación

| Documento                                                            | Contenido                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                         | Capas, entidades y errores                           |
| [docs/api-documentation.md](docs/api-documentation.md)               | Cómo se interpreta OpenAPI y cómo agregar un archivo |
| [docs/use-cases.md](docs/use-cases.md)                               | Entradas y salidas de la búsqueda y las consultas    |
| [docs/mcp-tools.md](docs/mcp-tools.md)                               | Herramientas                                         |
| [docs/mcp-resources.md](docs/mcp-resources.md)                       | Recursos                                             |
| [docs/mcp-prompts.md](docs/mcp-prompts.md)                           | Prompts                                              |
| [docs/security.md](docs/security.md)                                 | Límites de lectura y dependencias                    |
| [docs/testing-guide.md](docs/testing-guide.md)                       | Escenarios de prueba                                 |
| [docs/development-guide.md](docs/development-guide.md)               | Desarrollo y contribución                            |
| [docs/decisions/001-mcp-sdk-v2.md](docs/decisions/001-mcp-sdk-v2.md) | Elección del SDK                                     |

## Licencia

MIT. Ver [LICENSE](LICENSE).
