# Recursos MCP

Los recursos leen el agregado que ya interpretó el repositorio. No vuelven a analizar OpenAPI.

| URI                             | MIME               | Contenido                                                                |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `api://documentation/overview`  | `application/json` | Título, versión, descripción, servidores, etiquetas, seguridad y conteos |
| `api://documentation/endpoints` | `application/json` | Operaciones con parámetros, cuerpos, respuestas y seguridad              |
| `api://documentation/schemas`   | `application/json` | Esquemas con propiedades y restricciones                                 |

`sourceName` es el nombre relativo del archivo. El contenido no incluye la ruta absoluta.

Si el repositorio no puede leer la documentación, el recurso falla con el mensaje de dominio. Por ejemplo: `No hay documentación cargada.`

La primera lectura deja el documento en memoria. Las lecturas siguientes de ese proceso reutilizan esa copia.
