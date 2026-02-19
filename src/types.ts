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
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Le code pays doit être au format ISO-3166-1 alpha2 (ex: FR, DE, US)')
    .optional(),
  format: z.enum(['json', 'protobuf']).default('json').optional(),
});

export const LocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
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
export const HourlyVariablesSchema = z
  .array(
    z.enum([
      'temperature_2m',
      'relative_humidity_2m',
      'dewpoint_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'snow_depth',
      'weather_code',
      'pressure_msl',
      'surface_pressure',
      'cloud_cover',
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'visibility',
      'evapotranspiration',
      'et0_fao_evapotranspiration',
      'vapour_pressure_deficit',
      'wind_speed_10m',
      'wind_speed_80m',
      'wind_speed_120m',
      'wind_speed_180m',
      'wind_direction_10m',
      'wind_direction_80m',
      'wind_direction_120m',
      'wind_direction_180m',
      'wind_gusts_10m',
      'temperature_80m',
      'temperature_120m',
      'temperature_180m',
      'soil_temperature_0cm',
      'soil_temperature_6cm',
      'soil_temperature_18cm',
      'soil_temperature_54cm',
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_moisture_3_to_9cm',
      'soil_moisture_9_to_27cm',
      'soil_moisture_27_to_81cm',
      'uv_index',
      'uv_index_clear_sky',
      'is_day',
      'sunshine_duration',
      'wet_bulb_temperature_2m',
      'total_column_integrated_water_vapour',
      'cape',
      'lifted_index',
      'convective_inhibition',
      'freezing_level_height',
      'boundary_layer_height_pbl',
      'shortwave_radiation',
      'direct_radiation',
      'diffuse_radiation',
      'direct_normal_irradiance',
      'global_tilted_irradiance',
      'terrestrial_radiation',
      'shortwave_radiation_instant',
      'direct_radiation_instant',
      'diffuse_radiation_instant',
      'direct_normal_irradiance_instant',
      'global_tilted_irradiance_instant',
      'terrestrial_radiation_instant',
    ]),
  )
  .optional();

export const DailyVariablesSchema = z
  .array(
    z.enum([
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'sunshine_duration',
      'uv_index_max',
      'uv_index_clear_sky_max',
      'rain_sum',
      'showers_sum',
      'snowfall_sum',
      'precipitation_sum',
      'precipitation_hours',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'shortwave_radiation_sum',
      'et0_fao_evapotranspiration',
      'temperature_2m_mean',
      'apparent_temperature_mean',
      'cape_mean',
      'cape_max',
      'cape_min',
      'cloud_cover_mean',
      'cloud_cover_max',
      'cloud_cover_min',
      'dewpoint_2m_mean',
      'dewpoint_2m_max',
      'dewpoint_2m_min',
      'et0_fao_evapotranspiration_sum',
      'growing_degree_days_base_0_limit_50',
      'leaf_wetness_probability_mean',
      'leaf_wetness_probability_max',
      'leaf_wetness_probability_min',
      'precipitation_probability_mean',
      'precipitation_probability_min',
      'relative_humidity_2m_mean',
      'relative_humidity_2m_max',
      'relative_humidity_2m_min',
      'snowfall_water_equivalent_sum',
      'pressure_msl_mean',
      'pressure_msl_max',
      'pressure_msl_min',
      'surface_pressure_mean',
      'surface_pressure_max',
      'surface_pressure_min',
      'updraft_max',
      'visibility_mean',
      'visibility_max',
      'visibility_min',
      'wind_gusts_10m_mean',
      'wind_gusts_10m_min',
      'wind_speed_10m_mean',
      'wind_speed_10m_min',
      'wet_bulb_temperature_2m_mean',
      'wet_bulb_temperature_2m_max',
      'wet_bulb_temperature_2m_min',
      'vapour_pressure_deficit_max',
    ]),
  )
  .optional();

const validateSingleModel = (val: unknown) => {
  if (Array.isArray(val) || (typeof val === 'string' && val.startsWith('['))) {
    throw new Error(
      'models must be a single string, not an array. For multi-model comparison, make one parallel tool call per model.',
    );
  }
  return val;
};

export const ForecastModelsSchema = z.preprocess(
  validateSingleModel,
  z
    .enum([
      'cma_grapes_global',
      'bom_access_global',
      'ncep_gfs_seamless',
      'ncep_gfs_global',
      'ncep_hrrr_us_conus',
      'ncep_nbm_us_conus',
      'ncep_nam_us_conus',
      'ncep_gfs_graphcast',
      'ncep_aigfs_025',
      'ncep_hgefs_025_ensemble_mean',
      'jma_seamless',
      'jma_msm',
      'jma_gsm',
      'kma_seamless',
      'kma_ldps',
      'kma_gdps',
      'dwd_icon_seamless',
      'dwd_icon_global',
      'dwd_icon_eu',
      'dwd_icon_d2',
      'gem_seamless',
      'gem_global',
      'gem_regional',
      'gem_hrdps_continental',
      'gem_hrdps_west',
      'meteofrance_seamless',
      'meteofrance_arpege_world',
      'meteofrance_arpege_europe',
      'meteofrance_arome_france',
      'meteofrance_arome_france_hd',
      'italiameteo_arpae_icon_2i',
      'met_norway_nordic_seamless',
      'met_norway_nordic',
      'knmi_seamless',
      'knmi_harmonie_arome_europe',
      'knmi_harmonie_arome_netherlands',
      'dmi_seamless',
      'dmi_harmonie_arome_europe',
      'uk_met_office_seamless',
      'uk_met_office_global_10km',
      'uk_met_office_uk_2km',
      'meteoswiss_icon_seamless',
      'meteoswiss_icon_ch1',
      'meteoswiss_icon_ch2',
    ])
    .optional(),
);

