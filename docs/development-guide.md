# Development guide

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
npm run build
npm test
```

## Quality checks

```bash
npm run lint
npm run format:check
```

## Local MCP execution

```bash
npm run build
npm start
```

Configure `DOCUMENTATION_DIR` and `OPENAPI_FILE` to point to your OpenAPI file.

## MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Ensure logs are written to stderr only (the server uses STDIO for MCP messages).
