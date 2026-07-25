import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Generates a cryptographically secure session ID using the Web Crypto API
 * (built-in since Node.js 14.17). Never use Math.random() for session IDs.
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Express middleware that enforces API key authentication when the API_KEY
 * environment variable is set. When API_KEY is not configured, all requests
 * are allowed through (development/local mode).
 *
 * Accepts the key via:
 *   - Authorization: Bearer <key>
 *   - X-API-Key: <key>
 */
export function createAuthMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = process.env.API_KEY;

    // No API_KEY configured → open mode (local / dev)
    if (!apiKey) {
      next();
      return;
    }

    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const headerKey = req.headers['x-api-key'] as string | undefined;

    if (bearer === apiKey || headerKey === apiKey) {
      next();
      return;
    }

    res.status(401).json({ error: 'Unauthorized: valid API key required' });
  };
}

/**
 * Express middleware guarding against DNS rebinding attacks: without it, a page
 * served from any website can drive a locally bound MCP server through the
 * victim's browser.
 *
 * Requests carrying no `Origin` header — CLI clients, SDK transports, container
 * probes — pass through untouched. A request that does carry one is browser-issued
 * and must match the ALLOWED_ORIGINS allow-list (comma-separated), which is empty
 * by default: no browser is expected to talk to this server unless configured.
 */
export function createOriginValidator() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (!origin) {
      next();
      return;
    }

    const allowed = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (allowed.includes(origin)) {
      next();
      return;
    }

    res.status(403).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Forbidden: origin not allowed' },
      id: null,
    });
  };
}

/**
 * The MCP spec requires clients to accept both application/json and
 * text/event-stream; clients sending `*\/*` or a single type are otherwise
 * rejected with a 406. This widens the header on their behalf.
 *
 * Crucially it rewrites `rawHeaders` and not just `req.headers`: the SDK hands
 * the request to Hono's `getRequestListener`, which rebuilds the web-standard
 * Request from Node's raw header array, so mutating the parsed object alone is
 * invisible to the transport.
 */
export function createAcceptNormalizer() {
  const required = ['application/json', 'text/event-stream'];

  return (req: Request, _res: Response, next: NextFunction): void => {
    const tokens = (req.headers.accept ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const present = new Set(tokens.map((value) => value.toLowerCase()));

    for (const value of required) {
      if (!present.has(value)) {
        tokens.push(value);
        present.add(value);
      }
    }

    const merged = tokens.join(', ');
    req.headers.accept = merged;

    // Rebuild rawHeaders with exactly one Accept entry carrying the merged value.
    const raw = req.rawHeaders;
    const rebuilt: string[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const key = raw[i];
      const value = raw[i + 1];
      if (key === undefined || value === undefined) continue;
      if (key.toLowerCase() === 'accept') continue;
      rebuilt.push(key, value);
    }
    rebuilt.push('Accept', merged);
    raw.length = 0;
    raw.push(...rebuilt);

    next();
  };
}

/**
 * Returns a safe, generic error message for HTTP responses.
 * Never expose internal error details (stack traces, connection strings,
 * internal hostnames) to clients.
 */
export function sanitizeErrorMessage(_err: unknown): string {
  return 'Internal server error';
}

// ---------------------------------------------------------------------------
// Trusted-proxy-aware IP extraction
// ---------------------------------------------------------------------------

/** Converts an IPv4 address string to a 32-bit integer. */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

/** Returns true if `ip` matches the given CIDR (e.g. "10.0.0.0/8") or exact IP. */
function ipMatchesCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr;
  const [network, prefixStr] = cidr.split('/');
  if (!network || prefixStr === undefined) return false;
  const prefix = parseInt(prefixStr, 10);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(network) & mask);
}

function isIpTrusted(ip: string, trustedList: string[]): boolean {
  return trustedList.some((cidr) => ipMatchesCidr(ip, cidr));
}

/**
 * Returns the real client IP, respecting X-Forwarded-For only when the
 * direct connection comes from a trusted proxy (TRUSTED_PROXIES env var).
 *
 * TRUSTED_PROXIES: comma-separated list of IPs or CIDR ranges.
 * e.g. "10.0.0.0/8,192.168.1.1"
 *
 * When TRUSTED_PROXIES is not set, X-Forwarded-For is always ignored to
 * prevent IP spoofing.
 */
/** Normalizes an IPv4-mapped IPv6 address (::ffff:x.x.x.x) to plain IPv4. */
function normalizeIp(ip: string): string {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped ? (mapped[1] ?? ip) : ip;
}

export function getClientIp(req: Request): string {
  const rawSocketIp =
    req.ip ?? (req.socket as { remoteAddress?: string })?.remoteAddress ?? 'unknown';
  const socketIp = rawSocketIp === 'unknown' ? rawSocketIp : normalizeIp(rawSocketIp);

  const trustedProxies = process.env.TRUSTED_PROXIES;
  if (trustedProxies) {
    const trustedList = trustedProxies
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (socketIp !== 'unknown' && isIpTrusted(socketIp, trustedList)) {
      const xff = req.headers['x-forwarded-for'];
      if (xff) {
        const raw = Array.isArray(xff) ? (xff[0] ?? '') : xff;
        const first = raw.split(',')[0]?.trim();
        if (first) return first;
      }
    }
  }

  return socketIp;
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

/**
 * Creates an express-rate-limit middleware.
 * Reads RATE_LIMIT_RPM from env (default: 60 requests per minute).
 * Uses trusted-proxy-aware IP extraction for the key.
 */
export function createRateLimiter() {
  const rpm = parseInt(process.env.RATE_LIMIT_RPM ?? '60', 10);
  const max = Number.isFinite(rpm) && rpm > 0 ? rpm : 60;

  return rateLimit({
    windowMs: 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
  });
}
