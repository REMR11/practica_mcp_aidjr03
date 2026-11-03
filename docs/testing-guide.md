# Testing guide

## Unit tests

Located under `tests/unit/`:

- Domain types
- OpenAPI parser (JSON/YAML fixtures)
- File repository path validation
- Application use cases

Run:

```bash
npm test
```

## Fixtures

- `examples/openapi.yaml` — primary sample API
- `tests/fixtures/minimal-openapi.json` — minimal JSON document

## Negative scenarios

- Invalid OpenAPI content
- Missing endpoints/schemas
- Path traversal attempts outside the authorized directory
