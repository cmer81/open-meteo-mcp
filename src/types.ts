import { z } from 'zod';

// Base parameter schemas
export const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const TemperatureUnitSchema = z.enum(['celsius', 'fahrenheit']).default('celsius');
export const WindSpeedUnitSchema = z.enum(['kmh', 'ms', 'mph', 'kn']).default('kmh');
export const PrecipitationUnitSchema = z.enum(['mm', 'inch']).default('mm');
export const TimeFormatSchema = z.enum(['iso8601', 'unixtime']).default('iso8601');

// Geocoding schemas
export const GeocodingParamsSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  count: z.number().min(1).max(100).default(10).optional(),
  language: z.string().optional(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, 'Le code pays doit être au format ISO-3166-1 alpha2 (ex: FR, DE, US)').optional(),
  format: z.enum(['json', 'protobuf']).default('json').optional(),
});

export const LocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z.string().regex(/^[A-Z]{2}$/).optional(),
  admin1_id: z.number().optional(),
  admin2_id: z.number().optional(),
  admin3_id: z.number().optional(),
  admin4_id: z.number().optional(),
  timezone: z.string().optional(),
  population: z.number().min(0).optional(),
  postcodes: z.array(z.string()).optional(),
  country_id: z.number().optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  admin3: z.string().optional(),
  admin4: z.string().optional(),
});

export const GeocodingResponseSchema = z.object({
  results: z.array(LocationSchema),
});

export const GeocodingErrorSchema = z.object({
  error: z.boolean(),
  reason: z.string(),
});

// Weather variables schemas
export const HourlyVariablesSchema = z.array(z.enum([
  // Temperature variables
  'temperature_2m', 'relative_humidity_2m', 'dewpoint_2m', 'apparent_temperature', 'surface_temperature',
  // Pressure variables
  'pressure_msl', 'surface_pressure',
  // Cloud variables
  'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
  // Wind variables
  'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m',
  'wind_direction_10m', 'wind_direction_80m', 'wind_direction_120m', 'wind_direction_180m',
  'wind_gusts_10m', 'wind_u_component_10m', 'wind_v_component_10m',
  'wind_u_component_80m', 'wind_v_component_80m', 'wind_u_component_120m', 'wind_v_component_120m',
  'wind_u_component_180m', 'wind_v_component_180m',
  // Radiation variables
  'shortwave_radiation', 'direct_radiation', 'direct_normal_irradiance', 'diffuse_radiation',
  'terrestrial_radiation', 'sunshine_duration', 'uv_index', 'uv_index_clear_sky',
  // Precipitation variables
  'precipitation', 'rain', 'showers', 'snowfall', 'precipitation_probability', 'snow_depth', 'snow_height',
  // Atmospheric variables
  'vapour_pressure_deficit', 'et0_fao_evapotranspiration', 'weather_code', 'visibility', 'is_day',
  'cape', 'lifted_index', 'convective_inhibition', 'freezing_level_height', 'boundary_layer_height',
  'updraft_velocity', 'downdraft_velocity',
  // Soil variables
  'soil_temperature_0cm', 'soil_temperature_6cm', 'soil_temperature_18cm', 'soil_temperature_54cm',
  'soil_moisture_0_1cm', 'soil_moisture_1_3cm', 'soil_moisture_3_9cm', 'soil_moisture_9_27cm',
  'soil_moisture_27_81cm',
  // Energy flux variables
  'sensible_heat_flux', 'latent_heat_flux',
  // Agricultural variables
  'growing_degree_days_base_0_limit_30', 'leaf_wetness_probability', 'skin_temperature'
])).optional();

export const DailyVariablesSchema = z.array(z.enum([
  'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max', 'apparent_temperature_min',
  'precipitation_sum', 'precipitation_hours', 'weather_code', 'sunrise', 'sunset',
  'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
  'shortwave_radiation_sum', 'uv_index_max', 'uv_index_clear_sky_max', 'et0_fao_evapotranspiration'
])).optional();

