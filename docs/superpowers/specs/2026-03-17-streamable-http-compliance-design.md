# Streamable HTTP Compliance — GET & DELETE /mcp

**Date:** 2026-03-17
**Issue:** [#35](https://github.com/cmer81/open-meteo-mcp/issues/35)
**Status:** Approved

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

GET and DELETE are registered **before** the rate limiter and auth middlewares. POST keeps its existing middlewares unchanged.

```
app.get('/mcp', getHandler)      ← no rate limit, no auth
app.delete('/mcp', deleteHandler) ← no rate limit, no auth
app.use(createRateLimiter())
app.use(createAuthMiddleware())
app.post('/mcp', postHandler)    ← unchanged
```

Rationale: SSE connections are long-lived and per-session; applying per-request rate limiting is inappropriate. Auth is also skipped since the session was already authenticated at initialization (POST).

### GET /mcp — SSE streaming

1. Read `mcp-session-id` from request headers
2. If missing or session unknown → 404 JSON error
3. Update `lastActivity` on the session
4. Delegate to `session.transport.handleRequest(req, res)` — SDK handles SSE stream lifecycle

### DELETE /mcp — Session termination

1. Read `mcp-session-id` from request headers
2. If missing → 400 JSON error
3. If session unknown → 404 JSON error
4. Call `session.transport.close()` — triggers `server.onclose` which removes the session from the map
5. Respond 200 `{ message: 'Session terminated' }`

### Logging

Same structured JSON pattern as POST:
- `http_request` event at entry (method, session_id prefix, remote_ip, user_agent)
- `session_not_found` on 404
- `session_closed` on successful DELETE (already fired by `server.onclose`)

### Dead code note

`req.headers['Mcp-Session-Id']` (capitalized) was already removed in a prior commit. No action needed.

## Files Changed

- `src/index.ts` — add two route handlers before middleware registration

## Out of Scope

- No changes to security middlewares
- No changes to session management logic
- No changes to stdio transport
