export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export function normalizeHttpMethod(method: string): HttpMethod {
  const upper = method.toUpperCase();
  if (!(HTTP_METHODS as readonly string[]).includes(upper)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }
  return upper as HttpMethod;
}
