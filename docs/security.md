# Seguridad

El servidor lee un archivo local y lo entrega a un cliente MCP. No llama a la API documentada, no modifica el archivo y no ejecuta su contenido.

## Límites

| Control                | Comportamiento                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directorio autorizado  | `OPENAPI_FILE` se resuelve dentro de `DOCS_DIR`. Una ruta absoluta, un `..` que salga del directorio o un enlace simbólico cuyo destino real esté fuera se rechazan con `UNAUTHORIZED_PATH`. |
| Nombre del archivo     | Solo `.yaml`, `.yml` y `.json`. Se rechazan caracteres de control, incluido el byte nulo.                                                                                                    |
| Tamaño                 | Un archivo mayor que `MAX_DOCUMENT_BYTES` (1 MiB por defecto) produce `DOCUMENT_TOO_LARGE` y no se interpreta.                                                                               |
| Referencias externas   | `resolve.external` y el resolver HTTP de Swagger Parser están desactivados. Una URL o un archivo vecino no se descarga ni se abre.                                                           |
| Referencias circulares | Se rechazan antes de construir el modelo.                                                                                                                                                    |
| Contenido ejecutable   | El documento se trata como datos. Una etiqueta YAML que no sea un dato hace fallar la lectura. No hay `eval` ni ejecución de fragmentos del archivo.                                         |
| Errores                | Los mensajes de dominio no incluyen la ruta absoluta ni el directorio de trabajo. Un error inesperado de una herramienta usa un texto genérico.                                              |
| Registros              | El protocolo ocupa stdout. Los avisos van a stderr y no imprimen el contenido del documento.                                                                                                 |
| Entradas MCP           | Zod valida las herramientas y los prompts antes de ejecutar el caso de uso.                                                                                                                  |

## Dependencias

`npm audit --omit=dev` no reporta avisos en las dependencias de ejecución (`@modelcontextprotocol/server`, `@apidevtools/swagger-parser` y `zod`).

El cliente MCP usado por las pruebas está en `devDependencies`. ESLint arrastra `minimatch` con un aviso moderado de amplificación de globs; `package.json` fuerza `minimatch` 11.0.4, la versión corregida, mediante `overrides`. Ese paquete solo participa en el análisis estático.

## Lo que esta versión no hace

No autentica al cliente MCP, no cifra el transporte STDIO y no oculta la documentación a quien puede lanzar el proceso. Quien configura `DOCS_DIR` decide qué especificación queda disponible.
