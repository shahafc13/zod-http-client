export const HTTP_METHODS = {
  GET: 'GET',
  HEAD: 'HEAD',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  TEXT: 'text/',
} as const;

export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
} as const;

export const ERROR_PREFIXES = {
  REQUEST_FAILED: 'Request failed:',
  VALIDATION_FAILED: 'Response validation failed:',
  TIMEOUT: 'Request timeout after',
  UNEXPECTED: 'Unexpected request error:',
} as const;

export const SENSITIVE_HEADERS = [
  'authorization',
  'x-api-key',
  'cookie',
  'x-auth-token',
  'proxy-authorization',
  'x-amz-security-token',
  'set-cookie',
  'authentication-info',
] as const;
