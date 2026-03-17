import type express from 'express';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenMeteoClient } from './client.js';
import { OpenMeteoMCPServer } from './index.js';
import { ALL_TOOLS } from './tools.js';
import {
  AirQualityParamsSchema,
  ArchiveParamsSchema,
  ElevationParamsSchema,
  ForecastParamsSchema,
  GeocodingParamsSchema,
  LocationSchema,
  MarineParamsSchema,
} from './types.js';

// Basic import tests
describe('Module imports', () => {
  it('should import types successfully', () => {
    expect(ForecastParamsSchema).toBeDefined();
    expect(ArchiveParamsSchema).toBeDefined();
    expect(AirQualityParamsSchema).toBeDefined();
    expect(MarineParamsSchema).toBeDefined();
    expect(ElevationParamsSchema).toBeDefined();
    expect(GeocodingParamsSchema).toBeDefined();
    expect(LocationSchema).toBeDefined();
  });

  it('should validate coordinates schema', () => {
    const validParams = {
      latitude: 48.8566,
      longitude: 2.3522,
    };

    expect(() => ForecastParamsSchema.parse(validParams)).not.toThrow();

    const invalidParams = {
      latitude: 91, // Invalid latitude
      longitude: 2.3522,
    };

    expect(() => ForecastParamsSchema.parse(invalidParams)).toThrow();
  });

  it('should validate geocoding parameters', () => {
    const validGeocodingParams = {
      name: 'Paris',
      count: 5,
    };

    expect(() => GeocodingParamsSchema.parse(validGeocodingParams)).not.toThrow();

    // Test avec les nouveaux paramètres optionnels
    const validGeocodingParamsWithOptional = {
      name: 'Berlin',
      count: 3,
      language: 'fr',
      countryCode: 'DE',
    };

    expect(() => GeocodingParamsSchema.parse(validGeocodingParamsWithOptional)).not.toThrow();

    const invalidGeocodingParams = {
      name: 'P', // Too short
      count: 5,
    };

    expect(() => GeocodingParamsSchema.parse(invalidGeocodingParams)).toThrow();

    // Test avec un code pays invalide
    const invalidCountryCode = {
      name: 'Lyon',
      countryCode: 'FRA', // Doit être 2 caractères
    };

    expect(() => GeocodingParamsSchema.parse(invalidCountryCode)).toThrow(
      'Le code pays doit être au format ISO-3166-1 alpha2',
    );
  });

  it('should import tools successfully', () => {
    expect(ALL_TOOLS).toBeDefined();
    expect(Array.isArray(ALL_TOOLS)).toBe(true);
    expect(ALL_TOOLS.length).toBeGreaterThan(0);

    // Vérifier que l'outil de géocodage est présent
    const geocodingTool = ALL_TOOLS.find((tool) => tool.name === 'geocoding');
    expect(geocodingTool).toBeDefined();
    expect(geocodingTool?.description).toContain('Search for locations');
  });

  it('should import client successfully', () => {
    expect(OpenMeteoClient).toBeDefined();
    const client = new OpenMeteoClient();
    expect(client).toBeInstanceOf(OpenMeteoClient);
  });
});

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
    const res = await supertest(app).get('/mcp').set('mcp-session-id', 'nonexistent-session-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });
});

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
    const res = await supertest(app).delete('/mcp').set('mcp-session-id', 'nonexistent-session-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32600);
  });

  it('calls transport.close() and returns 200 when session exists', async () => {
    const fakeTransport = {
      close: vi.fn().mockResolvedValue(undefined),
      handleRequest: vi.fn(),
    };
    const sessionId = 'test-session-id-1234';
    const sessionServers = (
      mcpServer as unknown as {
        sessionServers: Map<
          string,
          { server: object; transport: typeof fakeTransport; lastActivity: number }
        >;
      }
    ).sessionServers;

    // Wire up onclose so the session is removed from the map (as in production)
    const fakeServer = {
      onclose: undefined as (() => void) | undefined,
    };
    fakeTransport.close.mockImplementation(async () => {
      fakeServer.onclose?.();
    });
    sessionServers.set(sessionId, {
      server: fakeServer as unknown as object,
      transport:
        fakeTransport as unknown as import('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport,
      lastActivity: Date.now(),
    });
    // Set up the onclose callback as production code does
    fakeServer.onclose = () => {
      sessionServers.delete(sessionId);
    };

    const res = await supertest(app).delete('/mcp').set('mcp-session-id', sessionId);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Session terminated');
    expect(fakeTransport.close).toHaveBeenCalledOnce();
    // Verify session was removed from the map via onclose
    expect(sessionServers.has(sessionId)).toBe(false);
  });
});
