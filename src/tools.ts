import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const WEATHER_FORECAST_TOOL: Tool = {
  name: 'weather_forecast',
  description: 'Get weather forecast data for coordinates using Open-Meteo API. Supports hourly and daily data with various weather variables.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m', 'relative_humidity_2m', 'dewpoint_2m', 'apparent_temperature',
            'pressure_msl', 'surface_pressure', 'cloud_cover', 'wind_speed_10m', 'wind_direction_10m',
            'wind_gusts_10m', 'shortwave_radiation', 'precipitation', 'rain', 'snowfall',
            'precipitation_probability', 'weather_code', 'visibility', 'uv_index'
          ]
        },
        description: 'Hourly weather variables to retrieve'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max', 'apparent_temperature_min',
            'precipitation_sum', 'weather_code', 'sunrise', 'sunset', 'wind_speed_10m_max',
            'wind_gusts_10m_max', 'wind_direction_10m_dominant', 'shortwave_radiation_sum', 'uv_index_max'
          ]
        },
        description: 'Daily weather variables to retrieve'
      },
      current_weather: {
        type: 'boolean',
        description: 'Include current weather conditions'
      },
      temperature_unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius',
        description: 'Temperature unit'
      },
      wind_speed_unit: {
        type: 'string',
        enum: ['kmh', 'ms', 'mph', 'kn'],
        default: 'kmh',
        description: 'Wind speed unit'
      },
      precipitation_unit: {
        type: 'string',
        enum: ['mm', 'inch'],
        default: 'mm',
        description: 'Precipitation unit'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps (e.g., Europe/Paris, America/New_York)'
      },
      past_days: {
        type: 'integer',
        enum: [1, 2],
        description: 'Include past days data'
      },
      forecast_days: {
        type: 'integer',
        minimum: 1,
        maximum: 16,
        default: 7,
        description: 'Number of forecast days'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const WEATHER_ARCHIVE_TOOL: Tool = {
  name: 'weather_archive',
  description: 'Get historical weather data from ERA5 reanalysis (1940-present) for specific coordinates and date range.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      start_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'Start date in YYYY-MM-DD format'
      },
      end_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'End date in YYYY-MM-DD format'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m', 'relative_humidity_2m', 'precipitation', 'pressure_msl',
            'wind_speed_10m', 'wind_direction_10m', 'shortwave_radiation'
          ]
        },
        description: 'Hourly weather variables to retrieve'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
            'wind_speed_10m_max', 'shortwave_radiation_sum'
          ]
        },
        description: 'Daily weather variables to retrieve'
      },
      temperature_unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      }
    },
    required: ['latitude', 'longitude', 'start_date', 'end_date']
  }
};

