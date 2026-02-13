# Open-Meteo MCP Server

[![npm version](https://badge.fury.io/js/open-meteo-mcp-server.svg)](https://badge.fury.io/js/open-meteo-mcp-server)
[![GitHub release](https://img.shields.io/github/release/cmer81/open-meteo-mcp.svg)](https://github.com/cmer81/open-meteo-mcp/releases)

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides access to Open-Meteo weather APIs for use with Large Language Models.

## Features

This MCP server provides complete access to Open-Meteo APIs, including:

### Core Weather APIs
- **Weather Forecast** (`weather_forecast`) - 7-day forecasts with hourly and daily resolution
- **Weather Archive** (`weather_archive`) - Historical ERA5 data from 1940 to present
- **Air Quality** (`air_quality`) - PM2.5, PM10, ozone, nitrogen dioxide and other pollutants
- **Marine Weather** (`marine_weather`) - Wave height, wave period, wave direction and sea surface temperature
- **Elevation** (`elevation`) - Digital elevation model data for given coordinates
- **Geocoding** (`geocoding`) - Search locations worldwide by name or postal code, get coordinates and detailed location information

### Specialized Weather Models
- **DWD ICON** (`dwd_icon_forecast`) - German weather service high-resolution model for Europe
- **NOAA GFS** (`gfs_forecast`) - US weather service global model with high-resolution North America data
- **Météo-France** (`meteofrance_forecast`) - French weather service AROME and ARPEGE models
- **ECMWF** (`ecmwf_forecast`) - European Centre for Medium-Range Weather Forecasts
- **JMA** (`jma_forecast`) - Japan Meteorological Agency high-resolution model for Asia
- **MET Norway** (`metno_forecast`) - Norwegian weather service for Nordic countries
- **Environment Canada GEM** (`gem_forecast`) - Canadian weather service model

### Advanced Forecasting Tools
- **Flood Forecast** (`flood_forecast`) - River discharge and flood forecasts from GloFAS (Global Flood Awareness System)
- **Seasonal Forecast** (`seasonal_forecast`) - Long-range forecasts up to 9 months ahead
- **Climate Projections** (`climate_projection`) - CMIP6 climate change projections for different warming scenarios
- **Ensemble Forecast** (`ensemble_forecast`) - Multiple model runs showing forecast uncertainty

## Installation

### Requirements

- Node.js >= 22.0.0

### Method 1: Using npx (Recommended)

No installation required! The server will run directly via npx.

### Method 2: Global Installation via npm

```bash
npm install -g open-meteo-mcp-server
```

### Method 3: From Source (Development)

```bash
# Clone the repository
git clone https://github.com/cmer81/open-meteo-mcp.git
cd open-meteo-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Claude Desktop Configuration

#### Simple Configuration (Recommended)

Add the following configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "npx",
      "args": ["open-meteo-mcp-server"]
    }
  }
}
```

#### Full Configuration (with environment variables)

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "npx",
      "args": ["open-meteo-mcp-server"],
      "env": {
        "OPEN_METEO_API_URL": "https://api.open-meteo.com",
        "OPEN_METEO_AIR_QUALITY_API_URL": "https://air-quality-api.open-meteo.com",
        "OPEN_METEO_MARINE_API_URL": "https://marine-api.open-meteo.com",
        "OPEN_METEO_ARCHIVE_API_URL": "https://archive-api.open-meteo.com",
        "OPEN_METEO_SEASONAL_API_URL": "https://seasonal-api.open-meteo.com",
        "OPEN_METEO_ENSEMBLE_API_URL": "https://ensemble-api.open-meteo.com",
        "OPEN_METEO_GEOCODING_API_URL": "https://geocoding-api.open-meteo.com",
        "OPEN_METEO_FLOOD_API_URL": "https://flood-api.open-meteo.com"
      }
    }
  }
}
```

#### Local Development Configuration

If you're developing locally or installed from source:

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "node",
      "args": ["/path/to/open-meteo-mcp/dist/index.js"],
      "env": {
        "OPEN_METEO_API_URL": "https://api.open-meteo.com",
        "OPEN_METEO_AIR_QUALITY_API_URL": "https://air-quality-api.open-meteo.com",
        "OPEN_METEO_MARINE_API_URL": "https://marine-api.open-meteo.com",
        "OPEN_METEO_ARCHIVE_API_URL": "https://archive-api.open-meteo.com",
        "OPEN_METEO_SEASONAL_API_URL": "https://seasonal-api.open-meteo.com",
        "OPEN_METEO_ENSEMBLE_API_URL": "https://ensemble-api.open-meteo.com",
        "OPEN_METEO_GEOCODING_API_URL": "https://geocoding-api.open-meteo.com",
        "OPEN_METEO_FLOOD_API_URL": "https://flood-api.open-meteo.com"
      }
    }
  }
}
```

### Custom Instance Configuration

If you're using your own Open-Meteo instance:

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "npx",
      "args": ["open-meteo-mcp-server"],
      "env": {
        "OPEN_METEO_API_URL": "https://your-meteo-api.example.com",
        "OPEN_METEO_AIR_QUALITY_API_URL": "https://air-quality-api.example.com",
        "OPEN_METEO_MARINE_API_URL": "https://marine-api.example.com",
        "OPEN_METEO_ARCHIVE_API_URL": "https://archive-api.example.com",
        "OPEN_METEO_SEASONAL_API_URL": "https://seasonal-api.example.com",
        "OPEN_METEO_ENSEMBLE_API_URL": "https://ensemble-api.example.com",
        "OPEN_METEO_GEOCODING_API_URL": "https://geocoding-api.example.com",
        "OPEN_METEO_FLOOD_API_URL": "https://flood-api.example.com"
      }
    }
  }
}
```

### Streamable HTTP Transport

The server also supports Streamable HTTP transport for remote deployments. Set the `TRANSPORT` environment variable to `http`:

```bash
TRANSPORT=http PORT=3000 npx open-meteo-mcp-server
```

This starts an Express server on the specified port (default: 3000) with the MCP endpoint at `/mcp`. The HTTP transport supports session management with unique session IDs per client.

### Environment Variables

All environment variables are optional and have sensible defaults:

- `OPEN_METEO_API_URL` - Base URL for Open-Meteo forecast API (default: https://api.open-meteo.com)
- `OPEN_METEO_AIR_QUALITY_API_URL` - Air quality API URL (default: https://air-quality-api.open-meteo.com)
- `OPEN_METEO_MARINE_API_URL` - Marine weather API URL (default: https://marine-api.open-meteo.com)
- `OPEN_METEO_ARCHIVE_API_URL` - Historical data API URL (default: https://archive-api.open-meteo.com)
- `OPEN_METEO_SEASONAL_API_URL` - Seasonal forecast API URL (default: https://seasonal-api.open-meteo.com)
- `OPEN_METEO_ENSEMBLE_API_URL` - Ensemble forecast API URL (default: https://ensemble-api.open-meteo.com)
- `OPEN_METEO_GEOCODING_API_URL` - Geocoding API URL (default: https://geocoding-api.open-meteo.com)
- `OPEN_METEO_FLOOD_API_URL` - Flood forecast API URL (default: https://flood-api.open-meteo.com)
- `TRANSPORT` - Transport mode: `http` for Streamable HTTP, omit for stdio (default: stdio)
- `PORT` - HTTP server port when using HTTP transport (default: 3000)

## Usage Examples

### Geocoding and Location Search
```
Find the coordinates for Paris, France
```

```
Search for locations named "Berlin" and return the top 5 results
```

```
What are the coordinates for postal code 75001?
```

```
Search for "Lyon" in France only (countryCode: FR) with results in French (language: fr)
```

```
Find all cities named "London" in the United Kingdom with English descriptions
```

### Basic Weather Forecast
```
Can you get me the weather forecast for Paris (48.8566, 2.3522) with temperature, humidity, and precipitation for the next 3 days?
```

### Historical Weather Data
```
What were the temperatures in London during January 2023?
```

### Air Quality Monitoring
```
What's the current air quality in Beijing with PM2.5 and ozone levels?
```

### Marine Weather
```
Get me the wave height and sea surface temperature for coordinates 45.0, -125.0 for the next 5 days.
```

### Flood Monitoring
```
Check the river discharge forecast for coordinates 52.5, 13.4 for the next 30 days.
```

### Climate Projections
```
Show me temperature projections for New York from 2050 to 2070 using CMIP6 models.
```

## API Parameters

### Required Parameters
- `latitude` : Latitude in WGS84 coordinate system (-90 to 90)
- `longitude` : Longitude in WGS84 coordinate system (-180 to 180)

### Hourly Weather Variables
- `temperature_2m` : Temperature at 2 meters
- `relative_humidity_2m` : Relative humidity
- `precipitation` : Precipitation
- `wind_speed_10m` : Wind speed at 10 meters
- `wind_direction_10m` : Wind direction
- `pressure_msl` : Mean sea level pressure
- `cloud_cover` : Cloud cover percentage
- `weather_code` : Weather condition code
- `visibility` : Visibility
- `uv_index` : UV index
- And many more...

### Daily Weather Variables
- `temperature_2m_max/min` : Maximum/minimum temperatures
- `precipitation_sum` : Total precipitation
- `wind_speed_10m_max` : Maximum wind speed
- `sunrise/sunset` : Sunrise and sunset times
- `weather_code` : Weather condition code
- `uv_index_max` : Maximum UV index

### Air Quality Variables
- `pm10` : PM10 particles
- `pm2_5` : PM2.5 particles
- `carbon_monoxide` : Carbon monoxide
- `nitrogen_dioxide` : Nitrogen dioxide
- `ozone` : Ozone
- `sulphur_dioxide` : Sulfur dioxide
- `ammonia` : Ammonia
- `dust` : Dust particles

### Marine Weather Variables
- `wave_height` : Wave height
- `wave_direction` : Wave direction
- `wave_period` : Wave period
- `wind_wave_height` : Wind wave height
- `swell_wave_height` : Swell wave height
- `sea_surface_temperature` : Sea surface temperature

### Formatting Options
- `temperature_unit` : `celsius`, `fahrenheit`
- `wind_speed_unit` : `kmh`, `ms`, `mph`, `kn`
- `precipitation_unit` : `mm`, `inch`
- `timezone` : `Europe/Paris`, `America/New_York`, etc.

### Time Range Options
- `forecast_days` : Number of forecast days (varies by API)
- `past_days` : Include past days data
- `start_date` / `end_date` : Date range for historical data (YYYY-MM-DD format)

## Development Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Project Structure

```
src/
├── index.ts          # MCP server entry point
├── client.ts         # HTTP client for Open-Meteo API
├── tools.ts          # MCP tool definitions
└── types.ts          # Zod validation schemas
```

## API Coverage

This server provides access to all major Open-Meteo endpoints:

### Weather Data
- Current weather conditions
- Hourly forecasts (up to 16 days)
- Daily forecasts (up to 16 days)
- Historical weather data (1940-present)

### Specialized Models
- High-resolution regional models (DWD ICON, Météo-France AROME)
- Global models (NOAA GFS, ECMWF)
- Regional specialists (JMA for Asia, MET Norway for Nordics)

### Environmental Data
- Air quality forecasts
- Marine and ocean conditions
- River discharge and flood warnings
- Climate change projections

### Advanced Features
- Ensemble forecasts for uncertainty quantification
- Seasonal forecasts for long-term planning
- Multiple model comparison
- Customizable units and timezones

## Error Handling

The server provides comprehensive error handling with detailed error messages for:
- Invalid coordinates
- Missing required parameters
- API rate limits
- Network connectivity issues
- Invalid date ranges

## Performance

- Efficient HTTP client with connection pooling
- Request caching for repeated queries
- Optimized data serialization
- Minimal memory footprint

## API Documentation

For detailed API documentation, refer to the `openapi.yml` file and the [Open-Meteo API documentation](https://open-meteo.com/en/docs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/open-meteo-mcp.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`
5. Make your changes and add tests
6. Run tests: `npm test`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Releasing

This project uses automated releases via GitHub Actions. To create a new release:

```bash
# For a patch release (1.0.0 -> 1.0.1)
npm run release:patch

# For a minor release (1.0.0 -> 1.1.0)
npm run release:minor

# For a major release (1.0.0 -> 2.0.0)
npm run release:major
```

The GitHub Action will automatically:
- Run tests and build the project
- Publish to npm with provenance
- Create a GitHub release
- Update version badges

## License

MIT