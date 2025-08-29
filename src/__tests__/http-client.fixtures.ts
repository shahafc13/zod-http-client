import { z } from 'zod';

/**
 * Test fixtures for HTTP client tests
 */

// Mock AbortSignal
export const mockAbortSignal = {
  aborted: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onabort: jest.fn(),
  reason: null,
  throwIfAborted: jest.fn(),
  dispatchEvent: jest.fn(),
};

// Test schemas
export const testSchemas = {
  basicObject: z.object({
    id: z.string(),
    name: z.string(),
  }),
  successResponse: z.object({ success: z.boolean() }),
  stringResponse: z.string(),
  nullResponse: z.null(),
  userResponse: z.object({
    test: z.string(),
  }),
  idResponse: z.object({
    id: z.string(),
  }),
};

// Test data
export const testData = {
  basicResponse: { id: '1', name: 'Test' },
  successResponse: { success: true },
  stringResponse: 'Hello World',
  userResponse: { test: 'value' },
  idResponse: { id: '1' },
  invalidResponse: { id: 123, name: 'Test' }, // id should be string
  emptyResponse: null,
};

// Request bodies
export const requestBodies = {
  basicPost: { name: 'New Test' },
  stringBody: '{"name":"Test"}',
  updateBody: { name: 'Updated Test' },
  patchBody: { name: 'Patched Test' },
  ignoredBody: { should: 'be ignored' },
};

// HTTP client configurations
export const clientConfigs = {
  default: {},
  withBaseUrl: {
    baseUrl: 'https://api.example.com',
  },
  withBaseUrlSlash: {
    baseUrl: 'https://api.example.com/',
  },
  withHeaders: {
    defaultHeaders: { 'X-Default': 'default-value' },
  },
  withAuth: {
    defaultHeaders: { Authorization: 'Bearer default' },
  },
  withApiKey: {
    baseUrl: 'https://api.example.com',
    defaultHeaders: { 'X-API-Key': 'test' },
    timeout: 5000,
  },
  withTimeout: {
    timeout: 5000,
  },
};

// Request headers
export const requestHeaders = {
  json: { 'Content-Type': 'application/json' },
  custom: { 'X-Custom': 'custom-value' },
  authOverride: { Authorization: 'Bearer custom' },
  apiTest: { 'X-Custom': 'value' },
  sensitive: {
    Authorization: 'Bearer secret-token',
    'X-API-Key': 'secret-key',
    Cookie: 'session=secret',
    'X-Auth-Token': 'auth-token',
    'X-Custom': 'safe-value',
  },
};

// Sanitized headers (for logging tests)
export const sanitizedHeaders = {
  Authorization: '***REDACTED***',
  'X-API-Key': '***REDACTED***',
  Cookie: '***REDACTED***',
  'X-Auth-Token': '***REDACTED***',
  'X-Custom': 'safe-value',
};

// Error contexts
export const errorContexts = {
  basic: { testContext: 'value' },
  user: { userId: '123' },
  empty: {},
};

// Error messages
export const errorMessages = {
  notFound: 'Request failed: HTTP 404: Not Found',
  validationFailed: 'Response validation failed',
  timeout: 'Request timeout after 10000ms',
  network: 'Unexpected request error: Network error',
  custom: 'Request failed: Custom error',
  stringError: 'Unexpected request error: String error',
};

// Mock response factory
export const createMockResponse = (
  options: {
    status?: number;
    statusText?: string;
    contentType?: string;
    data?: unknown;
    ok?: boolean;
  } = {}
) => {
  const {
    status = 200,
    statusText = 'OK',
    contentType = 'application/json',
    data = testData.basicResponse,
    ok = true,
  } = options;

  return {
    ok,
    status,
    statusText,
    headers: {
      get: jest.fn().mockReturnValue(contentType),
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest
      .fn()
      .mockResolvedValue(
        typeof data === 'string' ? data : JSON.stringify(data)
      ),
  };
};

// Error response factory
export const createErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
});

// Error factory
export const createError = (name: string, message: string) => {
  const error = new Error(message);
  error.name = name;
  return error;
};

// Test timeouts
export const timeouts = {
  default: 10000,
  custom: 15000,
};

// URL patterns
export const urls = {
  test: '/test',
  empty: '',
  withBaseUrl: 'https://api.example.com/test',
};

// HTTP methods
export const httpMethods = {
  GET: 'GET' as const,
  POST: 'POST' as const,
  PUT: 'PUT' as const,
  PATCH: 'PATCH' as const,
  DELETE: 'DELETE' as const,
  HEAD: 'HEAD' as const,
  OPTIONS: 'OPTIONS' as const,
};
