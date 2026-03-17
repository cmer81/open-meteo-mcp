# Streamable HTTP Compliance — GET & DELETE /mcp — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /mcp` (SSE streaming) and `DELETE /mcp` (session termination) endpoints to fully comply with the MCP Streamable HTTP transport spec.

**Architecture:** Register GET and DELETE routes *before* the rate-limiter and auth middlewares in the Express app. The SDK's `StreamableHTTPServerTransport.handleRequest` already handles GET natively; DELETE manually awaits `transport.close()` then responds 200. The Express app setup is extracted from `startHttpServer()` into a private `buildExpressApp()` to enable unit testing without starting a real server.

**Tech Stack:** Express, `@modelcontextprotocol/sdk` (StreamableHTTPServerTransport), Vitest, supertest

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/index.ts` | Modify | Guard top-level bootstrap, export class, extract `buildExpressApp()`, add GET/DELETE routes |
| `src/index.test.ts` | Modify | Add HTTP route tests for GET /mcp and DELETE /mcp |
| `package.json` | Modify | Add `supertest` and `@types/supertest` as devDependencies |

---

## Task 1: Add supertest dev dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install supertest**

```bash
npm install --save-dev supertest @types/supertest
```

Expected: `package.json` devDependencies now includes `supertest` and `@types/supertest`.

- [ ] **Step 2: Verify supertest import works (ESM interop check)**

Create a quick one-liner smoke test in the terminal to confirm Vitest can import supertest. Since `"type": "module"` is set and supertest is CJS, use the default import form — Vitest's Vite pipeline applies the interop shim automatically. If this causes issues, fall back to `createRequire`.

```bash
node --input-type=module <<'EOF'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const st = require('supertest');
console.log(typeof st); // should print 'function'
EOF
```

Expected: prints `function`.

- [ ] **Step 3: Verify existing tests still pass**

```bash
npm test
```

Expected: all existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supertest devDependency for HTTP route testing"
```

---

## Task 2: Prepare `index.ts` for testability

Two changes needed before writing tests:
1. Guard the top-level bootstrap so importing `OpenMeteoMCPServer` in tests does not start a real server.
2. Export the class so tests can import it.
3. Refactor `run()` to extract `buildExpressApp()`.

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Guard top-level bootstrap against test imports**

Find the bottom of `src/index.ts`:

```typescript
const server = new OpenMeteoMCPServer();
server.run().catch((err) => {
  log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
```

Replace it with:

```typescript
if (process.env.NODE_ENV !== 'test') {
  const server = new OpenMeteoMCPServer();
  server.run().catch((err) => {
    log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}
```

- [ ] **Step 2: Export `OpenMeteoMCPServer`**

Change:
```typescript
class OpenMeteoMCPServer {
```
To:
```typescript
export class OpenMeteoMCPServer {
```

- [ ] **Step 3: Extract `buildExpressApp()` and update `run()`**

Inside `class OpenMeteoMCPServer`, extract all Express setup (currently inline in the `if (transport === 'http')` branch of `run()`) into a new private method, and add a private `startHttpTransport()` that calls it.

The structure should be:

```typescript
// New private method — returns a configured Express app without starting a listener
private buildExpressApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Accept-header normalisation middleware (keep existing code unchanged)
  app.use((req, _res, next) => {
    // ... existing normalisation code ...
  });

  // GET /mcp — SSE streaming (no rate limit, no auth) — stub for now, implemented in Task 3
  app.get('/mcp', async (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  // DELETE /mcp — session termination (no rate limit, no auth) — stub, implemented in Task 4
  app.delete('/mcp', async (_req, res) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  app.use(createRateLimiter());
  app.use(createAuthMiddleware());

  // POST /mcp — existing handler, copy verbatim from current run()
  app.post('/mcp', async (req, res) => {
    // ... existing POST handler code unchanged ...
  });

  return app;
}

// New private method — creates the app and starts listening
private startHttpTransport(): void {
  const app = this.buildExpressApp();
  const port = parseInt(process.env.PORT || '3000', 10);
  app
    .listen(port, () => {
      log('info', 'server_start', { transport: 'http', port });
    })
    .on('error', (err) => {
      log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
      process.exit(1);
    });
}
```

