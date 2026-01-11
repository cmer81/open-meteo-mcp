#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
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
  private server: Server;
  private client: OpenMeteoClient;

  constructor() {
    this.server = new Server(
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

    // Initialize with default Open-Meteo API URL, but allow override via environment
    const baseURL = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com';
    this.client = new OpenMeteoClient(baseURL);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_TOOLS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'weather_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getForecast(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'weather_archive': {
            const params = ArchiveParamsSchema.parse(args);
            const result = await this.client.getArchive(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'air_quality': {
            const params = AirQualityParamsSchema.parse(args);
            const result = await this.client.getAirQuality(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'marine_weather': {
            const params = MarineParamsSchema.parse(args);
            const result = await this.client.getMarine(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'elevation': {
            const params = ElevationParamsSchema.parse(args);
            const result = await this.client.getElevation(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'dwd_icon_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getDwdIcon(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gfs_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getGfs(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'meteofrance_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getMeteoFrance(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'ecmwf_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getEcmwf(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'jma_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getJma(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'metno_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getMetno(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gem_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getGem(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'flood_forecast': {
            const params = FloodParamsSchema.parse(args);
            const result = await this.client.getFlood(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'seasonal_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getSeasonal(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'climate_projection': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getClimate(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'ensemble_forecast': {
            const params = ForecastParamsSchema.parse(args);
            const result = await this.client.getEnsemble(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'geocoding': {
            const params = GeocodingParamsSchema.parse(args);
            const result = await this.client.getGeocoding(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  async runStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Open-Meteo MCP Server running on stdio');
  }

  async runHttp() {
    const host = process.env.MCP_HOST || '127.0.0.1';
    const port = parseInt(process.env.MCP_PORT || '3000', 10);

    // Create express app with MCP security middleware
    const app = createMcpExpressApp({ host });

    // Store active transports for session management
    const transports = new Map<string, StreamableHTTPServerTransport>();

    // Handle MCP requests at /mcp endpoint
    app.all('/mcp', async (req, res) => {
      // For new sessions, create a new transport
      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        // Reuse existing transport for this session
        transport = transports.get(sessionId)!;
      } else if (!sessionId && req.method === 'POST') {
        // New session - create transport with session ID generator
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        // Connect the server to this transport
        await this.server.connect(transport);

        // Store the transport after handling to get the session ID
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) {
            transports.delete(sid);
          }
        };

        // We'll store it after handling since sessionId is set during first request
        await transport.handleRequest(req, res, req.body);

        // Now store the transport with its session ID
        if (transport.sessionId) {
          transports.set(transport.sessionId, transport);
        }
        return;
      } else if (!sessionId && req.method === 'GET') {
        // SSE connection without session - create stateless transport
        transport = new StreamableHTTPServerTransport({});
        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        // Invalid request - session ID provided but not found
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid session ID',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    });

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', server: 'open-meteo-mcp-server' });
    });

    // Start the server
    app.listen(port, host, () => {
      console.error(`Open-Meteo MCP Server running on http://${host}:${port}/mcp`);
    });
  }

  async run() {
    const transport = process.env.MCP_TRANSPORT || 'stdio';

    if (transport === 'http') {
      await this.runHttp();
    } else {
      await this.runStdio();
    }
  }
}

const server = new OpenMeteoMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
