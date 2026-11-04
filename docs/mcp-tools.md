# Herramientas MCP

Las herramientas delegan en `DocumentationService`. No reinterpretan OpenAPI. Una entrada que no cumple el esquema Zod se rechaza antes de ejecutar el caso de uso. Un error de dominio vuelve como resultado con `isError: true` y un mensaje sin rutas internas.

Todas son de solo lectura.

## search_documentation

Busca en rutas, métodos, descripciones, etiquetas y esquemas.

```json
{ "query": "authentication" }
```

Respuesta:

```json
{
  "query": "authentication",
  "matches": []
}
```

Con el ejemplo, `autenticación` devuelve `POST /api/auth/login`. Una búsqueda sin coincidencias devuelve `matches` vacío. Un `query` vacío se rechaza.

## list_endpoints

```json
{ "method": "GET", "tag": "users" }
```

Los dos campos son opcionales. `method` se normaliza a mayúsculas. Sin coincidencias la lista está vacía. `FETCH` se rechaza.

## get_endpoint

```json
{ "path": "/api/users", "method": "POST" }
```

Devuelve método, ruta, descripción, parámetros, cuerpo de solicitud si existe, respuestas, esquemas ya resueltos dentro de esos campos y la seguridad declarada. Si la operación no existe, el resultado es un error con el mensaje `No existe el endpoint GET /api/missing.`

## get_schema

```json
{ "schemaName": "User" }
```

Devuelve nombre, propiedades, tipos y restricciones (`format`, `minLength`, `enum`, etc.). El nombre tiene que existir en `components.schemas`.
