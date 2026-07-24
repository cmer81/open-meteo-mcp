import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

// Tool metadata only — input schemas come from the Zod schemas in types.js,
// passed directly to McpServer#registerTool as the single source of truth
// (previously this file also hand-duplicated the input JSON schema, which
// could drift from the Zod validation schemas).
export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  annotations: ToolAnnotations;
}

// All 17 tools are pure read-only queries against Open-Meteo endpoints.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const WEATHER_FORECAST_TOOL: ToolDefinition = {
  name: 'weather_forecast',
  title: 'Weather Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast data for coordinates using Open-Meteo API. Supports hourly and daily data with various weather variables. When no `models` parameter is provided, the API automatically selects the best model for the given location (recommended). Only one model per request is supported — for multi-model comparison, use provider-specific tools with parallel calls.',
};

export const WEATHER_ARCHIVE_TOOL: ToolDefinition = {
  name: 'weather_archive',
  title: 'Weather Archive (Historical)',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get historical weather data from ERA5 reanalysis (1940-present) for specific coordinates and date range.',
};

export const AIR_QUALITY_TOOL: ToolDefinition = {
  name: 'air_quality',
  title: 'Air Quality',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get air quality forecast data including PM2.5, PM10, ozone, nitrogen dioxide, pollen, European/US AQI indices, UV index and other pollutants.',
};

export const MARINE_WEATHER_TOOL: ToolDefinition = {
  name: 'marine_weather',
  title: 'Marine Weather',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get marine weather forecast including wave height, wave period, wave direction and sea surface temperature.',
};

export const ELEVATION_TOOL: ToolDefinition = {
  name: 'elevation',
  title: 'Elevation',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get elevation data for given coordinates using digital elevation models. Supports batch lookups: pass arrays of the same length for latitude and longitude to query multiple points in one call.',
};

export const FLOOD_FORECAST_TOOL: ToolDefinition = {
  name: 'flood_forecast',
  title: 'Flood Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get river discharge and flood forecasts from GloFAS (Global Flood Awareness System).',
};

export const SEASONAL_FORECAST_TOOL: ToolDefinition = {
  name: 'seasonal_forecast',
  title: 'Seasonal Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get long-range seasonal forecasts for temperature and precipitation up to ~7 months ahead.',
};

export const CLIMATE_PROJECTION_TOOL: ToolDefinition = {
  name: 'climate_projection',
  title: 'Climate Projection',
  annotations: READ_ONLY_ANNOTATIONS,
  description: 'Get climate change projections from CMIP6 models for different warming scenarios.',
};

export const ENSEMBLE_FORECAST_TOOL: ToolDefinition = {
  name: 'ensemble_forecast',
  title: 'Ensemble Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description: 'Get ensemble forecasts showing forecast uncertainty with multiple model runs.',
};

export const GEOCODING_TOOL: ToolDefinition = {
  name: 'geocoding',
  title: 'Geocoding',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Search for locations worldwide by place name or postal code. Returns geographic coordinates (latitude and longitude) and detailed location information. Use this tool when you need to convert a location name (e.g., "Paris", "New York") into precise coordinates (latitude/longitude) that are required by other tools. This is essential when you have a location name but need coordinates for data fetching tools.',
};

export const DWD_ICON_FORECAST_TOOL: ToolDefinition = {
  name: 'dwd_icon_forecast',
  title: 'DWD ICON Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from German DWD ICON model. IMPORTANT: Specify exactly one DWD model in the `models` parameter (e.g., "dwd_icon_global") — only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const GFS_FORECAST_TOOL: ToolDefinition = {
  name: 'gfs_forecast',
  title: 'GFS Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from US NOAA GFS model. IMPORTANT: Specify exactly one GFS model in the `models` parameter (e.g., "ncep_gfs_global") — only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const METEOFRANCE_FORECAST_TOOL: ToolDefinition = {
  name: 'meteofrance_forecast',
  title: 'Météo-France Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from French Météo-France models. IMPORTANT: Specify exactly one Météo-France model in the `models` parameter (e.g., "meteofrance_arome_france" or "meteofrance_arpege_europe") — only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const ECMWF_FORECAST_TOOL: ToolDefinition = {
  name: 'ecmwf_forecast',
  title: 'ECMWF Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from ECMWF models via the dedicated /v1/ecmwf endpoint. IMPORTANT: Specify exactly one model in the `models` parameter — only one model per request is supported. Valid model IDs for this endpoint are: "ecmwf_ifs" (IFS HRES, high-resolution), "ecmwf_ifs025" (IFS open-data at 0.25°), "best_match". Note: "ecmwf_ifs_025", "ecmwf_ifs_hres_9km", and "ecmwf_aifs_025_single" are NOT valid on this endpoint and will return 400. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const JMA_FORECAST_TOOL: ToolDefinition = {
  name: 'jma_forecast',
  title: 'JMA Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from Japan Meteorological Agency (JMA) models. IMPORTANT: Specify exactly one JMA model in the `models` parameter (e.g., "jma_msm" or "jma_gsm") — only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const METNO_FORECAST_TOOL: ToolDefinition = {
  name: 'metno_forecast',
  title: 'MET Norway Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from Norwegian Meteorological Institute models. The `models` parameter is optional for this tool — omit it to use the default Met.no model. If specified, use canonical names such as "metno_nordic" or "metno_seamless". Only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const GEM_FORECAST_TOOL: ToolDefinition = {
  name: 'gem_forecast',
  title: 'GEM Forecast',
  annotations: READ_ONLY_ANNOTATIONS,
  description:
    'Get weather forecast from Canadian Meteorological Centre (GEM) models. IMPORTANT: Specify exactly one GEM model in the `models` parameter (e.g., "gem_global" or "gem_regional") — only one model per request is supported. For multi-model comparison, make one parallel tool call per model using the appropriate provider-specific tool.',
};

export const ALL_TOOLS: ToolDefinition[] = [
  WEATHER_FORECAST_TOOL,
  WEATHER_ARCHIVE_TOOL,
  AIR_QUALITY_TOOL,
  MARINE_WEATHER_TOOL,
  ELEVATION_TOOL,
  FLOOD_FORECAST_TOOL,
  SEASONAL_FORECAST_TOOL,
  CLIMATE_PROJECTION_TOOL,
  ENSEMBLE_FORECAST_TOOL,
  GEOCODING_TOOL,
  DWD_ICON_FORECAST_TOOL,
  GFS_FORECAST_TOOL,
  METEOFRANCE_FORECAST_TOOL,
  ECMWF_FORECAST_TOOL,
  JMA_FORECAST_TOOL,
  METNO_FORECAST_TOOL,
  GEM_FORECAST_TOOL,
];