Update `run()` so the HTTP branch becomes:

```typescript
async run(): Promise<void> {
  const transport = process.env.TRANSPORT || 'stdio';

  if (transport === 'http') {
    this.startCleanupTimer();
    this.startHttpTransport();  // ← replaces all the inline Express setup
  } else {
    // stdio branch unchanged
    const server = this.createServer();
    const stdioTransport = new StdioServerTransport();
    server.oninitialized = () => {
      log('info', 'session_initialized', { transport: 'stdio' });
    };
    await server.connect(stdioTransport as Transport);
    log('info', 'server_start', { transport: 'stdio' });
  }
}
```

- [ ] **Step 4: Verify build and tests pass**

```bash
npm run typecheck && npm test
```

Expected: TypeScript compiles without errors, all existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "refactor: extract buildExpressApp() for testability, guard bootstrap in test env"
```

---

## Task 3: GET /mcp — SSE streaming (TDD)

**Files:**
- Modify: `src/index.test.ts`
- Modify: `src/index.ts`

### Step 3a — Write failing tests

- [ ] **Step 1: Add GET /mcp tests to `src/index.test.ts`**

Add to the imports at the top of `src/index.test.ts`:

```typescript
import supertest from 'supertest';
import express from 'express';
import { vi, beforeEach } from 'vitest';
import { OpenMeteoMCPServer } from './index.js';
```

> **Note:** `vi` must be explicitly imported even though `globals: true` is set in `vitest.config.ts`, because `tsc` may not recognise the global type without `"types": ["vitest/globals"]` in `tsconfig.json`. Explicit import is safer.

Then add this test suite:

```typescript
describe('GET /mcp', () => {
  let app: express.Application;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    const server = new OpenMeteoMCPServer();
    app = (server as unknown as { buildExpressApp(): express.Application }).buildExpressApp();
  });

  it('returns 400 when mcp-session-id header is missing', async () => {
    const res = await supertest(app).get('/mcp');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });

  it('returns 404 when mcp-session-id refers to unknown session', async () => {
    const res = await supertest(app)
      .get('/mcp')
      .set('mcp-session-id', 'nonexistent-session-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });
});
```

- [ ] **Step 2: Run tests to confirm they FAIL**

```bash
npm test -- --reporter=verbose
```

Expected: `GET /mcp` tests FAIL — the stub returns 501, not 400/404.

### Step 3b — Implement GET /mcp

- [ ] **Step 3: Implement the GET /mcp handler in `buildExpressApp()`**

Replace the stub `app.get('/mcp', ...)` body with:

```typescript
app.get('/mcp', async (req, res) => {
  const remoteIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    log('info', 'http_request', {
      method: 'GET',
      session_id: sessionId ? sessionId.substring(0, 8) : null,
      remote_ip: remoteIp,
      user_agent: userAgent,
    });

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: Session ID required' },
        id: null,
      });
      return;
    }

    const session = this.getSession(sessionId);
    if (!session) {
      log('warn', 'session_not_found', {
        session_id: sessionId.substring(0, 8),
        remote_ip: remoteIp,
      });
      res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Session not found' },
        id: null,
      });
      return;
    }

    await session.transport.handleRequest(req, res);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log('error', 'request_error', { error: errorMessage, remote_ip: remoteIp });
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: sanitizeErrorMessage(err) },
        id: null,
      });
    }
  }
});
```

- [ ] **Step 4: Run tests — they should PASS**

```bash
npm test -- --reporter=verbose
```

Expected:
- `GET /mcp returns 400 when mcp-session-id header is missing` — PASS
- `GET /mcp returns 404 when mcp-session-id refers to unknown session` — PASS

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/index.test.ts
git commit -m "feat: add GET /mcp endpoint for SSE streaming (issue #35)"
```

---

## Task 4: DELETE /mcp — session termination (TDD)

**Files:**
- Modify: `src/index.test.ts`
- Modify: `src/index.ts`

### Step 4a — Write failing tests

- [ ] **Step 1: Add DELETE /mcp tests to `src/index.test.ts`**