export const WeatherModelsSchema = z.array(z.enum([
  'meteofrance_arome_france_hd', 'meteofrance_arome_france', 'meteofrance_arpege_europe',
  'icon_eu', 'icon_global', 'ecmwf_ifs025', 'gfs013'
])).optional();

// Forecast parameters schema
export const ForecastParamsSchema = CoordinateSchema.extend({
  hourly: HourlyVariablesSchema,
  daily: DailyVariablesSchema,
  current_weather: z.boolean().optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timeformat: TimeFormatSchema,
  timezone: z.string().optional(),
  past_days: z.union([z.literal(1), z.literal(2)]).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_hour: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  end_hour: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  models: WeatherModelsSchema,
});

// Archive parameters schema
export const ArchiveParamsSchema = CoordinateSchema.extend({
  hourly: HourlyVariablesSchema,
  daily: DailyVariablesSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timeformat: TimeFormatSchema,
  timezone: z.string().optional(),
});

// Air quality variables
export const AirQualityVariablesSchema = z.array(z.enum([
  'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone',
  'sulphur_dioxide', 'ammonia', 'dust', 'aerosol_optical_depth',
  'carbon_dioxide', 'methane'
])).optional();

export const AirQualityParamsSchema = CoordinateSchema.extend({
  hourly: AirQualityVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
});

// Marine variables
export const MarineHourlyVariablesSchema = z.array(z.enum([
  'wave_height', 'wave_direction', 'wave_period',
  'wind_wave_height', 'wind_wave_direction', 'wind_wave_period',
  'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
  'sea_surface_temperature'
])).optional();

export const MarineDailyVariablesSchema = z.array(z.enum([
  'wave_height_max', 'wind_wave_height_max', 'swell_wave_height_max'
])).optional();

export const MarineParamsSchema = CoordinateSchema.extend({
  hourly: MarineHourlyVariablesSchema,
  daily: MarineDailyVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
});

// Flood variables
export const FloodDailyVariablesSchema = z.array(z.enum([
  'river_discharge', 'river_discharge_mean', 'river_discharge_median',
  'river_discharge_max', 'river_discharge_min', 'river_discharge_p25', 'river_discharge_p75'
])).optional();

export const FloodParamsSchema = CoordinateSchema.extend({
  daily: FloodDailyVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(210).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ensemble: z.boolean().optional(),
  cell_selection: z.enum(['land', 'sea', 'nearest']).default('nearest').optional(),
});

// Seasonal forecast parameters
export const SeasonalParamsSchema = CoordinateSchema.extend({
  hourly: z.array(z.enum([
    'pressure_msl', 'temperature_2m', 'temperature_2m_max', 'temperature_2m_min', 'shortwave_radiation',
    'cloud_cover', 'precipitation', 'showers', 'wind_speed_10m', 'wind_direction_10m',
    'relative_humidity_2m', 'soil_temperature_0_to_10cm', 'soil_moisture_0_to_10cm', 'soil_moisture_10_to_40cm',
    'soil_moisture_40_to_100cm', 'soil_moisture_100_to_200cm'
  ])).optional(),
  daily: z.array(z.enum([
    'temperature_2m_max', 'temperature_2m_min', 'shortwave_radiation_sum',
    'precipitation_sum', 'rain_sum', 'precipitation_hours',
    'wind_speed_10m_max', 'wind_direction_10m_dominant'
  ])).optional(),
  forecast_days: z.union([z.literal(45), z.literal(92), z.literal(183), z.literal(274)]).optional(),
  past_days: z.number().min(0).max(92).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timezone: z.string().optional(),
});

// Climate models
export const ClimateModelsSchema = z.array(z.enum([
  'CMCC_CM2_VHR4', 'FGOALS_f3_H', 'HiRAM_SIT_HR', 'MRI_AGCM3_2_S',
  'EC_Earth3P_HR', 'MPI_ESM1_2_XR', 'NICAM16_8S'
]));

