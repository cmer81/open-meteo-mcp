import type express from 'express';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenMeteoClient } from './client.js';
import { OpenMeteoMCPServer } from './index.js';
import { ALL_TOOLS } from './tools.js';
import { CHARACTER_LIMIT } from './truncation.js';
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

describe('Full protocol round trip via McpServer#registerTool', () => {
  let app: express.Application;
  let mcpServer: OpenMeteoMCPServer;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    mcpServer = new OpenMeteoMCPServer();
    app = (mcpServer as unknown as { buildExpressApp(): express.Application }).buildExpressApp();
  });

  it('lists all 17 tools with read-only annotations and successfully calls weather_forecast', async () => {
    const client = (mcpServer as unknown as { client: OpenMeteoClient }).client;
    const fakeResponse = {
      latitude: 48.85,
      longitude: 2.35,
      elevation: 35,
      generationtime_ms: 0.1,
      utc_offset_seconds: 0,
      hourly: { time: ['2026-01-01T00:00'], temperature_2m: [5] },
    };
    vi.spyOn(client, 'getForecast').mockResolvedValue(fakeResponse);

    // A real MCP client always sends both media types the streamable HTTP
    // transport supports; supertest defaults to none, so this must be explicit.
    const acceptBoth = 'application/json, text/event-stream';

    const initRes = await supertest(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      });

    expect(initRes.status).toBe(200);
    const sessionId = initRes.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();

    const listRes = await supertest(app)
      .post('/mcp')
      .set('mcp-session-id', sessionId)
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

    expect(listRes.status).toBe(200);
    const tools = listRes.body.result.tools as Array<{
      name: string;
      annotations?: { readOnlyHint?: boolean };
      inputSchema: { properties: Record<string, unknown> };
    }>;
    expect(tools).toHaveLength(17);
    const forecastTool = tools.find((t) => t.name === 'weather_forecast');
    expect(forecastTool?.annotations?.readOnlyHint).toBe(true);
    expect(forecastTool?.inputSchema.properties.latitude).toBeDefined();

    const callRes = await supertest(app)
      .post('/mcp')
      .set('mcp-session-id', sessionId)
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'weather_forecast', arguments: { latitude: 48.85, longitude: 2.35 } },
      });

    expect(callRes.status).toBe(200);
    const content = callRes.body.result.content[0].text;
    expect(JSON.parse(content).hourly.temperature_2m).toEqual([5]);
    // Confirms the SDK validates via our Zod schema (applying its .default()s)
    // before invoking the handler, not just passing raw arguments through.
    expect(client.getForecast).toHaveBeenCalledWith({
      latitude: 48.85,
      longitude: 2.35,
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timeformat: 'iso8601',
    });
  });

  // Tools whose params schema carries a .refine() used to reach the SDK as a
  // ZodEffects, which it cannot introspect: it published an empty `{}` schema
  // while still validating strictly, leaving clients unable to know what to send.
  it('publishes a complete input schema for every tool', async () => {
    const acceptBoth = 'application/json, text/event-stream';
    const initRes = await supertest(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      });
    const sessionId = initRes.headers['mcp-session-id'];

    const listRes = await supertest(app)
      .post('/mcp')
      .set('mcp-session-id', sessionId)
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

    const tools = listRes.body.result.tools as Array<{
      name: string;
      inputSchema: {
        properties?: Record<string, unknown>;
        required?: string[];
        additionalProperties?: boolean;
      };
    }>;

    for (const tool of tools) {
      expect(
        Object.keys(tool.inputSchema.properties ?? {}).length,
        `${tool.name} exposes no properties`,
      ).toBeGreaterThan(0);
      expect(
        tool.inputSchema.required ?? [],
        `${tool.name} exposes no required fields`,
      ).not.toEqual([]);
      expect(
        tool.inputSchema.additionalProperties,
        `${tool.name} does not reject unknown keys`,
      ).toBe(false);
    }

    const archive = tools.find((t) => t.name === 'weather_archive');
    expect(archive?.inputSchema.required).toEqual(
      expect.arrayContaining(['latitude', 'longitude', 'start_date', 'end_date']),
    );
    const climate = tools.find((t) => t.name === 'climate_projection');
    expect(climate?.inputSchema.required).toEqual(
      expect.arrayContaining(['latitude', 'longitude', 'start_date', 'end_date']),
    );
  });

  it('keeps an oversized tool response within the character limit', async () => {
    const client = (mcpServer as unknown as { client: OpenMeteoClient }).client;
    const length = 20_000;
    vi.spyOn(client, 'getForecast').mockResolvedValue({
      latitude: 48.85,
      longitude: 2.35,
      elevation: 35,
      generationtime_ms: 0.1,
      utc_offset_seconds: 0,
      hourly: {
        time: Array.from({ length }, (_, i) => `2026-01-01T${i}:00`),
        temperature_2m: Array.from({ length }, (_, i) => i / 10),
      },
    });

    const acceptBoth = 'application/json, text/event-stream';
    const initRes = await supertest(app)
      .post('/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      });
    const sessionId = initRes.headers['mcp-session-id'];

    const callRes = await supertest(app)
      .post('/mcp')
      .set('mcp-session-id', sessionId)
      .set('Content-Type', 'application/json')
      .set('Accept', acceptBoth)
      .send({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'weather_forecast', arguments: { latitude: 48.85, longitude: 2.35 } },
      });

    const text = callRes.body.result.content[0].text as string;
    expect(text.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(JSON.parse(text).truncated).toBe(true);
  });
});
