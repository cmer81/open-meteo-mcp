#!/usr/bin/env node
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import express from 'express';
import type { z } from 'zod';
import { OpenMeteoClient } from './client.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import {
  createAcceptNormalizer,
  createAuthMiddleware,
  createOriginValidator,
  createRateLimiter,
  getClientIp,
  sanitizeErrorMessage,
} from './security.js';
import {
  AIR_QUALITY_TOOL,
  CLIMATE_PROJECTION_TOOL,
  DWD_ICON_FORECAST_TOOL,
  ECMWF_FORECAST_TOOL,
  ELEVATION_TOOL,
  ENSEMBLE_FORECAST_TOOL,
  FLOOD_FORECAST_TOOL,
  GEM_FORECAST_TOOL,
  GEOCODING_TOOL,
  GFS_FORECAST_TOOL,
  JMA_FORECAST_TOOL,
  MARINE_WEATHER_TOOL,
  METEOFRANCE_FORECAST_TOOL,
  METNO_FORECAST_TOOL,
  SEASONAL_FORECAST_TOOL,
  type ToolDefinition,
  WEATHER_ARCHIVE_TOOL,
  WEATHER_FORECAST_TOOL,
} from './tools.js';
import { serializeToolResponse } from './truncation.js';
import {
  type AirQualityParams,
  AirQualityParamsSchema,
  type ArchiveParams,
  ArchiveParamsSchema,
  type ClimateParams,
  ClimateParamsSchema,
  type DwdIconParams,
  DwdIconParamsSchema,
  type EcmwfParams,
  EcmwfParamsSchema,
  type ElevationParams,
  ElevationParamsSchema,
  type EnsembleParams,
  EnsembleParamsSchema,
  type FloodParams,
  FloodParamsSchema,
  type ForecastParams,
  ForecastParamsSchema,
  type GemParams,
  GemParamsSchema,
  type GeocodingParams,
  GeocodingParamsSchema,
  type GfsParams,
  GfsParamsSchema,
  type JmaParams,
  JmaParamsSchema,
  type MarineParams,
  MarineParamsSchema,
  type MeteoFranceParams,
  MeteoFranceParamsSchema,
  type MetnoParams,
  MetnoParamsSchema,
  type SeasonalParams,
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

export class OpenMeteoMCPServer {
  private client: OpenMeteoClient;

  constructor() {
    const baseURL = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com';
    this.client = new OpenMeteoClient(baseURL, pkg.version);
  }

  // Registers a read-only tool: wires the Zod schema (validation + generated
  // JSON schema), and wraps the handler with logging, response truncation,
  // and MCP-style error results shared across all 17 tools.
  //
  // The schemas arrive here as a common `z.ZodTypeAny` rather than the concrete
  // per-tool types registerTool's generic overloads expect, so the call below
  // goes through an untyped signature; each call site's `handler` still gets a
  // precise, explicitly-annotated params type. Note this cast also silences the
  // SDK's compile-time check on `inputSchema` — see the ZodEffects handling
  // below for what that check would otherwise have caught.
  private registerReadOnlyTool(
    server: McpServer,
    meta: ToolDefinition,
    schema: z.ZodTypeAny,
    handler: (params: never) => Promise<unknown>,
  ): void {
    const registerToolUntyped = server.registerTool.bind(server) as (
      name: string,
      config: unknown,
      cb: unknown,
    ) => void;

    // Under Zod 3, `.refine()` wrapped the object in a ZodEffects the SDK could
    // not introspect: it published an empty `{}` input schema while still
    // validating strictly, leaving clients with no idea what to send. That
    // needed unwrapping via `.innerType()` before publication.
    //
    // Zod 4 attaches refinements to the object itself instead of wrapping it,
    // so the schema introspects correctly as-is and the workaround is gone.
    // `npm run smoke` asserts no tool publishes an empty schema, which is what
    // guards this.
    registerToolUntyped(
      meta.name,
      {
        title: meta.title,
        description: meta.description,
        inputSchema: schema,
        annotations: meta.annotations,
      },
      async (params: never) => {
        const start = Date.now();
        log('info', 'tool_call', { tool: meta.name, args: params });

        // The SDK now validates against the same schema before dispatching, so
        // this rarely rejects anything. It is kept because it is what applies
        // the schema's defaults (e.g. cell_selection) to the params the handler
        // receives, rather than relying on the SDK to hand back parsed data.
        const refined = schema.safeParse(params);
        if (!refined.success) {
          const message = refined.error.issues.map((issue) => issue.message).join('; ');
          log('error', 'tool_error', { tool: meta.name, error: message, duration_ms: 0 });
          return {
            content: [{ type: 'text' as const, text: `Error: ${message}` }],
            isError: true,
          };
        }

        try {
          const result = await handler(refined.data as never);
          const responseText = serializeToolResponse(result);
          log('info', 'tool_success', {
            tool: meta.name,
            response_size: responseText.length,
            duration_ms: Date.now() - start,
          });
          return { content: [{ type: 'text' as const, text: responseText }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          log('error', 'tool_error', {
            tool: meta.name,
            error: message,
            duration_ms: Date.now() - start,
          });
          return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
        }
      },
    );
  }

  private createServer(): McpServer {
    const server = new McpServer(
      {
        name: 'open-meteo-mcp-server',
        version: pkg.version,
      },
      {
        capabilities: {
          tools: {},
        },
        instructions: SERVER_INSTRUCTIONS,
      },
    );

    this.registerReadOnlyTool(
      server,
      WEATHER_FORECAST_TOOL,
      ForecastParamsSchema,
      (params: ForecastParams) => this.client.getForecast(params),
    );
    this.registerReadOnlyTool(
      server,
      WEATHER_ARCHIVE_TOOL,
      ArchiveParamsSchema,
      (params: ArchiveParams) => this.client.getArchive(params),
    );
    this.registerReadOnlyTool(
      server,
      AIR_QUALITY_TOOL,
      AirQualityParamsSchema,
      (params: AirQualityParams) => this.client.getAirQuality(params),
    );
    this.registerReadOnlyTool(
      server,
      MARINE_WEATHER_TOOL,
      MarineParamsSchema,
      (params: MarineParams) => this.client.getMarine(params),
    );
    this.registerReadOnlyTool(
      server,
      ELEVATION_TOOL,
      ElevationParamsSchema,
      (params: ElevationParams) => this.client.getElevation(params),
    );
    this.registerReadOnlyTool(
      server,
      FLOOD_FORECAST_TOOL,
      FloodParamsSchema,
      (params: FloodParams) => this.client.getFlood(params),
    );
    this.registerReadOnlyTool(
      server,
      GEOCODING_TOOL,
      GeocodingParamsSchema,
      (params: GeocodingParams) => this.client.getGeocoding(params),
    );
    this.registerReadOnlyTool(
      server,
      DWD_ICON_FORECAST_TOOL,
      DwdIconParamsSchema,
      (params: DwdIconParams) => this.client.getDwdIcon(params),
    );
    this.registerReadOnlyTool(server, GFS_FORECAST_TOOL, GfsParamsSchema, (params: GfsParams) =>
      this.client.getGfs(params),
    );
    this.registerReadOnlyTool(
      server,
      METEOFRANCE_FORECAST_TOOL,
      MeteoFranceParamsSchema,
      (params: MeteoFranceParams) => this.client.getMeteoFrance(params),
    );
    this.registerReadOnlyTool(
      server,
      ECMWF_FORECAST_TOOL,
      EcmwfParamsSchema,
      (params: EcmwfParams) => this.client.getEcmwf(params),
    );
    this.registerReadOnlyTool(server, JMA_FORECAST_TOOL, JmaParamsSchema, (params: JmaParams) =>
      this.client.getJma(params),
    );
    this.registerReadOnlyTool(
      server,
      METNO_FORECAST_TOOL,
      MetnoParamsSchema,
      (params: MetnoParams) => this.client.getMetno(params),
    );
    this.registerReadOnlyTool(server, GEM_FORECAST_TOOL, GemParamsSchema, (params: GemParams) =>
      this.client.getGem(params),
    );
    this.registerReadOnlyTool(
      server,
      SEASONAL_FORECAST_TOOL,
      SeasonalParamsSchema,
      (params: SeasonalParams) => this.client.getSeasonal(params),
    );
    this.registerReadOnlyTool(
      server,
      CLIMATE_PROJECTION_TOOL,
      ClimateParamsSchema,
      (params: ClimateParams) => this.client.getClimate(params),
    );
    this.registerReadOnlyTool(
      server,
      ENSEMBLE_FORECAST_TOOL,
      EnsembleParamsSchema,
      (params: EnsembleParams) => this.client.getEnsemble(params),
    );

    return server;
  }

  private buildExpressApp(): express.Application {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    app.use(createAcceptNormalizer());

    // Every guard below must be registered BEFORE the routes it protects:
    // Express runs middleware in declaration order, so anything mounted after a
    // route never runs for it. These three previously sat between the DELETE and
    // POST handlers, leaving GET and DELETE unauthenticated and unthrottled.
    app.use(createOriginValidator());
    app.use(createRateLimiter());
    app.use(createAuthMiddleware());

    // The HTTP transport is stateless: every POST gets a fresh McpServer and
    // transport, torn down when the response closes. No tool keeps state between
    // calls, so sessions bought nothing, and the session map was an exhaustion
    // target: one client could open the 100 allowed sessions and lock everyone
    // else out for an hour. A per-IP cap would not have fixed it either, since
    // every claude.ai user reaches the server from Anthropic's shared egress IPs.
    // Creating a server costs ~0.2 ms.
    //
    // Without sessions there is no server-to-client stream to open (GET) or
    // session to terminate (DELETE); the spec has stateless servers answer 405.
    const methodNotAllowed = (req: express.Request, res: express.Response) => {
      log('info', 'http_request', {
        method: req.method,
        remote_ip: getClientIp(req),
        user_agent: req.headers['user-agent'] ?? 'unknown',
      });
      res
        .status(405)
        .set('Allow', 'POST')
        .json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed: this server is stateless, use POST',
          },
          id: null,
        });
    };
    app.get('/mcp', methodNotAllowed);
    app.delete('/mcp', methodNotAllowed);

    app.post('/mcp', async (req, res) => {
      const remoteIp = getClientIp(req);
      log('info', 'http_request', {
        method: req.body?.method || 'unknown',
        remote_ip: remoteIp,
        user_agent: req.headers['user-agent'] ?? 'unknown',
      });

      const mcpServer = this.createServer();
      // No sessionIdGenerator: the transport runs stateless and issues no session ID.
      const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
      res.on('close', () => {
        transport.close().catch(() => {});
        mcpServer.close().catch(() => {});
      });

      try {
        await mcpServer.connect(transport as Transport);
        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        log('error', 'request_error', { error: errorMessage, remote_ip: remoteIp });
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: sanitizeErrorMessage(err) },
            id: req.body?.id ?? null,
          });
        }
      }
    });

    return app;
  }

  private startHttpTransport(): void {
    const app = this.buildExpressApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    // Loopback by default so a local server is not silently exposed on the LAN.
    // Container images set HOST=0.0.0.0 explicitly, since the container boundary
    // is what limits reachability there.
    const host = process.env.HOST || '127.0.0.1';
    app
      .listen(port, host, () => {
        log('info', 'server_start', { transport: 'http', host, port });
      })
      .on('error', (err) => {
        log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
      });
  }

  async run(): Promise<void> {
    const transport = process.env.TRANSPORT || 'stdio';

    if (transport === 'http') {
      this.startHttpTransport();
    } else {
      // For stdio mode, create a single server instance
      const mcpServer = this.createServer();
      const stdioTransport = new StdioServerTransport();
      mcpServer.server.oninitialized = () => {
        log('info', 'session_initialized', { transport: 'stdio' });
      };
      await mcpServer.connect(stdioTransport as Transport);
      log('info', 'server_start', { transport: 'stdio' });
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  const server = new OpenMeteoMCPServer();
  server.run().catch((err) => {
    log('error', 'server_error', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}
