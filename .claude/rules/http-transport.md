---
paths:
  - "src/index.ts"
  - "src/security.ts"
  - "src/security.test.ts"
  - "Dockerfile"
---

# HTTP transport and security

The HTTP transport is **stateless**: a fresh `McpServer` + transport per `POST`, no session IDs, `GET`/`DELETE` answer 405. It listens on `PORT` (default 3000) at `/mcp`, bound to `HOST` (default `127.0.0.1`, loopback only; the Docker image sets `0.0.0.0`).

## Middleware ordering

Express runs middleware in declaration order, so every guard must be registered **before** the routes it protects. `createOriginValidator`, `createRateLimiter` and `createAuthMiddleware` are mounted ahead of the `/mcp` GET, POST and DELETE handlers; mounting them later silently leaves the earlier routes unauthenticated. `/health` is declared before the guards on purpose, so container probes work without a key.

## Security env vars (HTTP mode only, all optional)

- `API_KEY` - When set, every `/mcp` request needs `Authorization: Bearer <key>` or `X-API-Key`. Unset = open mode.
- `RATE_LIMIT_RPM` - Requests per minute per client IP (default: 60); IPv6 clients are grouped by /56
- `RATE_LIMIT_ANTHROPIC_RPM` - Requests per minute shared by all traffic from Anthropic's outbound range `160.79.104.0/21`, i.e. every claude.ai user together (default: 600)
- `TRUSTED_PROXIES` - Comma-separated IPs/CIDRs whose `X-Forwarded-For` is trusted. Unset = header ignored.
- `ALLOWED_ORIGINS` - Comma-separated browser origins allowed (DNS rebinding protection). Empty by default: any request carrying an `Origin` header is rejected with 403. Requests without one are unaffected.
