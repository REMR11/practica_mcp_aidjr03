# Casos de uso

Los casos de uso viven en `src/application` y dependen de `DocumentationRepository`. No inician el servidor MCP. `DocumentationService` es la fachada que usará la capa de presentación.

La búsqueda normaliza el texto: recorta espacios, convierte a minúsculas y trata cada palabra como un token. Todos los tokens deben aparecer en un mismo campo para que ese campo sume puntos. El orden es puntuación descendente y, en empate, el orden del documento.

## SearchDocumentation

Entrada: `query` (texto no vacío).

Salida: `SearchResult`.

```json
{
  "query": "user",
  "matches": [
    { "kind": "schema", "score": 120, "schema": { "name": "User" } },
    { "kind": "endpoint", "score": 70, "endpoint": { "method": "GET", "path": "/api/users" } }
  ]
}
```

Campos que puntúan en un endpoint: ruta, método HTTP, `operationId`, resumen, descripción y etiquetas. En un esquema: nombre, descripción y nombres de propiedades.

Una búsqueda sin coincidencias devuelve `matches: []`. Una búsqueda vacía lanza `INVALID_QUERY`.

## ListEndpoints

Entrada opcional:

```json
{ "method": "GET", "tag": "users" }
```

`method` se normaliza a mayúsculas. `tag` se compara sin distinguir mayúsculas. Sin filtros devuelve todas las operaciones. Sin coincidencias devuelve una lista vacía. Un método desconocido lanza `INVALID_HTTP_METHOD`.

## GetEndpoint

Entrada: `path` y `method`.

Salida: la operación completa, con parámetros, cuerpo si existe, respuestas y seguridad. Si no existe, `ENDPOINT_NOT_FOUND`.

## GetSchema

Entrada: `schemaName`.

Salida: el esquema con propiedades, obligatorios y restricciones. Si no existe, `SCHEMA_NOT_FOUND`. Un nombre vacío lanza `INVALID_QUERY`.
