# Design: Typed HTTP Error Handling via Axios Interceptor

**Date:** 2026-03-20
**Issue:** https://github.com/cmer81/open-meteo-mcp/issues/40
**Status:** Approved

## Problem

HTTP errors from the Open-Meteo API (400, 422, 429, 500) bubble up as opaque Axios errors and are caught by the generic handler in `index.ts`, which returns raw error messages like `Request failed with status code 429` to the LLM. These messages provide no actionable information.

## Goal

Translate HTTP errors from all Open-Meteo API calls into structured, human-readable messages that allow the LLM to understand what went wrong and self-correct.

## Approach

**Axios response interceptor** applied once to all 9 client instances in `OpenMeteoClient`. A single shared interceptor function is defined and registered via `setupErrorInterceptors()`, called at the end of the constructor.

This is idiomatic Axios, requires no changes outside `client.ts`, and automatically covers any future client instances added to the class.

## Error Mapping

| HTTP Status | Error Message |
|---|---|
| 400 | `Invalid request parameters: <apiMessage>` |
| 422 | `Invalid parameter value: <apiMessage>` |
| 429 | `Open-Meteo rate limit reached. Please retry later.` |
| 5xx | `Open-Meteo server error (<status>): <apiMessage>` |
| Other | Relayed as-is via `Promise.reject` |

`apiMessage` is extracted from `error.response?.data?.reason ?? error.response?.data?.error ?? error.message`, covering known Open-Meteo API response formats.

## Implementation

### Changes to `src/client.ts`

1. Add a private method `setupErrorInterceptors()` that:
   - Defines a single `errorInterceptor` function
   - Applies it to all 9 Axios instances via `for...of`
2. Call `this.setupErrorInterceptors()` at the end of the constructor

No changes to `index.ts`, `security.ts`, or any other file. The generic catch block in `index.ts` (line 191) continues to work unchanged but now receives structured error messages.

### New client instances

Any new Axios client added to `OpenMeteoClient` in the future must be added to the array inside `setupErrorInterceptors()`.

## Testing

New unit tests covering:
- HTTP 400 → `Invalid request parameters: ...`
- HTTP 422 → `Invalid parameter value: ...`
- HTTP 429 → `Open-Meteo rate limit reached. Please retry later.`
- HTTP 500 → `Open-Meteo server error (500): ...`
- Non-Axios error → relayed unchanged

Tests use Axios mock adapters or `vi.spyOn` on the client instances. Test file: `src/client.test.ts` (new file).

## Out of Scope

- Retry logic for 429 or 5xx
- Changes to `index.ts` error formatting
- Logging of HTTP error details (already handled by the generic catch in `index.ts`)
