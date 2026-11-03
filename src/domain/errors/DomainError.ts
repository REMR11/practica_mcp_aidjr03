export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class InvalidHttpMethodError extends DomainError {
  constructor(method: string) {
    super('INVALID_HTTP_METHOD', `Método HTTP no soportado: ${method}`);
  }
}

export class InvalidEndpointError extends DomainError {
  constructor(message: string) {
    super('INVALID_ENDPOINT', message);
  }
}

export class InvalidSchemaError extends DomainError {
  constructor(message: string) {
    super('INVALID_SCHEMA', message);
  }
}

export class InvalidDocumentationError extends DomainError {
  constructor(message: string) {
    super('INVALID_DOCUMENTATION', message);
  }
}

export class DocumentationNotFoundError extends DomainError {
  constructor(message = 'No hay documentación cargada.') {
    super('DOCUMENTATION_NOT_FOUND', message);
  }
}

export class EndpointNotFoundError extends DomainError {
  constructor(path: string, method: string) {
    super('ENDPOINT_NOT_FOUND', `No existe el endpoint ${method} ${path}.`);
  }
}

export class SchemaNotFoundError extends DomainError {
  constructor(schemaName: string) {
    super('SCHEMA_NOT_FOUND', `No existe el esquema "${schemaName}".`);
  }
}

export class UnauthorizedPathError extends DomainError {
  constructor() {
    super('UNAUTHORIZED_PATH', 'La ruta solicitada queda fuera del directorio autorizado.');
  }
}