// Valid model IDs for the dedicated /v1/ecmwf endpoint (different from /v1/forecast)
export const EcmwfModelsSchema = z.preprocess(
  validateSingleModel,
  z.enum(['ecmwf_ifs', 'ecmwf_ifs025', 'best_match']).optional(),
);

export const EnsembleModelsSchema = z.preprocess(
  validateSingleModel,
  z
    .enum([
      'icon_seamless_eps',
      'icon_global_eps',
      'icon_eu_eps',
      'icon_d2_eps',
      'gfs_seamless',
      'gfs_ensemble_025',
      'gfs_ensemble_05',
      'aigefs_025',
      'ecmwf_ifs_025',
      'ecmwf_aifs_025',
      'gem_global',
      'bom_access_global',
      'ukmo_global_20km',
      'ukmo_uk_2km',
      'meteoswiss_icon_ch1',
      'meteoswiss_icon_ch2',
    ])
    .optional(),
);

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
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  start_hour: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .optional(),
  end_hour: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .optional(),
  models: ForecastModelsSchema,
});

// ECMWF-specific parameters schema (uses a different model ID namespace than /v1/forecast)
export const EcmwfParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: EcmwfModelsSchema,
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
export const AirQualityVariablesSchema = z
  .array(
    z.enum([
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'ozone',
      'sulphur_dioxide',
      'ammonia',
      'dust',
      'aerosol_optical_depth',
      'carbon_dioxide',
      'methane',
      'alder_pollen',
      'birch_pollen',
      'grass_pollen',
      'mugwort_pollen',
      'olive_pollen',
      'ragweed_pollen',
      'european_aqi',
      'european_aqi_pm2_5',
      'european_aqi_pm10',
      'european_aqi_nitrogen_dioxide',
      'european_aqi_ozone',
      'european_aqi_sulphur_dioxide',
      'us_aqi',
      'us_aqi_pm2_5',
      'us_aqi_pm10',
      'us_aqi_nitrogen_dioxide',
      'us_aqi_ozone',
      'us_aqi_sulphur_dioxide',
      'us_aqi_carbon_monoxide',
      'uv_index',
      'uv_index_clear_sky',
    ]),
  )
  .optional();

export const AirQualityParamsSchema = CoordinateSchema.extend({
  hourly: AirQualityVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
});

// Marine variables
export const MarineHourlyVariablesSchema = z
  .array(
    z.enum([
      'wave_height',
      'wave_direction',
      'wave_period',
      'wave_peak_period',
      'wind_wave_height',
      'wind_wave_direction',
      'wind_wave_period',
      'wind_wave_peak_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period',
      'swell_wave_peak_period',
      'secondary_swell_wave_height',
      'secondary_swell_wave_period',
      'secondary_swell_wave_direction',
      'tertiary_swell_wave_height',
      'tertiary_swell_wave_period',
      'tertiary_swell_wave_direction',
      'sea_level_height_msl',
      'sea_surface_temperature',
      'ocean_current_velocity',
      'ocean_current_direction',
      'invert_barometer_height',
    ]),
  )
  .optional();

export const MarineDailyVariablesSchema = z
  .array(
    z.enum([
      'wave_height_max',
      'wave_direction_dominant',
      'wave_period_max',
      'wind_wave_height_max',
      'wind_wave_direction_dominant',
      'wind_wave_period_max',
      'wind_wave_peak_period_max',
      'swell_wave_height_max',
      'swell_wave_direction_dominant',
      'swell_wave_period_max',
      'swell_wave_peak_period_max',
    ]),
  )
  .optional();

export const MarineParamsSchema = CoordinateSchema.extend({
  hourly: MarineHourlyVariablesSchema,
  daily: MarineDailyVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
});

// Flood variables
export const FloodDailyVariablesSchema = z
  .array(
    z.enum([
      'river_discharge',
      'river_discharge_mean',
      'river_discharge_median',
      'river_discharge_max',
      'river_discharge_min',
      'river_discharge_p25',
      'river_discharge_p75',
    ]),
  )
  .optional();

export const FloodParamsSchema = CoordinateSchema.extend({
  daily: FloodDailyVariablesSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(1).max(7).optional(),
  forecast_days: z.number().min(1).max(210).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ensemble: z.boolean().optional(),
  cell_selection: z.enum(['land', 'sea', 'nearest']).default('nearest').optional(),
});

