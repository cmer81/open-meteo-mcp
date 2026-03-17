# Streamable HTTP Compliance — GET & DELETE /mcp

**Date:** 2026-03-17
**Issue:** [#35](https://github.com/cmer81/open-meteo-mcp/issues/35)
**Status:** Draft

## Summary

Add `GET /mcp` (SSE streaming) and `DELETE /mcp` (session termination) endpoints to fully comply with the MCP Streamable HTTP transport specification. Currently only `POST /mcp` is implemented.

## Background

The MCP Streamable HTTP spec requires three HTTP methods on `/mcp`:
- **POST** — client → server messages (already implemented)
- **GET** — server → client SSE notifications (missing)
- **DELETE** — explicit session termination (missing)

The SDK's `StreamableHTTPServerTransport.handleRequest` already handles GET, POST, and DELETE internally. The gap is purely at the Express routing layer.

## Design

### Route order in `startHttpServer()`

GET and DELETE are registered **before** `createRateLimiter()` and `createAuthMiddleware()`. The Accept-header normalisation middleware (`app.use(...)` that rewrites the `accept` header) and `express.json()` body parser are registered before all routes and still apply to GET and DELETE — this is harmless and intentional.

```
app.use(express.json())           ← applies to all routes
app.use(acceptHeaderNormalizer)   ← applies to all routes
app.get('/mcp', getHandler)       ← no rate limit, no auth
app.delete('/mcp', deleteHandler) ← no rate limit, no auth
app.use(createRateLimiter())
app.use(createAuthMiddleware())
app.post('/mcp', postHandler)     ← unchanged
```

Rationale for skipping rate limit and auth on GET/DELETE: SSE connections are long-lived and per-session; per-request rate limiting is inappropriate. Auth is also skipped since the session was already authenticated at initialization (POST).

### GET /mcp — SSE streaming

Wrapped in `try/catch`; on unexpected error return 500 JSON.

1. Read `mcp-session-id` from request headers
2. If header missing → 400 JSON error
3. Call `getSession(sessionId)`; if not found → 404 JSON error (note: `getSession()` updates `lastActivity` as a side effect)
4. Delegate to `session.transport.handleRequest(req, res)` — SDK manages the full SSE stream lifecycle

### DELETE /mcp — Session termination

Wrapped in `try/catch`; on unexpected error return 500 JSON.

1. Read `mcp-session-id` from request headers
2. If missing → 400 JSON error
3. Look up session with `this.sessionServers.get(sessionId)` (direct map access — `lastActivity` is irrelevant for a session about to be destroyed); if not found → 404 JSON error
4. `await session.transport.close()` — triggers `server.onclose` which removes the session from the map
5. After `close()` resolves, send `res.status(200).json({ message: 'Session terminated' })` — the handler is responsible for the response, not the SDK

### Logging

Same structured JSON pattern as POST:
- `http_request` event at entry (method, session_id prefix, remote_ip, user_agent)
- `session_not_found` on 404

The `session_closed` event is already fired by the existing `server.onclose` callback; no additional logging needed in the DELETE handler.

### Error handling

Both GET and DELETE handlers use the same `try/catch` pattern as POST:
```ts
try {
  // handler logic
} catch (err) {
  log('error', 'request_error', { error: errorMessage, remote_ip: remoteIp });
  res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: sanitizeErrorMessage(err) }, id: null });
}
```

### Dead code note

`req.headers['Mcp-Session-Id']` (capitalized) was already removed in a prior commit. No action needed.

## Files Changed

- `src/index.ts` — add two route handlers before middleware registration

## Out of Scope

- No changes to security middlewares
- No changes to session management logic
- No changes to stdio transport