export const AIR_QUALITY_TOOL: Tool = {
  name: 'air_quality',
  description: 'Get air quality forecast data including PM2.5, PM10, ozone, nitrogen dioxide and other pollutants.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone',
            'sulphur_dioxide', 'ammonia', 'dust', 'aerosol_optical_depth',
            'carbon_dioxide', 'methane'
          ]
        },
        description: 'Air quality variables to retrieve'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      },
      past_days: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
        description: 'Include past days data'
      },
      forecast_days: {
        type: 'integer',
        minimum: 1,
        maximum: 16,
        default: 7,
        description: 'Number of forecast days'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const MARINE_WEATHER_TOOL: Tool = {
  name: 'marine_weather',
  description: 'Get marine weather forecast including wave height, wave period, wave direction and sea surface temperature.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'wave_height', 'wave_direction', 'wave_period',
            'wind_wave_height', 'wind_wave_direction', 'wind_wave_period',
            'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
            'sea_surface_temperature'
          ]
        },
        description: 'Marine weather variables to retrieve'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'wave_height_max', 'wind_wave_height_max', 'swell_wave_height_max'
          ]
        },
        description: 'Daily marine weather variables to retrieve'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      },
      past_days: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
        description: 'Include past days data'
      },
      forecast_days: {
        type: 'integer',
        minimum: 1,
        maximum: 16,
        default: 7,
        description: 'Number of forecast days'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const ELEVATION_TOOL: Tool = {
  name: 'elevation',
  description: 'Get elevation data for given coordinates using digital elevation models.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const WEATHER_MODEL_TOOLS: Tool[] = [
  {
    name: 'dwd_icon_forecast',
    description: 'Get weather forecast from German DWD ICON model with high resolution data for Europe and global coverage.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'gfs_forecast',
    description: 'Get weather forecast from US NOAA GFS model with global coverage and high-resolution data for North America.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'meteofrance_forecast',
    description: 'Get weather forecast from French Météo-France models including AROME (high-resolution France) and ARPEGE (Europe).',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'ecmwf_forecast',
    description: 'Get weather forecast from European Centre for Medium-Range Weather Forecasts with high-quality global forecasts.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'jma_forecast',
    description: 'Get weather forecast from Japan Meteorological Agency with high-resolution data for Japan and Asia.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'metno_forecast',
    description: 'Get weather forecast from Norwegian weather service with high-resolution data for Nordic countries.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  },
  {
    name: 'gem_forecast',
    description: 'Get weather forecast from Canadian weather service GEM model with high-resolution data for Canada and North America.',
    inputSchema: WEATHER_FORECAST_TOOL.inputSchema
  }
];

export const FLOOD_FORECAST_TOOL: Tool = {
  name: 'flood_forecast',
  description: 'Get river discharge and flood forecasts from GloFAS (Global Flood Awareness System).',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'river_discharge', 'river_discharge_mean', 'river_discharge_median',
            'river_discharge_max', 'river_discharge_min', 'river_discharge_p25', 'river_discharge_p75'
          ]
        },
        description: 'River discharge variables to retrieve'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      },
      past_days: {
        type: 'integer',
        minimum: 1,
        maximum: 7,
        description: 'Include past days data'
      },
      forecast_days: {
        type: 'integer',
        minimum: 1,
        maximum: 210,
        default: 92,
        description: 'Number of forecast days (up to 210 days possible)'
      },
      ensemble: {
        type: 'boolean',
        description: 'If true, all forecast ensemble members will be returned'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const SEASONAL_FORECAST_TOOL: Tool = {
  name: 'seasonal_forecast',
  description: 'Get long-range seasonal forecasts for temperature and precipitation up to 9 months ahead.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'pressure_msl', 'temperature_2m', 'temperature_2m_max', 'temperature_2m_min', 'shortwave_radiation',
            'cloud_cover', 'precipitation', 'showers', 'wind_speed_10m', 'wind_direction_10m',
            'relative_humidity_2m', 'soil_temperature_0_to_10cm', 'soil_moisture_0_to_10cm', 'soil_moisture_10_to_40cm',
            'soil_moisture_40_to_100cm', 'soil_moisture_100_to_200cm'
          ]
        },
        description: '6-hourly weather variables to retrieve'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m_max', 'temperature_2m_min', 'shortwave_radiation_sum',
            'precipitation_sum', 'rain_sum', 'precipitation_hours',
            'wind_speed_10m_max', 'wind_direction_10m_dominant'
          ]
        },
        description: 'Daily weather variables to retrieve'
      },
      forecast_days: {
        type: 'integer',
        enum: [45, 92, 183, 274],
        default: 92,
        description: 'Number of forecast days: 45 days, 3 months (default), 6 months, or 9 months'
      },
      past_days: {
        type: 'integer',
        minimum: 0,
        maximum: 92,
        description: 'Include past days data'
      },
      start_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'Start date in YYYY-MM-DD format'
      },
      end_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'End date in YYYY-MM-DD format'
      },
      temperature_unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      wind_speed_unit: {
        type: 'string',
        enum: ['kmh', 'ms', 'mph', 'kn'],
        default: 'kmh'
      },
      precipitation_unit: {
        type: 'string',
        enum: ['mm', 'inch'],
        default: 'mm'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      }
    },
    required: ['latitude', 'longitude']
  }
};

export const CLIMATE_PROJECTION_TOOL: Tool = {
  name: 'climate_projection',
  description: 'Get climate change projections from CMIP6 models for different warming scenarios.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean',
            'cloud_cover_mean', 'relative_humidity_2m_max', 'relative_humidity_2m_min',
            'relative_humidity_2m_mean', 'soil_moisture_0_to_10cm_mean',
            'precipitation_sum', 'rain_sum', 'snowfall_sum', 'wind_speed_10m_mean',
            'wind_speed_10m_max', 'pressure_msl_mean', 'shortwave_radiation_sum'
          ]
        },
        description: 'Climate projection variables to retrieve'
      },
      start_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'Start date in YYYY-MM-DD format'
      },
      end_date: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'End date in YYYY-MM-DD format'
      },
      models: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S',
            'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S'
          ]
        },
        description: 'CMIP6 climate models to use'
      },
      temperature_unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      wind_speed_unit: {
        type: 'string',
        enum: ['kmh', 'ms', 'mph', 'kn'],
        default: 'kmh'
      },
      precipitation_unit: {
        type: 'string',
        enum: ['mm', 'inch'],
        default: 'mm'
      },
      disable_bias_correction: {
        type: 'boolean',
        default: false,
        description: 'Disable statistical downscaling and bias correction'
      }
    },
    required: ['latitude', 'longitude', 'start_date', 'end_date', 'models', 'daily']
  }
};

