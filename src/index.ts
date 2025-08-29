// Public library entrypoint: re-export client, types, constants, and logger

export { HttpClient } from './http-client.js';
export type { HttpClientConfig, HttpRequestOptions } from './http-client.js';

export {
  HTTP_METHODS,
  CONTENT_TYPES,
  HEADERS,
  ERROR_PREFIXES,
  SENSITIVE_HEADERS,
} from './constants.js';

export { defaultLogger } from './logger.js';
export type { Logger } from './logger.js';