// Seasonal forecast parameters
export const SeasonalParamsSchema = CoordinateSchema.extend({
  hourly: z
    .array(
      z.enum([
        'pressure_msl',
        'temperature_2m',
        'temperature_2m_max',
        'temperature_2m_min',
        'shortwave_radiation',
        'cloud_cover',
        'precipitation',
        'showers',
        'wind_speed_10m',
        'wind_direction_10m',
        'relative_humidity_2m',
        'soil_temperature_0_to_10cm',
        'soil_moisture_0_to_10cm',
        'soil_moisture_10_to_40cm',
        'soil_moisture_40_to_100cm',
        'soil_moisture_100_to_200cm',
      ]),
    )
    .optional(),
  daily: z
    .array(
      z.enum([
        'temperature_2m_max',
        'temperature_2m_min',
        'shortwave_radiation_sum',
        'precipitation_sum',
        'rain_sum',
        'precipitation_hours',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
      ]),
    )
    .optional(),
  forecast_days: z.union([z.literal(45), z.literal(92), z.literal(183), z.literal(274)]).optional(),
  past_days: z.number().min(0).max(92).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timezone: z.string().optional(),
});

// Climate models
export const ClimateModelsSchema = z.array(
  z.enum([
    'CMCC_CM2_VHR4',
    'FGOALS_f3_H',
    'HiRAM_SIT_HR',
    'MRI_AGCM3_2_S',
    'EC_Earth3P_HR',
    'MPI_ESM1_2_XR',
    'NICAM16_8S',
  ]),
);

// Climate projection parameters
export const ClimateParamsSchema = CoordinateSchema.extend({
  daily: z.array(
    z.enum([
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'cloud_cover_mean',
      'relative_humidity_2m_max',
      'relative_humidity_2m_min',
      'relative_humidity_2m_mean',
      'soil_moisture_0_to_10cm_mean',
      'precipitation_sum',
      'rain_sum',
      'snowfall_sum',
      'wind_speed_10m_mean',
      'wind_speed_10m_max',
      'pressure_msl_mean',
      'shortwave_radiation_sum',
    ]),
  ),
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
  models: EnsembleModelsSchema,
  hourly: z
    .array(
      z.enum([
        'temperature_2m',
        'relative_humidity_2m',
        'dew_point_2m',
        'apparent_temperature',
        'precipitation',
        'rain',
        'snowfall',
        'snow_depth',
        'weather_code',
        'pressure_msl',
        'surface_pressure',
        'cloud_cover',
        'visibility',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'wind_speed_80m',
        'wind_direction_80m',
        'wind_speed_100m',
        'wind_direction_100m',
        'surface_temperature',
        'soil_temperature_0_to_10cm',
        'cape',
        'et0_fao_evapotranspiration',
        'vapour_pressure_deficit',
        'shortwave_radiation',
        'uv_index',
        'uv_index_clear_sky',
        'temperature_3h_min_2m',
        'temperature_3h_max_2m',
        'wet_bulb_temperature_2m',
        'convective_inhibition',
        'freezing_level_height',
        'snowfall_height',
        'sunshine_duration',
        'snowfall_water_equivalent',
        'snow_depth_water_equivalent',
      ]),
    )
    .optional(),
  daily: z
    .array(
      z.enum([
        'temperature_2m_mean',
        'temperature_2m_min',
        'temperature_2m_max',
        'apparent_temperature_mean',
        'apparent_temperature_min',
        'apparent_temperature_max',
        'wind_speed_10m_mean',
        'wind_speed_10m_min',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
        'wind_gusts_10m_mean',
        'wind_gusts_10m_min',
        'wind_gusts_10m_max',
        'wind_speed_100m_mean',
        'wind_speed_100m_min',
        'wind_speed_100m_max',
        'wind_direction_100m_dominant',
        'precipitation_sum',
        'precipitation_hours',
        'rain_sum',
        'snowfall_sum',
        'pressure_msl_mean',
        'pressure_msl_min',
        'pressure_msl_max',
        'surface_pressure_mean',
        'surface_pressure_min',
        'surface_pressure_max',
        'cloud_cover_mean',
        'cloud_cover_min',
        'cloud_cover_max',
        'relative_humidity_2m_mean',
        'relative_humidity_2m_min',
        'relative_humidity_2m_max',
        'dew_point_2m_mean',
        'dew_point_2m_min',
        'dew_point_2m_max',
        'cape_mean',
        'cape_min',
        'cape_max',
        'shortwave_radiation_sum',
      ]),
    )
    .optional(),
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
  current_weather: z
    .object({
      time: z.string(),
      temperature: z.union([z.number(), z.string()]),
      wind_speed: z.union([z.number(), z.string()]),
      wind_direction: z.union([z.number(), z.string()]),
      weather_code: z.union([z.number(), z.string()]),
    })
    .optional(),
});

export const ElevationResponseSchema = z.object({
  elevation: z.array(z.number()),
});

export type ForecastParams = z.infer<typeof ForecastParamsSchema>;
export type EcmwfParams = z.infer<typeof EcmwfParamsSchema>;
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
