#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
      try {
        switch (name) {
          case 'weather_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getForecast(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'weather_archive': {
            const params = ArchiveParamsSchema.parse(args);
            const result = await this.client.getArchive(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'air_quality': {
            const params = AirQualityParamsSchema.parse(args);
            const result = await this.client.getAirQuality(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'marine_weather': {
            const params = MarineParamsSchema.parse(args);
            const result = await this.client.getMarine(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'elevation': {
            const params = ElevationParamsSchema.parse(args);
            const result = await this.client.getElevation(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'flood_forecast': {
            const params = FloodParamsSchema.parse(args);
            const result = await this.client.getFlood(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          case 'geocoding': {
            const params = GeocodingParamsSchema.parse(args);
            const result = await this.client.getGeocoding(params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
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

    await server.connect(transport);
    
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
          // Extract session ID from headers
          let sessionId = (req.headers['mcp-session-id'] || 
                          req.headers['Mcp-Session-Id']) as string | undefined;
          
          // If no session ID and it's an initialize request, create a new session
          if (!sessionId && req.body?.method === 'initialize') {
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
            
            await server.connect(transport);
            
            // Store the session
            this.sessionServers.set(newSessionId, { server, transport });
            
            // Set session ID in response header before handling request
            res.setHeader('mcp-session-id', newSessionId);
            
            // Handle the initialize request
            await transport.handleRequest(req, res, req.body);
            return;
          }
          
          if (sessionId) {
            console.log(`[Session ${sessionId.substring(0, 8)}...] Handling request`);
            // Get or create session (should already exist if sessionId is provided)
            const { transport } = await this.getOrCreateSession(sessionId);
            await transport.handleRequest(req, res, req.body);
          } else {
            // No session ID and not an initialize request - error
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32600,
                message: 'Invalid Request: Session ID required for non-initialize requests'
              },
              id: req.body?.id || null
            });
          }
        } catch (err) {
          console.error('Request handling error:', err);
          
          const errorMessage = err instanceof Error ? err.message : String(err);
          res.status(500).json({ 
            jsonrpc: '2.0',
            error: { 
              code: -32603, 
              message: 'Internal error: ' + errorMessage 
            },
            id: req.body?.id || null
          });
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
      await server.connect(transport);
      console.error('✅ Open-Meteo MCP Server running on stdio');
    }
  }




}

const server = new OpenMeteoMCPServer();
server.run().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
