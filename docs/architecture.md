# Architecture

This project follows a layered architecture to keep MCP integration separate from OpenAPI processing logic.

## Layers

### Domain

- **Entities**: `ApiEndpoint`, `ApiSchema`, `ApiDocumentation`
- **Contracts**: `DocumentationRepository`
- **Errors**: `DomainError`, `NotFoundError`, `ValidationError`, `DocumentationLoadError`

The domain layer has no dependency on the MCP SDK or Node.js file APIs.

### Application

- **DocumentationService** orchestrates use cases.
- **Use cases**: `SearchDocumentation`, `ListEndpoints`, `GetEndpoint`, `GetSchema`

Use cases depend only on repository interfaces.

### Infrastructure

- **OpenApiParser** validates and normalizes OpenAPI 3.x documents (YAML/JSON).
- **FileDocumentationRepository** loads documents from an authorized local directory.

External references are not fetched over the network.

### Presentation (MCP)

- **McpServerFactory** registers tools, resources, and prompts.
- STDIO transport is used for client integration.

## Data flow

1. MCP tool/resource/prompt handler validates input (Zod).
2. Handler delegates to `DocumentationService`.
3. Service executes a use case.
4. Repository loads and caches parsed documentation.
5. Parser converts OpenAPI into domain entities.
6. JSON response is returned to the MCP client.
