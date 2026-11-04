# Interpretación de OpenAPI

El parser vive en `src/infrastructure/parsers` y usa `@apidevtools/swagger-parser` 13. Acepta OpenAPI 3.0.0–3.0.4 y 3.1.0–3.1.2, en YAML o JSON. Swagger 2.0 se rechaza.

## Proceso

1. `SwaggerParser.validate` lee el archivo, resuelve las referencias internas y valida el documento contra el esquema de OpenAPI.
2. Las opciones desactivan `resolve.external` y el resolver `http`. No se descargan URLs ni se abren otros archivos.
3. Las referencias circulares se rechazan.
4. El resultado se proyecta al modelo de dominio: metadatos, servidores, etiquetas, endpoints, parámetros, cuerpos, respuestas, seguridad y esquemas.
5. Si queda algún `$ref` —porque apuntaba fuera del documento o no pudo resolverse— la proyección lanza `InvalidDocumentationError`.

El contenido del documento se trata como datos. No se evalúa código contenido en YAML o JSON.

## Qué se conserva

- Ruta, método, `operationId`, resumen, descripción, etiquetas y `deprecated`.
- Parámetros de ruta, consulta, cabecera y cookie. Los parámetros de la operación sustituyen a los de la ruta cuando coinciden en nombre y ubicación.
- Cuerpo de solicitud solo si la operación lo declara. Su ausencia es válida.
- Respuestas, con su código, descripción y contenido.
- Esquemas de `components.schemas`, con tipo, propiedades, `required` y restricciones (`format`, `minimum`, `minLength`, `enum`, `pattern`, etc.).
- Seguridad de la operación. Si la operación no declara `security`, se aplica la seguridad global. Una lista vacía deja la operación sin requisitos.

## Errores

Los fallos de lectura, de esquema o de referencias se convierten en `InvalidDocumentationError`. El mensaje sustituye la ruta del archivo por la palabra «documento» y no incluye el directorio de trabajo.

## Documentos de ejemplo

- `examples/openapi.yaml` es la especificación de demostración.
- `tests/fixtures/` contiene documentos válidos e inválidos usados por las pruebas.
