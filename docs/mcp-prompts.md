# MCP Prompts

## explain_api

Builds a prompt that explains the API using overview metadata and a sample of documented endpoints.

## review_endpoint

Arguments:

- `path`
- `method`

Produces a design review prompt grounded in the documented endpoint fields.

## generate_api_examples

Arguments:

- `path`
- `method`

Produces a prompt to generate request/response examples using documented schemas only.