// Climate projection parameters
export const ClimateParamsSchema = CoordinateSchema.extend({
  daily: z.array(z.enum([
    'temperature_2m_max', 'temperature_2m_min', 'temperature_2m_mean',
    'cloud_cover_mean', 'relative_humidity_2m_max', 'relative_humidity_2m_min',
    'relative_humidity_2m_mean', 'soil_moisture_0_to_10cm_mean',
    'precipitation_sum', 'rain_sum', 'snowfall_sum', 'wind_speed_10m_mean',
    'wind_speed_10m_max', 'pressure_msl_mean', 'shortwave_radiation_sum'
  ])),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  models: ClimateModelsSchema,
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  disable_bias_correction: z.boolean().optional(),
});

// Ensemble forecast parameters
export const EnsembleParamsSchema = CoordinateSchema.extend({
  models: WeatherModelsSchema,
  hourly: z.array(z.enum([
    'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
    'precipitation', 'rain', 'snowfall', 'snow_depth', 'weather_code',
    'pressure_msl', 'surface_pressure', 'cloud_cover', 'visibility',
    'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
    'wind_speed_80m', 'wind_direction_80m', 'wind_speed_100m', 'wind_direction_100m',
    'surface_temperature', 'soil_temperature_0_to_10cm', 'cape',
    'et0_fao_evapotranspiration', 'vapour_pressure_deficit', 'shortwave_radiation'
  ])).optional(),
  daily: z.array(z.enum([
    'temperature_2m_mean', 'temperature_2m_min', 'temperature_2m_max',
    'apparent_temperature_mean', 'apparent_temperature_min', 'apparent_temperature_max',
    'wind_speed_10m_mean', 'wind_speed_10m_min', 'wind_speed_10m_max',
    'wind_direction_10m_dominant', 'wind_gusts_10m_mean', 'wind_gusts_10m_min', 'wind_gusts_10m_max',
    'precipitation_sum', 'precipitation_hours', 'rain_sum', 'snowfall_sum',
    'pressure_msl_mean', 'pressure_msl_min', 'pressure_msl_max',
    'cloud_cover_mean', 'cloud_cover_min', 'cloud_cover_max',
    'relative_humidity_2m_mean', 'relative_humidity_2m_min', 'relative_humidity_2m_max',
    'cape_mean', 'cape_min', 'cape_max', 'shortwave_radiation_sum'
  ])).optional(),
  forecast_days: z.number().min(1).max(35).optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timezone: z.string().optional(),
});

// Elevation parameters
export const ElevationParamsSchema = CoordinateSchema;

// Response types
export const WeatherResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  hourly: z.record(z.array(z.union([z.number(), z.string()]))).optional(),
  hourly_units: z.record(z.string()).optional(),
  daily: z.record(z.array(z.union([z.number(), z.string()]))).optional(),
  daily_units: z.record(z.string()).optional(),
  current_weather: z.object({
    time: z.string(),
    temperature: z.number(),
    wind_speed: z.number(),
    wind_direction: z.number(),
    weather_code: z.number(),
  }).optional(),
});

export const ElevationResponseSchema = z.object({
  elevation: z.array(z.number()),
});

export type ForecastParams = z.infer<typeof ForecastParamsSchema>;
export type ArchiveParams = z.infer<typeof ArchiveParamsSchema>;
export type AirQualityParams = z.infer<typeof AirQualityParamsSchema>;
export type MarineParams = z.infer<typeof MarineParamsSchema>;
export type FloodParams = z.infer<typeof FloodParamsSchema>;
export type SeasonalParams = z.infer<typeof SeasonalParamsSchema>;
export type ClimateParams = z.infer<typeof ClimateParamsSchema>;
export type EnsembleParams = z.infer<typeof EnsembleParamsSchema>;
export type ElevationParams = z.infer<typeof ElevationParamsSchema>;
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;
export type ElevationResponse = z.infer<typeof ElevationResponseSchema>;
export type GeocodingParams = z.infer<typeof GeocodingParamsSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type GeocodingResponse = z.infer<typeof GeocodingResponseSchema>;
export type GeocodingError = z.infer<typeof GeocodingErrorSchema>;