# zod-http-client

Simple, typed HTTP client that validates responses with Zod. ESM-only, ships TypeScript types.

Installation

- npm: `npm i zod-http-client zod`
- pnpm: `pnpm add zod-http-client zod`
- yarn: `yarn add zod-http-client zod`

Requirements

- Node >=18 (global `fetch` available in Node 18+ and modern runtimes)
- Peer dependency: `zod` (>=4 <5) must be installed in your project

Quick Start

```ts
import { z } from 'zod';
import { HttpClient } from 'zod-http-client';

const client = new HttpClient({
  baseUrl: 'https://api.example.com',
  defaultHeaders: {
    Authorization: 'Bearer <token>',
  },
  timeout: 10_000,
});

// Define a Zod schema for the response
const User = z.object({
  id: z.number(),
  name: z.string(),
});

// GET example
const user = await client.get('/users/1', User);
// user is typed as { id: number; name: string }

// POST example
const CreateUserResponse = z.object({ id: z.number() });
const created = await client.post(
  '/users',
  { name: 'Ada' },
  CreateUserResponse
);
```

API

- `HttpClient(config?: HttpClientConfig, logger?: Logger)`
  - `baseUrl?: string` – optional base URL used to resolve relative endpoints
  - `defaultHeaders?: Record<string,string>` – headers merged into each request
  - `timeout?: number` – per-request default timeout in ms
- Methods validate responses with the provided Zod schema:
  - `get<T>(endpoint, schema, options?, errorContext?)`
  - `post<T>(endpoint, body, schema, options?, errorContext?)`
  - `put<T>(endpoint, body, schema, options?, errorContext?)`
  - `patch<T>(endpoint, body, schema, options?, errorContext?)`
  - `delete<T>(endpoint, schema, options?, errorContext?)`

Utilities and Types

- Constants: `HTTP_METHODS`, `CONTENT_TYPES`, `HEADERS`, `ERROR_PREFIXES`, `SENSITIVE_HEADERS`
- Types: `HttpClientConfig`, `HttpRequestOptions`, `Logger`
- Logger: `defaultLogger` (uses console). Provide your own to integrate with app logging.

Error Handling

- Network or non-2xx: throws `Error` with `Request failed: ...`
- Schema validation: throws `Error` with `Response validation failed: ...`
- Timeout: uses `AbortSignal.timeout(timeout)`

Notes

- This package is ESM-only. Use `import` syntax.
- If you need to run in environments without global `fetch`, polyfill via `undici`:

  ```ts
  import { fetch, Headers, Request, Response } from 'undici';
  // @ts-ignore
  globalThis.fetch = fetch;
  // Optional:
  // @ts-ignore
  globalThis.Headers = Headers;
  // @ts-ignore
  globalThis.Request = Request;
  // @ts-ignore
  globalThis.Response = Response;
  ```

CI

- A GitHub Actions workflow is provided at `.github/workflows/ci.yml` which runs lint, build, and tests on Node 18 and 20.
- If your default branch is not `main` or `master`, update the branches in the workflow trigger.

CD (npm publish)

- Publishing workflow at `.github/workflows/publish.yml` publishes on tags matching `v*.*.*` and supports manual dispatch.
- Set repo secret `NPM_TOKEN` (an npm access token with publish rights). The workflow uses provenance with OIDC.
- Release steps:
  - Bump `version` in `package.json`.
  - Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
  - The workflow runs lint/build/test and then publishes to npm.

Troubleshooting

- Missing `fetch` in Node: ensure you are on Node >=18 or add the `undici` polyfill shown above.
- Zod not found: install the peer dependency with `npm i zod` (requires `>=4 <5`).
- ESM import errors: confirm your project uses ESM (`"type": "module"`) or configure your bundler accordingly.

License
MIT
