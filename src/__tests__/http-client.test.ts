import { HttpClient } from '@/http-client.js';

import {
  clientConfigs,
  createError,
  createErrorResponse,
  createMockResponse,
  errorContexts,
  errorMessages,
  httpMethods,
  mockAbortSignal,
  requestBodies,
  requestHeaders,
  sanitizedHeaders,
  testData,
  testSchemas,
  timeouts,
  urls,
} from './http-client.fixtures.js';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.spyOn(AbortSignal, 'timeout').mockReturnValue(mockAbortSignal);

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const defaultClient = new HttpClient();
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom config', () => {
      const customClient = new HttpClient(clientConfigs.withApiKey);
      expect(customClient).toBeDefined();
      expect(customClient['config'].baseUrl).toBe(
        clientConfigs.withApiKey.baseUrl
      );
      expect(customClient['config'].defaultHeaders).toEqual(
        clientConfigs.withApiKey.defaultHeaders
      );
      expect(customClient['config'].timeout).toBe(
        clientConfigs.withApiKey.timeout
      );
    });
  });

  describe('request method', () => {
    const testSchema = testSchemas.basicObject;
    const mockData = testData.basicResponse;

    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse());
    });

    it('should make successful GET request', async () => {
      const result = await client.request(
        urls.test,
        { method: httpMethods.GET },
        testSchema,
        errorContexts.basic
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should make successful POST request with body', async () => {
      const result = await client.request(
        urls.test,
        { method: httpMethods.POST, body: requestBodies.basicPost },
        testSchema,
        errorContexts.basic
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.POST,
          headers: requestHeaders.json,
          body: JSON.stringify(requestBodies.basicPost),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle baseUrl configuration', async () => {
      const clientWithBaseUrl = new HttpClient(clientConfigs.withBaseUrl);

      await clientWithBaseUrl.request(
        urls.test,
        { method: httpMethods.GET },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `${urls.withBaseUrl}`,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
    });

    it('should handle baseUrl with trailing slash', async () => {
      const clientWithBaseUrl = new HttpClient(clientConfigs.withBaseUrlSlash);

      await clientWithBaseUrl.request(
        urls.test,
        { method: httpMethods.GET },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `${urls.withBaseUrl}`,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
    });

    it('should merge default headers with request headers', async () => {
      const clientWithHeaders = new HttpClient(clientConfigs.withHeaders);

      await clientWithHeaders.request(
        urls.test,
        {
          method: httpMethods.GET,
          headers: requestHeaders.custom,
        },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {
            ...clientConfigs.withHeaders.defaultHeaders,
            ...requestHeaders.custom,
          },
        })
      );
    });

    it('should override default headers with request headers', async () => {
      const clientWithHeaders = new HttpClient(clientConfigs.withAuth);

      await clientWithHeaders.request(
        urls.test,
        {
          method: httpMethods.GET,
          headers: requestHeaders.authOverride,
        },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: requestHeaders.authOverride,
        })
      );
    });

    it('should handle string body for POST request', async () => {
      await client.request(
        urls.test,
        {
          method: httpMethods.POST,
          body: requestBodies.stringBody,
          headers: requestHeaders.json,
        },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.POST,
          headers: requestHeaders.json,
          body: requestBodies.stringBody,
        })
      );
    });

    it('should not add body for GET requests', async () => {
      await client.request(
        urls.test,
        { method: httpMethods.GET, body: requestBodies.ignoredBody },
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
    });

    it('should use custom timeout', async () => {
      const customSignal = { ...mockAbortSignal };
      const timeoutSpy = jest
        .spyOn(AbortSignal, 'timeout')
        .mockReturnValue(customSignal);

      await client.request(
        urls.test,
        { method: httpMethods.GET, timeout: timeouts.custom },
        testSchema
      );

      expect(timeoutSpy).toHaveBeenCalledWith(timeouts.custom);
    });
  });

  describe('response handling', () => {
    const testSchema = testSchemas.basicObject;

    it('should handle JSON response', async () => {
      const mockResponse = createMockResponse({
        contentType: 'application/json',
        data: testData.basicResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request(
        urls.test,
        { method: httpMethods.GET },
        testSchema
      );

      expect(mockResponse.json).toHaveBeenCalled();
      expect(result).toEqual(testData.basicResponse);
    });

    it('should handle text response', async () => {
      const mockResponse = createMockResponse({
        contentType: 'text/plain',
        data: testData.stringResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request(
        urls.test,
        { method: httpMethods.GET },
        testSchemas.stringResponse
      );

      expect(mockResponse.text).toHaveBeenCalled();
      expect(result).toEqual(testData.stringResponse);
    });

    it('should handle empty response', async () => {
      const mockResponse = createMockResponse({
        status: 204,
        contentType: undefined,
        data: testData.emptyResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request(
        urls.test,
        { method: httpMethods.DELETE },
        testSchemas.nullResponse
      );

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    const testSchema = testSchemas.basicObject;

    it('should throw error for HTTP error status', async () => {
      const mockResponse = createErrorResponse(404, 'Not Found');
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.notFound);
    });

    it('should throw error for validation failure', async () => {
      const mockResponse = createMockResponse({
        contentType: 'application/json',
        data: testData.invalidResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.validationFailed);
    });

    it('should handle timeout error', async () => {
      const timeoutError = createError('AbortError', 'Timeout');
      mockFetch.mockRejectedValue(timeoutError);

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.timeout);
    });

    it('should handle network error', async () => {
      const networkError = createError('Error', 'Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.network);
    });

    it('should re-throw custom errors', async () => {
      const customError = createError('Error', 'Request failed: Custom error');
      mockFetch.mockRejectedValue(customError);

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.custom);
    });
  });

  describe('convenience methods', () => {
    const testSchema = testSchemas.basicObject;
    const mockData = testData.basicResponse;

    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse());
    });

    it('should handle GET convenience method', async () => {
      const result = await client.get(urls.test, testSchema);

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle GET with options and context', async () => {
      const result = await client.get(
        urls.test,
        testSchema,
        { headers: requestHeaders.custom },
        errorContexts.user
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.GET,
          headers: requestHeaders.custom,
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle POST convenience method', async () => {
      const result = await client.post(
        urls.test,
        requestBodies.basicPost,
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.POST,
          headers: requestHeaders.json,
          body: JSON.stringify(requestBodies.basicPost),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle PUT convenience method', async () => {
      const result = await client.put(
        urls.test,
        requestBodies.updateBody,
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.PUT,
          headers: requestHeaders.json,
          body: JSON.stringify(requestBodies.updateBody),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle PATCH convenience method', async () => {
      const result = await client.patch(
        urls.test,
        requestBodies.patchBody,
        testSchema
      );

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.PATCH,
          headers: requestHeaders.json,
          body: JSON.stringify(requestBodies.patchBody),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle DELETE convenience method', async () => {
      const result = await client.delete(urls.test, testSchema);

      expect(mockFetch).toHaveBeenCalledWith(
        urls.test,
        expect.objectContaining({
          method: httpMethods.DELETE,
          headers: {},
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('header sanitization', () => {
    const testSchema = testSchemas.successResponse;

    beforeEach(() => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          data: testData.successResponse,
        })
      );
    });

    it('should sanitize sensitive headers in logs', async () => {
      const loggerSpy = jest.spyOn(client['logger'], 'debug');

      await client.request(
        urls.test,
        {
          method: httpMethods.GET,
          headers: {
            ...requestHeaders.sensitive,
          },
        },
        testSchema
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Making GET request'),
        expect.objectContaining({
          headers: sanitizedHeaders,
        })
      );

      loggerSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    const testSchema = testSchemas.idResponse;

    it('should handle undefined context gracefully', async () => {
      const mockResponse = createMockResponse({
        data: testData.idResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.request(
        urls.test,
        { method: httpMethods.GET },
        testSchema
      );

      expect(result).toEqual(testData.idResponse);
    });

    it('should handle empty endpoint string', async () => {
      const mockResponse = createMockResponse({
        data: testData.idResponse,
      });
      mockFetch.mockResolvedValue(mockResponse);

      await client.request('', { method: httpMethods.GET }, testSchema);

      expect(mockFetch).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          method: httpMethods.GET,
          headers: {},
        })
      );
    });

    it('should handle non-Error thrown objects', async () => {
      mockFetch.mockRejectedValue('String error');

      await expect(
        client.request(urls.test, { method: httpMethods.GET }, testSchema)
      ).rejects.toThrow(errorMessages.stringError);
    });
  });
});
