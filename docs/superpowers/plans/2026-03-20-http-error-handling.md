# HTTP Error Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed HTTP error handling to `OpenMeteoClient` so that 400, 422, 429, and 5xx errors from Open-Meteo APIs produce structured, actionable messages instead of raw Axios error strings.

**Architecture:** A single `errorInterceptor` function is defined in a private `setupErrorInterceptors()` method on `OpenMeteoClient` and registered on all 9 Axios instances. The interceptor maps HTTP status codes to human-readable error messages. No changes outside `src/client.ts`.

**Tech Stack:** TypeScript, Axios 1.x (`axios.isAxiosError()`), Vitest 4.x

---

## File Map

- **Modify:** `src/client.ts` — add `setupErrorInterceptors()` private method, call it in the constructor
- **Create:** `src/client.test.ts` — unit tests for the interceptor behavior

---

### Task 1: Write failing tests for the error interceptor

**Files:**
- Create: `src/client.test.ts`

- [ ] **Step 1: Create `src/client.test.ts` with failing tests**

```typescript
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenMeteoClient } from './client.js';

describe('OpenMeteoClient error interceptor', () => {
  let client: OpenMeteoClient;

  beforeEach(() => {
    client = new OpenMeteoClient();
  });

  it('throws structured message on HTTP 400', async () => {
    const axiosError = Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { reason: 'Invalid latitude' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getForecast({ latitude: 999, longitude: 0 }),
    ).rejects.toThrow('Invalid request parameters: Invalid latitude');
  });

  it('throws structured message on HTTP 422', async () => {
    const axiosError = Object.assign(new Error('Unprocessable Entity'), {
      isAxiosError: true,
      response: { status: 422, data: { error: 'Cannot initialize model for given coordinates' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getForecast({ latitude: 0, longitude: 0 }),
    ).rejects.toThrow('Invalid parameter value: Cannot initialize model for given coordinates');
  });

  it('throws structured message on HTTP 429', async () => {
    const axiosError = Object.assign(new Error('Too Many Requests'), {
      isAxiosError: true,
      response: { status: 429, data: {} },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getForecast({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Open-Meteo rate limit reached. Please retry later.');
  });

  it('throws structured message on HTTP 500', async () => {
    const axiosError = Object.assign(new Error('Internal Server Error'), {
      isAxiosError: true,
      response: { status: 500, data: { reason: 'Upstream failure' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getForecast({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Open-Meteo server error (500): Upstream failure');
  });

  it('relays non-Axios errors unchanged', async () => {
    const networkError = new Error('Network timeout');
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(networkError);

    await expect(
      client.getForecast({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network timeout');
  });

  it('applies to archiveClient (HTTP 400)', async () => {
    const axiosError = Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { reason: 'Invalid date range' } },
    });
    vi.spyOn(
      (client as unknown as { archiveClient: { get: unknown } }).archiveClient,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getArchive({ latitude: 48.8566, longitude: 2.3522, start_date: 'bad', end_date: 'bad' }),
    ).rejects.toThrow('Invalid request parameters: Invalid date range');
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm test -- src/client.test.ts
```

Expected: All 6 tests FAIL (interceptor does not exist yet).

---

### Task 2: Implement the error interceptor

**Files:**
- Modify: `src/client.ts:30-67` (constructor and class body)

- [ ] **Step 3: Add `setupErrorInterceptors()` and call it in the constructor**

In `src/client.ts`, after line 66 (`this.climateClient = axios.create(...)`), add a call to the new method, and add the method itself inside the class:

```typescript
// At the end of the constructor, after all this.xxxClient = axios.create(...) lines:
this.setupErrorInterceptors();
```

```typescript
// New private method to add inside the class, after the constructor:
private setupErrorInterceptors(): void {
  const errorInterceptor = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as Record<string, unknown> | undefined;
      const apiMessage =
        (data?.reason as string | undefined) ??
        (data?.error as string | undefined) ??
        error.message;

      if (status === 400) throw new Error(`Invalid request parameters: ${apiMessage}`);
      if (status === 422) throw new Error(`Invalid parameter value: ${apiMessage}`);
      if (status === 429) throw new Error('Open-Meteo rate limit reached. Please retry later.');
      if (status !== undefined && status >= 500)
        throw new Error(`Open-Meteo server error (${status}): ${apiMessage}`);
    }
    return Promise.reject(error);
  };

  for (const instance of [
    this.client,
    this.airQualityClient,
    this.marineClient,
    this.archiveClient,
    this.seasonalClient,
    this.ensembleClient,
    this.geocodingClient,
    this.floodClient,
    this.climateClient,
  ]) {
    instance.interceptors.response.use(undefined, errorInterceptor);
  }
}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
npm test -- src/client.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Run the full test suite to verify no regressions**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Type-check**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/client.ts src/client.test.ts
git commit -m "fix: map Axios HTTP errors to typed MCP error responses (#40)"
```

---

## Verification

After all tasks are complete:

1. `npm test` — all tests pass including the 6 new ones in `src/client.test.ts`
2. `npm run typecheck` — no TypeScript errors
3. `npm run lint` — no lint errors
