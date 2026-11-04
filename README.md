# API Documentation MCP

Servidor [Model Context Protocol](https://modelcontextprotocol.io) que permite a un asistente de IA consultar documentación técnica descrita en OpenAPI 3.x.

Esta es la fase de inicialización: el proyecto compila, se prueba y se analiza estáticamente. Las capas de dominio, el parser y el servidor MCP se incorporan en fases posteriores.

## Requisitos

- Node.js 22.19 o superior
- npm 10 o superior

## Instalación

```bash
npm install
```

## Comandos

| Comando                | Descripción                                 |
| ---------------------- | ------------------------------------------- |
| `npm run build`        | Compila TypeScript a `dist/`                |
| `npm start`            | Ejecuta el artefacto compilado              |
| `npm run dev`          | Ejecuta el código fuente con `tsx`          |
| `npm test`             | Ejecuta las pruebas con Vitest              |
| `npm run lint`         | Analiza el código con ESLint                |
| `npm run format`       | Formatea el repositorio con Prettier        |
| `npm run format:check` | Comprueba el formato sin modificar archivos |

## Estructura

```text
src/                 Código de la aplicación, por capas
tests/unit           Pruebas unitarias
tests/integration    Pruebas de integración
tests/fixtures       Documentos OpenAPI de prueba
docs/                Documentación técnica
examples/            Especificaciones de ejemplo
```

## Configuración

Copia `.env.example` y ajusta el documento que se va a consultar. Las variables también pueden exportarse en el entorno del proceso.

| Variable             | Valor inicial  | Uso                           |
| -------------------- | -------------- | ----------------------------- |
| `DOCS_DIR`           | `./examples`   | Directorio autorizado         |
| `OPENAPI_FILE`       | `openapi.yaml` | Archivo relativo a `DOCS_DIR` |
| `MAX_DOCUMENT_BYTES` | `1048576`      | Tamaño máximo del archivo     |

## Ejecutar

```bash
npm run dev
```

El proceso espera mensajes MCP en stdin y responde por stdout. Los registros se escriben en stderr. Si el documento no puede cargarse, el proceso termina sin escribir en stdout.

Para el artefacto compilado:

```bash
npm run build
npm start
```

## Conectar un cliente

Ejemplo de configuración para un cliente que lanza el servidor:

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

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector npm run dev
```

En el inspector, conecta el servidor. La respuesta de inicialización incluye el nombre `api-documentation-mcp` y la versión del paquete.

El SDK utilizado es `@modelcontextprotocol/server` 2.4. La decisión está en `docs/decisions/001-mcp-sdk-v2.md`.
