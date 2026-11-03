# ADR 001: Layered architecture

## Context

The server must stay maintainable while integrating MCP, OpenAPI parsing, and filesystem access.

## Decision

Use four layers: Domain, Application, Infrastructure, Presentation (MCP).

## Consequences

- MCP SDK imports exist only in `src/presentation`.
- OpenAPI parsing is isolated in `src/infrastructure/parsers`.
- Use cases remain testable without starting MCP.
