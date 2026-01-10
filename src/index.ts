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
} from './types.js';

class OpenMeteoMCPServer {
  private client: OpenMeteoClient;
  private sessionServers: Map<string, { server: Server; transport: StreamableHTTPServerTransport }> = new Map();

  constructor() {
    const baseURL = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com';
    this.client = new OpenMeteoClient(baseURL);
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: 'open-meteo-mcp-server',
        version: '1.0.0',
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

      // Log tool call with payload - VERY VISIBLE
      console.log(`\n[${timestamp}] ========================================`);
      console.log(`[${timestamp}] 🔧 TOOL CALLED: ${name}`);
      console.log(`[${timestamp}] 📥 PAYLOAD RECEIVED:`);
      console.log(JSON.stringify(args, null, 2));
      console.log(`[${timestamp}] Processing tool execution...`);

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
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        const responseText = JSON.stringify(result, null, 2);
        // Log response (truncated if too long)
        const responsePreview = responseText.length > 500
          ? responseText.substring(0, 500) + '... [truncated]'
          : responseText;
        console.log(`[${timestamp}] 📤 RESPONSE SENT:`);
        console.log(responsePreview);
        if (responseText.length > 500) {
          console.log(`[${timestamp}] (Full response length: ${responseText.length} characters, truncated for display)`);
        }
        console.log(`[${timestamp}] ✅ TOOL ${name} COMPLETED SUCCESSFULLY`);
        console.log(`[${timestamp}] ========================================\n`);

        return { content: [{ type: 'text', text: responseText }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[${timestamp}] ❌ TOOL ${name} FAILED:`, message);
        if (err instanceof Error && err.stack) {
          console.error(`[${timestamp}] Stack trace:`, err.stack);
        }
        console.log(`[${timestamp}] ========================================\n`);
        return { content: [{ type: 'text', text: `Error: ${message}` }] };
      }
    });

    return server;
  }

  private async getOrCreateSession(sessionId: string): Promise<{ server: Server; transport: StreamableHTTPServerTransport }> {
    if (this.sessionServers.has(sessionId)) {
      return this.sessionServers.get(sessionId)!;
    }

    // Create new server and transport for this session
    const server = this.createServer();
    const sessionIdGenerator = () => sessionId;

    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: sessionIdGenerator,
    });

    server.oninitialized = () => {
      console.log(`✅ MCP server session ${sessionId.substring(0, 8)}... initialized and ready.`);
    };

    await server.connect(transport as Transport);

    this.sessionServers.set(sessionId, { server, transport });
    return { server, transport };
  }

  async run() {
    const useHttp = process.env.TRANSPORT === 'http';

    if (useHttp) {
      const app = express();
      app.use(express.json());

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
          console.log(`\n[${timestamp}] ========================================`);
          console.log(`[${timestamp}] 📨 INCOMING REQUEST`);
          console.log(`[${timestamp}] Method: ${method}`);
          console.log(`[${timestamp}] Full Request Body:`, JSON.stringify(req.body, null, 2));

          // Extract session ID from headers
          const sessionId = (req.headers['mcp-session-id'] ||
            req.headers['Mcp-Session-Id']) as string | undefined;
          console.log(`[${timestamp}] Session ID: ${sessionId || 'NONE'}`);

          // If no session ID and it's an initialize request, create a new session
          if (!sessionId && req.body?.method === 'initialize') {
            console.log(`[${timestamp}] [Request] Initialize request received, creating new session`);
            // Generate a new session ID
            const newSessionId = sessionIdGenerator();

            // Create server and transport for this new session
            const server = this.createServer();
            const transport = new StreamableHTTPServerTransport({
              enableJsonResponse: true,
              sessionIdGenerator: () => newSessionId, // Always return the same ID for this session
            });

            server.oninitialized = () => {
              console.log(`✅ New MCP server session ${newSessionId.substring(0, 8)}... initialized.`);
            };

            await server.connect(transport as Transport);

            // Store the session
            this.sessionServers.set(newSessionId, { server, transport });

            // Set session ID in response header before handling request
            res.setHeader('mcp-session-id', newSessionId);

            // Handle the initialize request
            await transport.handleRequest(req, res, req.body);
            console.log(`[${timestamp}] ========================================\n`);
            return;
          }

          if (sessionId) {
            console.log(`[${timestamp}] [Session ${sessionId.substring(0, 8)}...] Handling request - Method: ${method}`);

            // Special logging for tools/call requests
            if (method === 'tools/call') {
              const toolName = req.body?.params?.name || 'unknown';
              const toolArgs = req.body?.params?.arguments || {};
              console.log(`[${timestamp}] 🔧 TOOL CALL REQUEST DETECTED`);
              console.log(`[${timestamp}] 🔧 Tool Name: ${toolName}`);
              console.log(`[${timestamp}] 📥 Tool Arguments:`, JSON.stringify(toolArgs, null, 2));
            }

            // Get or create session (should already exist if sessionId is provided)
            const { transport } = await this.getOrCreateSession(sessionId);
            await transport.handleRequest(req, res, req.body);

            if (method === 'tools/call') {
              console.log(`[${timestamp}] ✅ Tool call request handled`);
            }
            console.log(`[${timestamp}] ========================================\n`);
          } else {
            // No session ID and not an initialize request - error
            console.log(`[${timestamp}] ❌ ERROR: No session ID for non-initialize request`);
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Session ID required for non-initialize requests'
              },
              id: req.body?.id || null
            });
            console.log(`[${timestamp}] ========================================\n`);
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
          console.log(`[${timestamp}] ========================================\n`);
        }
      });

      const port = parseInt(process.env.PORT || '3000', 10);
      app.listen(port, () => {
        console.log(`✅ Open-Meteo MCP HTTP Server running on http://localhost:${port}/mcp`);
      }).on('error', (err) => {
        console.error('HTTP server error:', err);
        process.exit(1);
      });
    } else {
      // For stdio mode, create a single server instance
      const server = this.createServer();
      const transport = new StdioServerTransport();
      server.oninitialized = () => {
        console.log("✅ MCP server initialized and ready (stdio).");
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
