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

    const baseURL = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com';
    this.client = new OpenMeteoClient(baseURL);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: ALL_TOOLS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

      const transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true,
        sessionIdGenerator: () => Math.random().toString(36).substring(2),
      });

      // Optional log when initialized
      this.server.oninitialized = () => {
        console.log("✅ MCP server initialized and ready.");
      };

      // Connect (this implicitly initializes)
      await this.server.connect(transport);

      app.post('/mcp', async (req, res) => {
        try {
          await transport.handleRequest(req, res, req.body);
        } catch (err) {
          console.error('Request handling error:', err);
          res.status(500).json({ error: 'Internal server error' });
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
      const transport = new StdioServerTransport();
      this.server.oninitialized = () => {
        console.log("✅ MCP server initialized and ready (stdio).");
      };
      await this.server.connect(transport);
      console.error('✅ Open-Meteo MCP Server running on stdio');
    }
  }




}

const server = new OpenMeteoMCPServer();
server.run().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