export const ENSEMBLE_FORECAST_TOOL: Tool = {
  name: 'ensemble_forecast',
  description: 'Get ensemble forecasts showing forecast uncertainty with multiple model runs.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        minimum: -90,
        maximum: 90,
        description: 'Latitude in WGS84 coordinate system'
      },
      longitude: {
        type: 'number',
        minimum: -180,
        maximum: 180,
        description: 'Longitude in WGS84 coordinate system'
      },
      models: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'meteofrance_arome_france_hd', 'meteofrance_arome_france', 'meteofrance_arpege_europe',
            'icon_eu', 'icon_global', 'ecmwf_ifs025', 'gfs013'
          ]
        },
        description: 'Ensemble models to use'
      },
      hourly: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
            'precipitation', 'rain', 'snowfall', 'snow_depth', 'weather_code',
            'pressure_msl', 'surface_pressure', 'cloud_cover', 'visibility',
            'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
            'wind_speed_80m', 'wind_direction_80m', 'wind_speed_100m', 'wind_direction_100m',
            'surface_temperature', 'soil_temperature_0_to_10cm', 'cape',
            'et0_fao_evapotranspiration', 'vapour_pressure_deficit', 'shortwave_radiation'
          ]
        },
        description: 'Hourly weather variables to retrieve'
      },
      daily: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'temperature_2m_mean', 'temperature_2m_min', 'temperature_2m_max',
            'apparent_temperature_mean', 'apparent_temperature_min', 'apparent_temperature_max',
            'wind_speed_10m_mean', 'wind_speed_10m_min', 'wind_speed_10m_max',
            'wind_direction_10m_dominant', 'wind_gusts_10m_mean', 'wind_gusts_10m_min', 'wind_gusts_10m_max',
            'precipitation_sum', 'precipitation_hours', 'rain_sum', 'snowfall_sum',
            'pressure_msl_mean', 'pressure_msl_min', 'pressure_msl_max',
            'cloud_cover_mean', 'cloud_cover_min', 'cloud_cover_max',
            'relative_humidity_2m_mean', 'relative_humidity_2m_min', 'relative_humidity_2m_max',
            'cape_mean', 'cape_min', 'cape_max', 'shortwave_radiation_sum'
          ]
        },
        description: 'Daily weather variables to retrieve'
      },
      forecast_days: {
        type: 'integer',
        minimum: 1,
        maximum: 35,
        default: 7,
        description: 'Number of forecast days'
      },
      temperature_unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      wind_speed_unit: {
        type: 'string',
        enum: ['kmh', 'ms', 'mph', 'kn'],
        default: 'kmh'
      },
      precipitation_unit: {
        type: 'string',
        enum: ['mm', 'inch'],
        default: 'mm'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for timestamps'
      }
    },
    required: ['latitude', 'longitude', 'models']
  }
};

export const GEOCODING_TOOL: Tool = {
  name: 'geocoding',
  description: 'Search for locations worldwide by place name or postal code. Returns geographic coordinates (latitude and longitude) and detailed location information. Use this tool when you need to convert a location name (e.g., "Paris", "New York") into precise coordinates (latitude/longitude) that are required by other tools. This is essential when you have a location name but need coordinates for data fetching tools.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        description: 'Place name or postal code to search for. Minimum 2 characters required. Examples: "Paris", "Berlin", "75001", "10967"'
      },
      count: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of search results to return (maximum 100)'
      },
      language: {
        type: 'string',
        description: 'Language code for translated results (e.g., "fr", "en", "de"). Returns translated results if available, otherwise in English or native language.'
      },
      countryCode: {
        type: 'string',
        pattern: '^[A-Z]{2}$',
        description: 'ISO-3166-1 alpha2 country code to filter results (e.g., "FR", "DE", "US"). Limits search to a specific country.'
      },
      format: {
        type: 'string',
        enum: ['json', 'protobuf'],
        default: 'json',
        description: 'Return format for results'
      }
    },
    required: ['name']
  }
};

export const ALL_TOOLS: Tool[] = [
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
  ...WEATHER_MODEL_TOOLS
];