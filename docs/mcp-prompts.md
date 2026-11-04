# Prompts MCP

Las plantillas incluyen la documentación ya cargada y piden al modelo que no agregue nada que no esté en ese JSON.

## explain_api

No recibe argumentos. Explica la estructura general, las funcionalidades y los recursos principales.

```json
{ "name": "explain_api" }
```

El mensaje contiene el agregado completo: metadatos, operaciones y esquemas.

## review_endpoint

```json
{ "path": "/api/users", "method": "GET" }
```

El mensaje contiene solo esa operación. La revisión tiene que señalar qué está documentado. Un argumento ausente se rechaza. Una operación que no existe produce el error `No existe el endpoint GET /api/missing.`

## generate_api_examples

Usa los mismos argumentos. El mensaje incluye parámetros, cuerpo y respuestas. Si la operación no declara cuerpo, el JSON trae `requestBody: null` y la instrucción prohíbe inventarlo. Los ejemplos deben respetar `enum`, `format`, `required` y el resto de restricciones, y presentarse como ilustrativos.