Add this test suite:

```typescript
describe('DELETE /mcp', () => {
  let app: express.Application;
  let mcpServer: OpenMeteoMCPServer;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    mcpServer = new OpenMeteoMCPServer();
    app = (mcpServer as unknown as { buildExpressApp(): express.Application }).buildExpressApp();
  });

  it('returns 400 when mcp-session-id header is missing', async () => {
    const res = await supertest(app).delete('/mcp');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });

  it('returns 404 when mcp-session-id refers to unknown session', async () => {
    const res = await supertest(app)
      .delete('/mcp')
      .set('mcp-session-id', 'nonexistent-session-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });

  it('calls transport.close() and returns 200 when session exists', async () => {
    // Inject a fake session into the private map
    const fakeTransport = {
      close: vi.fn().mockResolvedValue(undefined),
      handleRequest: vi.fn(),
    };
    const sessionId = 'test-session-id-1234';
    const sessionServers = (mcpServer as unknown as {
      sessionServers: Map<string, { server: object; transport: typeof fakeTransport; lastActivity: number }>
    }).sessionServers;

    // Wire up onclose so the session is removed from the map (as in production)
    const fakeServer = {
      onclose: undefined as (() => void) | undefined,
    };
    fakeTransport.close.mockImplementation(async () => {
      fakeServer.onclose?.();
    });
    sessionServers.set(sessionId, {
      server: fakeServer as unknown as object,
      transport: fakeTransport as unknown as import('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport,
      lastActivity: Date.now(),
    });
    // Set up the onclose callback as production code does
    fakeServer.onclose = () => {
      sessionServers.delete(sessionId);
    };

    const res = await supertest(app)
      .delete('/mcp')
      .set('mcp-session-id', sessionId);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Session terminated');
    expect(fakeTransport.close).toHaveBeenCalledOnce();
    // Verify session was removed from the map
    expect(sessionServers.has(sessionId)).toBe(false);
  });
});
```

> **Note on session cleanup:** In production, `server.onclose` is set in the POST `initialize` handler (not in DELETE). The test above wires it up manually on the fake to verify the full cleanup path. This is the correct way to test it — `transport.close()` triggers `onclose`, which deletes from the map.

- [ ] **Step 2: Run tests to confirm they FAIL**

```bash
npm test -- --reporter=verbose
```

Expected: `DELETE /mcp` tests FAIL — the stub returns 501.

### Step 4b — Implement DELETE /mcp

- [ ] **Step 3: Implement the DELETE /mcp handler in `buildExpressApp()`**

Replace the stub `app.delete('/mcp', ...)` body with:

```typescript
app.delete('/mcp', async (req, res) => {
  const remoteIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    log('info', 'http_request', {
      method: 'DELETE',
      session_id: sessionId ? sessionId.substring(0, 8) : null,
      remote_ip: remoteIp,
      user_agent: userAgent,
    });

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: Session ID required' },
        id: null,
      });
      return;
    }

    // Use direct map access — lastActivity is irrelevant for a session about to be destroyed
    const session = this.sessionServers.get(sessionId);
    if (!session) {
      log('warn', 'session_not_found', {
        session_id: sessionId.substring(0, 8),
        remote_ip: remoteIp,
      });
      res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Session not found' },
        id: null,
      });
      return;
    }

    await session.transport.close();
    res.status(200).json({ message: 'Session terminated' });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log('error', 'request_error', { error: errorMessage, remote_ip: remoteIp });
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: sanitizeErrorMessage(err) },
        id: null,
      });
    }
  }
});
```

- [ ] **Step 4: Run tests — all should PASS**

```bash
npm test -- --reporter=verbose
```

Expected: all `DELETE /mcp` tests PASS.

- [ ] **Step 5: Typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/index.test.ts
git commit -m "feat: add DELETE /mcp endpoint for session termination (issue #35)"
```

---

## Task 5: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: TypeScript compiles to `dist/` with no errors.

- [ ] **Step 3: Commit (if any cleanup needed, otherwise skip)**

```bash
git add -A
git commit -m "chore: cleanup after GET/DELETE /mcp implementation"
```
