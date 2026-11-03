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

## Estado

Fase 01 — inicialización del entorno. El proceso de entrada escribe en stderr para no interferir con el canal STDIO que usará el protocolo MCP.
