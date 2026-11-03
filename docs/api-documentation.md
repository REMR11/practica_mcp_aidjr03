# OpenAPI interpretation

The server uses `@apidevtools/swagger-parser` to validate and dereference OpenAPI 3.x documents.

## Supported inputs

- JSON OpenAPI files
- YAML OpenAPI files

## Processing steps

1. Read file content from the authorized documentation directory.
2. Parse JSON or YAML into an in-memory object.
3. Validate the specification (without resolving external references).
4. Dereference internal `$ref` pointers where possible.
5. Extract:
   - API overview (`info`, tags, counts)
   - Endpoints (method, path, parameters, request body, responses, security)
   - Component schemas (properties, constraints, resolved schema object)

## Limitations

- External `$ref` targets are not downloaded.
- Documents larger than `MAX_DOCUMENT_BYTES` are rejected.
- Invalid specifications produce `DocumentationLoadError`.
