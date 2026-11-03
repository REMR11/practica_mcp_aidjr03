# Security

## File access

- OpenAPI files must reside inside `DOCUMENTATION_DIR`.
- Relative paths that escape the authorized root (path traversal) are rejected.

## Network

- External OpenAPI references are not fetched automatically (`resolve.external = false`).

## Document limits

- Files larger than `MAX_DOCUMENT_BYTES` are rejected before parsing.

## Error handling

- Domain errors returned through MCP tools do not include internal filesystem paths beyond the configured file name.
- Startup failures log to stderr to avoid polluting MCP STDIO transport.

## Input validation

- Tool and prompt arguments are validated with Zod before executing use cases.
