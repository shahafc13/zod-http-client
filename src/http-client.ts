import { z } from 'zod';
import {
  CONTENT_TYPES,
  ERROR_PREFIXES,
  HEADERS,
  HTTP_METHODS,
  SENSITIVE_HEADERS,
} from './constants.js';
import { defaultLogger, Logger } from './logger.js';

export interface HttpRequestOptions {
  method: (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface HttpClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

export class HttpClient {
  private readonly config: HttpClientConfig;
  private readonly logger: Logger;

  constructor(config: HttpClientConfig = {}, logger: Logger = defaultLogger) {
    this.config = {
      timeout: 10000,
      ...config,
    };
    this.logger = logger;
  }

  private buildUrl(endpoint: string): string {
    if (!this.config.baseUrl) return endpoint;

    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const path = endpoint.replace(/^\//, '');
    return `${baseUrl}/${path}`;
  }

  private buildHeaders(options: HttpRequestOptions): Record<string, string> {
    const headers = {
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    const needsJsonContentType =
      options.body &&
      options.method !== HTTP_METHODS.GET &&
      options.method !== HTTP_METHODS.HEAD &&
      !headers[HEADERS.CONTENT_TYPE];

    if (needsJsonContentType) {
      headers[HEADERS.CONTENT_TYPE] = CONTENT_TYPES.JSON;
    }

    return headers;
  }

  private buildRequestInit(
    options: HttpRequestOptions,
    headers: Record<string, string>
  ): RequestInit {
    const timeout = options.timeout || this.config.timeout;
    const requestInit: RequestInit = {
      method: options.method,
      headers,
      signal: timeout ? AbortSignal.timeout(timeout) : undefined,
    };

    const hasBody =
      options.body &&
      options.method !== HTTP_METHODS.GET &&
      options.method !== HTTP_METHODS.HEAD;
    if (hasBody) {
      requestInit.body =
        typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body);
    }

    return requestInit;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes(CONTENT_TYPES.JSON)) {
      return response.json();
    }

    if (contentType?.includes(CONTENT_TYPES.TEXT)) {
      return response.text();
    }

    const text = await response.text();
    return text || null;
  }

  private validateResponse<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    url: string,
    method: string
  ): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      this.logger.error(`Invalid response schema for ${method} ${url}`, {
        response: data,
        validationError: result.error.issues,
        url,
        method,
      });

      throw new Error(
        `${ERROR_PREFIXES.VALIDATION_FAILED} ${result.error.message}`
      );
    }

    return result.data;
  }

  private handleError(
    error: unknown,
    options: HttpRequestOptions,
    url: string,
    errorContext: Record<string, unknown>
  ): never {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeout = options.timeout || this.config.timeout;
        this.logger.error(`Request timeout for ${options.method} ${url}`, {
          ...errorContext,
          timeout,
          url,
          method: options.method,
        });
        throw new Error(`${ERROR_PREFIXES.TIMEOUT} ${timeout}ms`);
      }

      if (
        error.message.startsWith(ERROR_PREFIXES.REQUEST_FAILED) ||
        error.message.startsWith(ERROR_PREFIXES.VALIDATION_FAILED)
      ) {
        throw error;
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `Unexpected error during ${options.method} request to ${url}`,
      {
        ...errorContext,
        error: errorMessage,
        url,
        method: options.method,
      }
    );

    throw new Error(`${ERROR_PREFIXES.UNEXPECTED} ${errorMessage}`);
  }

  async request<T>(
    endpoint: string,
    options: HttpRequestOptions,
    schema: z.ZodSchema<T>,
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options);
    const requestInit = this.buildRequestInit(options, headers);

    try {
      this.logger.debug(`Making ${options.method} request to ${url}`, {
        ...errorContext,
        method: options.method,
        url,
        headers: this.sanitizeHeaders(headers),
      });

      const response = await fetch(url, requestInit);

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        this.logger.error(
          `Failed to make ${options.method} request to ${url}`,
          {
            ...errorContext,
            error: errorMessage,
            status: response.status,
            statusText: response.statusText,
            url,
            method: options.method,
          }
        );
        throw new Error(`${ERROR_PREFIXES.REQUEST_FAILED} ${errorMessage}`);
      }

      const responseData = await this.parseResponse(response);
      const validatedData = this.validateResponse(
        responseData,
        schema,
        url,
        options.method
      );

      this.logger.debug(
        `Successfully completed ${options.method} request to ${url}`,
        {
          ...errorContext,
          status: response.status,
          url,
          method: options.method,
        }
      );

      return validatedData;
    } catch (error) {
      this.handleError(error, options, url, errorContext);
    }
  }

  async get<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    options: Omit<HttpRequestOptions, 'method'> = {},
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    return this.request(
      endpoint,
      { ...options, method: HTTP_METHODS.GET },
      schema,
      errorContext
    );
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodSchema<T>,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {},
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    return this.request(
      endpoint,
      { ...options, method: HTTP_METHODS.POST, body },
      schema,
      errorContext
    );
  }

  async put<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodSchema<T>,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {},
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    return this.request(
      endpoint,
      { ...options, method: HTTP_METHODS.PUT, body },
      schema,
      errorContext
    );
  }

  async patch<T>(
    endpoint: string,
    body: unknown,
    schema: z.ZodSchema<T>,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {},
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    return this.request(
      endpoint,
      { ...options, method: HTTP_METHODS.PATCH, body },
      schema,
      errorContext
    );
  }

  async delete<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    options: Omit<HttpRequestOptions, 'method'> = {},
    errorContext: Record<string, unknown> = {}
  ): Promise<T> {
    return this.request(
      endpoint,
      { ...options, method: HTTP_METHODS.DELETE },
      schema,
      errorContext
    );
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  private sanitizeHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (
        (SENSITIVE_HEADERS as readonly string[]).includes(key.toLowerCase())
      ) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
