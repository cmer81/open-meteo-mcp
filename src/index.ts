#!/usr/bin/env node

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

  async run() {
    const useHttp = process.env.TRANSPORT === 'http';

    if (useHttp) {
      // HTTP transport mode
      const app = express();
      app.use(express.json());

      app.post('/mcp', async (req, res) => {
        const transport = new StreamableHTTPServerTransport({
          enableJsonResponse: true,
        });

        res.on('close', () => {
          transport.close();
        });

        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      });

      const port = parseInt(process.env.PORT || '3000', 10);
      app.listen(port, () => {
        console.log(`Open-Meteo MCP HTTP Server running on http://0.0.0.0:${port}/mcp`);
      }).on('error', (err) => {
        console.error('HTTP server error:', err);
        process.exit(1);
      });
    } else {
      // STDIO transport fallback
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Open-Meteo MCP Server running on stdio');
    }
  }
}

const server = new OpenMeteoMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
