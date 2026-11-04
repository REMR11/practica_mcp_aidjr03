# Arquitectura

El servidor sigue una arquitectura por capas. Cada capa solo conoce a la que está debajo a través de contratos, y el dominio no importa el SDK de MCP ni el sistema de archivos.

## Capas

| Capa            | Responsabilidad                    | Dependencias permitidas              |
| --------------- | ---------------------------------- | ------------------------------------ |
| Dominio         | Entidades, invariantes y contratos | Ninguna de infraestructura ni de MCP |
| Aplicación      | Casos de uso y servicios           | Dominio                              |
| Infraestructura | Archivos locales y OpenAPI         | Dominio                              |
| Presentación    | Tools, Resources, Prompts y STDIO  | Aplicación y SDK de MCP              |

## Entidades

### `HttpMethod`

Los métodos admitidos son `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` y `TRACE`. `parseHttpMethod` normaliza mayúsculas y rechaza cualquier otro valor con `InvalidHttpMethodError`.

### `ApiEndpoint`

Representa una operación. Conserva ruta, método, etiquetas, parámetros, cuerpo de solicitud, respuestas y requisitos de seguridad declarados en OpenAPI.

Invariantes:

- La ruta empieza por `/` y no contiene espacios.
- Un parámetro `path` es obligatorio.
- Cada respuesta tiene un código `1xx`–`5xx` o `default`, una descripción y un código único dentro de la operación.
- El cuerpo de solicitud es opcional. Una operación puede no declararlo.

`ApiParameter`, `ApiRequestBody`, `ApiResponse` y `ApiSecurityRequirement` forman parte de esta entidad.

### `SchemaConstraint`

Subconjunto de JSON Schema que se conserva al interpretar un documento: tipo, formato, propiedades, ítems, enumeraciones y restricciones numéricas o de texto. Es un dato plano, sin funciones y sin referencias circulares.

### `ApiSchema`

Esquema con nombre, normalmente procedente de `components.schemas`. Incluye las propiedades, la lista `required` y el descriptor completo en `constraints`. Una propiedad marcada como obligatoria tiene que existir.

### `ApiDocumentation`

Agregado de una especificación ya interpretada: metadatos (`title`, `version`, `openapi`), servidores, etiquetas, endpoints, esquemas y seguridad global. `sourceName` identifica el archivo de origen con un nombre relativo. No guarda la ruta absoluta del disco.

## Contrato de repositorio

`DocumentationRepository` declara la carga del agregado y las consultas de endpoints y esquemas. Los casos de uso dependerán de esta interfaz. La implementación que lee archivos locales llega en una fase posterior y no forma parte del dominio.

## Errores

Todos los errores de negocio extienden `DomainError` y exponen un `code` estable:

| Código                    | Cuándo se usa                                |
| ------------------------- | -------------------------------------------- |
| `INVALID_HTTP_METHOD`     | Método desconocido                           |
| `INVALID_ENDPOINT`        | La operación incumple una invariante         |
| `INVALID_SCHEMA`          | El esquema incumple una invariante           |
| `INVALID_DOCUMENTATION`   | El documento OpenAPI no se puede interpretar |
| `DOCUMENTATION_NOT_FOUND` | No hay un documento cargado                  |
| `ENDPOINT_NOT_FOUND`      | No existe la operación pedida                |
| `SCHEMA_NOT_FOUND`        | No existe el esquema pedido                  |
| `UNAUTHORIZED_PATH`       | La ruta sale del directorio autorizado       |
| `DOCUMENT_TOO_LARGE`      | El archivo supera el tamaño máximo           |

Los mensajes describen el problema sin incluir rutas internas del servidor.

## Decisiones

El dominio no usa Zod. Zod valida entradas externas en la capa de presentación. Las invariantes del modelo se comprueban en las funciones `createApiEndpoint`, `createApiParameter`, `createApiSchema` y `parseHttpMethod`.
