#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OpenMeteoClient } from './client.js';
import { ALL_TOOLS } from './tools.js';
import {
  ForecastParamsSchema,
  ArchiveParamsSchema,
  AirQualityParamsSchema,
  MarineParamsSchema,
  FloodParamsSchema,
  ElevationParamsSchema,
  GeocodingParamsSchema,
  SeasonalParamsSchema,
  ClimateParamsSchema,
  EnsembleParamsSchema,
} from './types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

class OpenMeteoMCPServer {
  private client: OpenMeteoClient;
  private sessionServers: Map<string, { server: Server; transport: StreamableHTTPServerTransport; lastActivity: number }> = new Map();

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
      }
    );

    // Setup handlers for this server instance
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: ALL_TOOLS,
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const timestamp = new Date().toISOString();

      console.error(`[${timestamp}] TOOL CALLED: ${name}`);
      console.error(`[${timestamp}] PAYLOAD: ${JSON.stringify(args)}`);

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
            const params = ForecastParamsSchema.parse(args);
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
        console.error(`[${timestamp}] TOOL ${name} completed (${responseText.length} chars)`);

        return { content: [{ type: 'text', text: responseText }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[${timestamp}] TOOL ${name} FAILED: ${message}`);
        return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
      }
    });

    return server;
  }

  private getSession(sessionId: string): { server: Server; transport: StreamableHTTPServerTransport } | undefined {
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
          console.error(`Session ${id.substring(0, 8)}... expired and cleaned up.`);
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
          ? acceptHeader.split(',').map((value) => value.trim()).filter(Boolean)
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
        try {
          // Log ALL incoming requests with full details
          const method = req.body?.method || 'unknown';
          const timestamp = new Date().toISOString();
          console.error(`\n[${timestamp}] ========================================`);
          console.error(`[${timestamp}] 📨 INCOMING REQUEST`);
          console.error(`[${timestamp}] Method: ${method}`);
          console.error(`[${timestamp}] Full Request Body:`, JSON.stringify(req.body, null, 2));

          // Extract session ID from headers
          const sessionId = (req.headers['mcp-session-id'] ||
            req.headers['Mcp-Session-Id']) as string | undefined;
          console.error(`[${timestamp}] Session ID: ${sessionId || 'NONE'}`);

          // If no session ID and it's an initialize request, create a new session
          if (!sessionId && req.body?.method === 'initialize') {
            console.error(`[${timestamp}] [Request] Initialize request received, creating new session`);

            if (this.sessionServers.size >= OpenMeteoMCPServer.MAX_SESSIONS) {
              console.error(`[${timestamp}] ❌ Session limit reached (${OpenMeteoMCPServer.MAX_SESSIONS}), rejecting new session`);
              res.status(503).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: 'Server at session capacity, try again later' },
                id: req.body?.id || null
              });
              console.error(`[${timestamp}] ========================================\n`);
              return;
            }

            // Generate a new session ID
            const newSessionId = sessionIdGenerator();

            // Create server and transport for this new session
            const server = this.createServer();
            const transport = new StreamableHTTPServerTransport({
              enableJsonResponse: true,
              sessionIdGenerator: () => newSessionId,
            });

            server.oninitialized = () => {
              console.error(`New MCP server session ${newSessionId.substring(0, 8)}... initialized.`);
            };

            server.onclose = () => {
              this.sessionServers.delete(newSessionId);
              console.error(`Session ${newSessionId.substring(0, 8)}... closed and cleaned up.`);
            };

            await server.connect(transport as Transport);

            this.sessionServers.set(newSessionId, { server, transport, lastActivity: Date.now() });

            // Set session ID in response header before handling request
            res.setHeader('mcp-session-id', newSessionId);

            // Handle the initialize request
            await transport.handleRequest(req, res, req.body);
            console.error(`[${timestamp}] ========================================\n`);
            return;
          }

          if (sessionId) {
            console.error(`[${timestamp}] [Session ${sessionId.substring(0, 8)}...] Handling request - Method: ${method}`);

            // Special logging for tools/call requests
            if (method === 'tools/call') {
              const toolName = req.body?.params?.name || 'unknown';
              const toolArgs = req.body?.params?.arguments || {};
              console.error(`[${timestamp}] 🔧 TOOL CALL REQUEST DETECTED`);
              console.error(`[${timestamp}] 🔧 Tool Name: ${toolName}`);
              console.error(`[${timestamp}] 📥 Tool Arguments:`, JSON.stringify(toolArgs, null, 2));
            }

            const session = this.getSession(sessionId);
            if (!session) {
              console.error(`[${timestamp}] ❌ Unknown session ID: ${sessionId.substring(0, 8)}...`);
              res.status(404).json({
                jsonrpc: '2.0',
                error: { code: -32600, message: 'Session not found' },
                id: req.body?.id || null
              });
              console.error(`[${timestamp}] ========================================\n`);
              return;
            }
            const { transport } = session;
            await transport.handleRequest(req, res, req.body);

            if (method === 'tools/call') {
              console.error(`[${timestamp}] ✅ Tool call request handled`);
            }
            console.error(`[${timestamp}] ========================================\n`);
          } else {
            // No session ID and not an initialize request - error
            console.error(`[${timestamp}] ❌ ERROR: No session ID for non-initialize request`);
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Session ID required for non-initialize requests'
              },
              id: req.body?.id || null
            });
            console.error(`[${timestamp}] ========================================\n`);
          }
        } catch (err) {
          const timestamp = new Date().toISOString();
          console.error(`[${timestamp}] ❌ Request handling error:`, err);

          const errorMessage = err instanceof Error ? err.message : String(err);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error: ' + errorMessage
            },
            id: req.body?.id || null
          });
          console.error(`[${timestamp}] ========================================\n`);
        }
      });

      const port = parseInt(process.env.PORT || '3000', 10);
      app.listen(port, () => {
        console.error(`✅ Open-Meteo MCP HTTP Server running on http://localhost:${port}/mcp`);
      }).on('error', (err) => {
        console.error('HTTP server error:', err);
        process.exit(1);
      });
    } else {
      // For stdio mode, create a single server instance
      const server = this.createServer();
      const transport = new StdioServerTransport();
      server.oninitialized = () => {
        console.error("✅ MCP server initialized and ready (stdio).");
      };
      await server.connect(transport as Transport);
      console.error('✅ Open-Meteo MCP Server running on stdio');
    }
  }




}

const server = new OpenMeteoMCPServer();
server.run().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
