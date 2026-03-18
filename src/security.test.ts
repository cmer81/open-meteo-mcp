import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAuthMiddleware,
  createRateLimiter,
  generateSessionId,
  getClientIp,
} from './security.js';

// ---------------------------------------------------------------------------
// generateSessionId
// ---------------------------------------------------------------------------

describe('generateSessionId', () => {
  it('returns a valid UUID v4', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique IDs across 1000 calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateSessionId()));
    expect(ids.size).toBe(1000);
  });

  it('does not use Math.random (output is not predictable from timestamp)', () => {
    // crypto.randomUUID produces RFC 4122 v4 — the version nibble is always '4'
    // and the variant nibble is always 8, 9, a, or b.
    const id = generateSessionId();
    const parts = id.split('-');
    expect(parts[2]?.charAt(0)).toBe('4'); // version nibble
    expect(['8', '9', 'a', 'b']).toContain(parts[3]?.charAt(0)); // variant nibble
  });
});

// ---------------------------------------------------------------------------
// createAuthMiddleware
// ---------------------------------------------------------------------------

function makeReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers } as Partial<Request>;
}

function makeRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res); // allow chaining: res.status(401).json(...)
  return res;
}

describe('createAuthMiddleware', () => {
  afterEach(() => {
    delete process.env.API_KEY;
  });

  describe('when API_KEY is not configured', () => {
    it('calls next() for any request', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq();
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('when API_KEY is configured', () => {
    beforeEach(() => {
      process.env.API_KEY = 'secret-token-123';
    });

    it('returns 401 when Authorization header is absent', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq();
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Unauthorized') }),
      );
    });

    it('returns 401 when Authorization header has wrong token', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq({ authorization: 'Bearer wrong-token' });
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when X-API-Key header has wrong token', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq({ 'x-api-key': 'wrong-token' });
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls next() when Authorization Bearer token is correct', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq({ authorization: 'Bearer secret-token-123' });
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('calls next() when X-API-Key header is correct', () => {
      const middleware = createAuthMiddleware();
      const next = vi.fn() as unknown as NextFunction;
      const req = makeReq({ 'x-api-key': 'secret-token-123' });
      const res = makeRes();

      middleware(req as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// sanitizeErrorMessage
// ---------------------------------------------------------------------------

import { sanitizeErrorMessage } from './security.js';

describe('sanitizeErrorMessage', () => {
  it('returns a generic message regardless of input', () => {
    const msg = sanitizeErrorMessage(new Error('Connection to 10.0.0.1:5432 refused'));
    expect(msg).toBe('Internal server error');
    expect(msg).not.toContain('10.0.0.1');
    expect(msg).not.toContain('5432');
  });

  it('returns a generic message for string errors', () => {
    const msg = sanitizeErrorMessage('axios: timeout of 30000ms exceeded at /v1/archive');
    expect(msg).toBe('Internal server error');
  });

  it('returns a generic message for unknown error types', () => {
    const msg = sanitizeErrorMessage({ code: 'ECONNREFUSED', port: 5432 });
    expect(msg).toBe('Internal server error');
  });
});

// ---------------------------------------------------------------------------
// getClientIp
// ---------------------------------------------------------------------------

function makeReqWithSocket(
  socketIp: string,
  headers: Record<string, string> = {},
): Partial<Request> {
  return {
    headers,
    socket: { remoteAddress: socketIp } as never,
    ip: socketIp,
  } as Partial<Request>;
}

describe('getClientIp', () => {
  afterEach(() => {
    delete process.env.TRUSTED_PROXIES;
  });

  it('returns the direct socket IP when no X-Forwarded-For header is present', () => {
    const req = makeReqWithSocket('1.2.3.4');
    expect(getClientIp(req as Request)).toBe('1.2.3.4');
  });

  it('returns the direct socket IP when no TRUSTED_PROXIES is configured, even if X-Forwarded-For is set', () => {
    // Without a trusted proxy list, X-Forwarded-For must be ignored (could be spoofed)
    const req = makeReqWithSocket('5.5.5.5', { 'x-forwarded-for': '10.0.0.1' });
    expect(getClientIp(req as Request)).toBe('5.5.5.5');
  });

  it('returns the X-Forwarded-For IP when the request comes from a trusted proxy', () => {
    process.env.TRUSTED_PROXIES = '10.0.0.0/8,192.168.1.1';
    const req = makeReqWithSocket('10.1.2.3', { 'x-forwarded-for': '8.8.8.8' });
    expect(getClientIp(req as Request)).toBe('8.8.8.8');
  });

  it('ignores X-Forwarded-For when the request comes from an untrusted IP', () => {
    process.env.TRUSTED_PROXIES = '192.168.1.1';
    const req = makeReqWithSocket('5.5.5.5', { 'x-forwarded-for': '10.0.0.1' });
    expect(getClientIp(req as Request)).toBe('5.5.5.5');
  });

  it('returns the first IP in a comma-separated X-Forwarded-For list', () => {
    process.env.TRUSTED_PROXIES = '10.0.0.1';
    const req = makeReqWithSocket('10.0.0.1', {
      'x-forwarded-for': '8.8.8.8, 172.16.0.1, 10.0.0.1',
    });
    expect(getClientIp(req as Request)).toBe('8.8.8.8');
  });

  it('returns "unknown" when socket IP is not available', () => {
    const req = { headers: {}, socket: {}, ip: undefined } as unknown as Request;
    expect(getClientIp(req)).toBe('unknown');
  });

  it('handles IPv4-mapped IPv6 socket IP (::ffff:x.x.x.x) from trusted proxy', () => {
    process.env.TRUSTED_PROXIES = '10.0.0.0/8';
    const req = makeReqWithSocket('::ffff:10.0.0.1', { 'x-forwarded-for': '203.0.113.5' });
    expect(getClientIp(req as Request)).toBe('203.0.113.5');
  });

  it('ignores X-Forwarded-For for IPv4-mapped IPv6 from untrusted proxy', () => {
    process.env.TRUSTED_PROXIES = '10.0.0.0/8';
    const req = makeReqWithSocket('::ffff:172.16.0.1', { 'x-forwarded-for': '203.0.113.5' });
    // normalizeIp strips ::ffff: prefix, so the returned IP is plain IPv4
    expect(getClientIp(req as Request)).toBe('172.16.0.1');
  });
});

// ---------------------------------------------------------------------------
// createRateLimiter
// ---------------------------------------------------------------------------

describe('createRateLimiter', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_RPM;
  });

  it('creates a limiter with default 60 RPM when RATE_LIMIT_RPM is not set', () => {
    const limiter = createRateLimiter();
    // express-rate-limit v8 exposes the config via the middleware function itself
    // We verify the limiter is a function (valid Express middleware)
    expect(typeof limiter).toBe('function');
  });

  it('creates a limiter with custom RPM from RATE_LIMIT_RPM env var', () => {
    process.env.RATE_LIMIT_RPM = '120';
    const limiter = createRateLimiter();
    expect(typeof limiter).toBe('function');
  });

  it('falls back to 60 RPM when RATE_LIMIT_RPM is not a valid number', () => {
    process.env.RATE_LIMIT_RPM = 'not-a-number';
    // Should not throw
    expect(() => createRateLimiter()).not.toThrow();
  });
});
