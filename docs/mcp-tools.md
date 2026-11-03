# MCP Tools

## search_documentation

Search endpoints by path, HTTP method, summary, description, tags, or operationId.

```json
{ "query": "authentication" }
```

## list_endpoints

List endpoints with optional filters.

```json
{ "method": "GET", "tag": "users" }
```

## get_endpoint

Return detailed endpoint documentation.

```json
{ "path": "/api/users", "method": "POST" }
```

## get_schema

Return a component schema by name.

```json
{ "schemaName": "User" }
```
