#!/usr/bin/env node
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import express from 'express';
import { OpenMeteoClient } from './client.js';
import { ALL_TOOLS } from './tools.js';
import {
  AirQualityParamsSchema,
  ArchiveParamsSchema,
  ClimateParamsSchema,
  EcmwfParamsSchema,
  ElevationParamsSchema,
  EnsembleParamsSchema,
  FloodParamsSchema,
  ForecastParamsSchema,
  GeocodingParamsSchema,
  MarineParamsSchema,
  SeasonalParamsSchema,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

// Structured JSON logger — writes to stderr to stay out of MCP stdio protocol
function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown> = {},
): void {
  process.stderr.write(
    `${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...data })}\n`,
  );
}

// Extracts real client IP, respecting X-Forwarded-For for CDN/proxy setups
function getClientIp(req: express.Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff;
    const raw = first ?? '';
    return (raw.split(',')[0] ?? raw).trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

class OpenMeteoMCPServer {
  private client: OpenMeteoClient;
  private sessionServers: Map<
    string,
    { server: Server; transport: StreamableHTTPServerTransport; lastActivity: number }
  > = new Map();

  private static readonly SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour idle timeout
  private static readonly MAX_SESSIONS = 100;
  private static readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // run cleanup every 5 minutes

  constructor() {
    const baseURL = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com';
    this.client = new OpenMeteoClient(baseURL);
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: 'open-meteo-mcp-server',
        version: pkg.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    // Setup handlers for this server instance
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: ALL_TOOLS,
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const start = Date.now();

      log('info', 'tool_call', { tool: name, args });

      // Explicit validation for 'models' parameter on forecast tools
      // Climate projection is excluded as it naturally supports multiple models in one call
      const isForecastTool = name.includes('forecast') || name === 'weather_forecast';
      const isClimateTool = name === 'climate_projection';

      if (
        isForecastTool &&
        !isClimateTool &&
        args &&
        typeof args === 'object' &&
        'models' in args
      ) {
        const models = args.models;
        if (Array.isArray(models) || (typeof models === 'string' && models.startsWith('['))) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: models must be a single string, not an array. For multi-model comparison, make one parallel tool call per model.',
              },
            ],
            isError: true,
          };
        }
      }

      try {
        let result: unknown;
        switch (name) {
          case 'weather_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getForecast(params);
            break;
          }
          case 'weather_archive': {
            const params = ArchiveParamsSchema.parse(args);
            result = await this.client.getArchive(params);
            break;
          }
          case 'air_quality': {
            const params = AirQualityParamsSchema.parse(args);
            result = await this.client.getAirQuality(params);
            break;
          }
          case 'marine_weather': {
            const params = MarineParamsSchema.parse(args);
            result = await this.client.getMarine(params);
            break;
          }
          case 'elevation': {
            const params = ElevationParamsSchema.parse(args);
            result = await this.client.getElevation(params);
            break;
          }
          case 'flood_forecast': {
            const params = FloodParamsSchema.parse(args);
            result = await this.client.getFlood(params);
            break;
          }
          case 'geocoding': {
            const params = GeocodingParamsSchema.parse(args);
            result = await this.client.getGeocoding(params);
            break;
          }
          case 'dwd_icon_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getDwdIcon(params);
            break;
          }
          case 'gfs_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getGfs(params);
            break;
          }
          case 'meteofrance_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getMeteoFrance(params);
            break;
          }
          case 'ecmwf_forecast': {
            const params = EcmwfParamsSchema.parse(args);
            result = await this.client.getEcmwf(params);
            break;
          }
          case 'jma_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getJma(params);
            break;
          }
          case 'metno_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getMetno(params);
            break;
          }
          case 'gem_forecast': {
            const params = ForecastParamsSchema.parse(args);
            result = await this.client.getGem(params);
            break;
          }
          case 'seasonal_forecast': {
            const params = SeasonalParamsSchema.parse(args);
            result = await this.client.getSeasonal(params);
            break;
          }
          case 'climate_projection': {
            const params = ClimateParamsSchema.parse(args);
            result = await this.client.getClimate(params);
            break;
          }
          case 'ensemble_forecast': {
            const params = EnsembleParamsSchema.parse(args);
            result = await this.client.getEnsemble(params);
            break;
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        const responseText = JSON.stringify(result, null, 2);
        log('info', 'tool_success', {
          tool: name,
          response_size: responseText.length,
          duration_ms: Date.now() - start,
        });

        return { content: [{ type: 'text', text: responseText }] };
      } catch (err) {
        let message = 'Unknown error';
        if (axios.isAxiosError(err)) {
          message = err.response?.data?.reason || err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        log('error', 'tool_error', { tool: name, error: message, duration_ms: Date.now() - start });
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    });

    return server;
  }

  private getSession(
    sessionId: string,
  ): { server: Server; transport: StreamableHTTPServerTransport } | undefined {
    const session = this.sessionServers.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  private startCleanupTimer(): void {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessionServers) {
        if (now - session.lastActivity > OpenMeteoMCPServer.SESSION_TTL_MS) {
          session.server.close().catch(() => {});
          this.sessionServers.delete(id);
          log('info', 'session_expired', { session_id: id.substring(0, 8) });
        }
      }
    }, OpenMeteoMCPServer.CLEANUP_INTERVAL_MS);
    // Don't keep the process alive just for cleanup
    timer.unref();
  }

  async run() {
    const useHttp = process.env.TRANSPORT === 'http';

    if (useHttp) {
      this.startCleanupTimer();

      const app = express();
      app.use(express.json());

      // Health check endpoint
      app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
      });

      app.use((req, _res, next) => {
        const acceptHeader = req.headers.accept;
        const tokens = acceptHeader
          ? acceptHeader
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

        const normalized = new Set(tokens.map((value) => value.toLowerCase()));

        const ensureHeader = (value: string) => {
          if (!normalized.has(value)) {
            tokens.push(value);
            normalized.add(value);
          }
        };

        ensureHeader('application/json');
        ensureHeader('text/event-stream');

        req.headers.accept = tokens.join(', ');

        next();
      });

      // Generate unique session IDs for each client
      const sessionIdGenerator = () => {
        const timestamp = Date.now().toString(36);
        const random1 = Math.random().toString(36).substring(2, 15);
        const random2 = Math.random().toString(36).substring(2, 15);
        const random3 = Math.random().toString(36).substring(2, 15);
        return `${timestamp}-${random1}-${random2}-${random3}`;
      };

      app.post('/mcp', async (req, res) => {
        const remoteIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] ?? 'unknown';

        try {
          const method = req.body?.method || 'unknown';

          // Extract session ID from headers
          const sessionId = (req.headers['mcp-session-id'] || req.headers['Mcp-Session-Id']) as
            | string
            | undefined;

          log('info', 'http_request', {
            method,
            session_id: sessionId ? sessionId.substring(0, 8) : null,
            remote_ip: remoteIp,
            user_agent: userAgent,
          });

          // If no session ID and it's an initialize request, create a new session
          if (!sessionId && req.body?.method === 'initialize') {
            if (this.sessionServers.size >= OpenMeteoMCPServer.MAX_SESSIONS) {
              log('warn', 'session_limit_reached', {
                current: this.sessionServers.size,
                max: OpenMeteoMCPServer.MAX_SESSIONS,
                remote_ip: remoteIp,
              });
              res.status(503).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Server at session capacity, try again later' },
                id: req.body?.id || null,
              });
              return;
            }

            // Generate a new session ID
            const newSessionId = sessionIdGenerator();
            log('info', 'session_created', { session_id: newSessionId.substring(0, 8) });

            // Create server and transport for this new session
            const server = this.createServer();
            const transport = new StreamableHTTPServerTransport({
              enableJsonResponse: true,
              sessionIdGenerator: () => newSessionId,
            });

            server.oninitialized = () => {
              log('info', 'session_initialized', { session_id: newSessionId.substring(0, 8) });
            };

            server.onclose = () => {
              this.sessionServers.delete(newSessionId);
              log('info', 'session_closed', { session_id: newSessionId.substring(0, 8) });
            };

            await server.connect(transport as Transport);

            this.sessionServers.set(newSessionId, { server, transport, lastActivity: Date.now() });

            // Set session ID in response header before handling request
            res.setHeader('mcp-session-id', newSessionId);

            // Handle the initialize request
            await transport.handleRequest(req, res, req.body);
            return;
          }

          if (sessionId) {
            const session = this.getSession(sessionId);
            if (!session) {
              log('warn', 'session_not_found', {
                session_id: sessionId.substring(0, 8),
                remote_ip: remoteIp,
              });
              res.status(404).json({
                jsonrpc: '2.0',
                error: { code: -32600, message: 'Session not found' },
                id: req.body?.id || null,
              });
              return;
            }
            const { transport } = session;
            await transport.handleRequest(req, res, req.body);
          } else {
            // No session ID and not an initialize request - error
            log('warn', 'invalid_request', {
              reason: 'missing_session_id',
              method,
              remote_ip: remoteIp,
            });
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Session ID required for non-initialize requests',
              },
              id: req.body?.id || null,
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          log('error', 'request_error', { error: errorMessage, remote_ip: remoteIp });
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Internal error: ${errorMessage}`,
            },
            id: req.body?.id || null,
          });
        }
      });

      const port = parseInt(process.env.PORT || '3000', 10);
      app
        .listen(port, () => {
          log('info', 'server_start', { transport: 'http', port });
        })
        .on('error', (err) => {
          log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
          process.exit(1);
        });
    } else {
      // For stdio mode, create a single server instance
      const server = this.createServer();
      const transport = new StdioServerTransport();
      server.oninitialized = () => {
        log('info', 'session_initialized', { transport: 'stdio' });
      };
      await server.connect(transport as Transport);
      log('info', 'server_start', { transport: 'stdio' });
    }
  }
}

const server = new OpenMeteoMCPServer();
server.run().catch((err) => {
  log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
