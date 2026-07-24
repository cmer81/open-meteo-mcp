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
      'dew_point_2m',
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
      'wind_speed_200m',
      'wind_direction_200m',
      'snow_height',
      'updraft',
      'lightning_potential',
      'temperature_1000hPa',
      'temperature_975hPa',
      'temperature_950hPa',
      'temperature_925hPa',
      'temperature_900hPa',
      'temperature_850hPa',
      'temperature_800hPa',
      'temperature_700hPa',
      'temperature_600hPa',
      'temperature_500hPa',
      'temperature_400hPa',
      'temperature_300hPa',
      'temperature_250hPa',
      'temperature_200hPa',
      'temperature_150hPa',
      'temperature_100hPa',
      'temperature_70hPa',
      'temperature_50hPa',
      'temperature_30hPa',
      'relative_humidity_1000hPa',
      'relative_humidity_975hPa',
      'relative_humidity_950hPa',
      'relative_humidity_925hPa',
      'relative_humidity_900hPa',
      'relative_humidity_850hPa',
      'relative_humidity_800hPa',
      'relative_humidity_700hPa',
      'relative_humidity_600hPa',
      'relative_humidity_500hPa',
      'relative_humidity_400hPa',
      'relative_humidity_300hPa',
      'relative_humidity_250hPa',
      'relative_humidity_200hPa',
      'relative_humidity_150hPa',
      'relative_humidity_100hPa',
      'relative_humidity_70hPa',
      'relative_humidity_50hPa',
      'relative_humidity_30hPa',
      'cloud_cover_1000hPa',
      'cloud_cover_975hPa',
      'cloud_cover_950hPa',
      'cloud_cover_925hPa',
      'cloud_cover_900hPa',
      'cloud_cover_850hPa',
      'cloud_cover_800hPa',
      'cloud_cover_700hPa',
      'cloud_cover_600hPa',
      'cloud_cover_500hPa',
      'cloud_cover_400hPa',
      'cloud_cover_300hPa',
      'cloud_cover_250hPa',
      'cloud_cover_200hPa',
      'cloud_cover_150hPa',
      'cloud_cover_100hPa',
      'cloud_cover_70hPa',
      'cloud_cover_50hPa',
      'cloud_cover_30hPa',
      'wind_speed_1000hPa',
      'wind_speed_975hPa',
      'wind_speed_950hPa',
      'wind_speed_925hPa',
      'wind_speed_900hPa',
      'wind_speed_850hPa',
      'wind_speed_800hPa',
      'wind_speed_700hPa',
      'wind_speed_600hPa',
      'wind_speed_500hPa',
      'wind_speed_400hPa',
      'wind_speed_300hPa',
      'wind_speed_250hPa',
      'wind_speed_200hPa',
      'wind_speed_150hPa',
      'wind_speed_100hPa',
      'wind_speed_70hPa',
      'wind_speed_50hPa',
      'wind_speed_30hPa',
      'wind_direction_1000hPa',
      'wind_direction_975hPa',
      'wind_direction_950hPa',
      'wind_direction_925hPa',
      'wind_direction_900hPa',
      'wind_direction_850hPa',
      'wind_direction_800hPa',
      'wind_direction_700hPa',
      'wind_direction_600hPa',
      'wind_direction_500hPa',
      'wind_direction_400hPa',
      'wind_direction_300hPa',
      'wind_direction_250hPa',
      'wind_direction_200hPa',
      'wind_direction_150hPa',
      'wind_direction_100hPa',
      'wind_direction_70hPa',
      'wind_direction_50hPa',
      'wind_direction_30hPa',
      'geopotential_height_1000hPa',
      'geopotential_height_975hPa',
      'geopotential_height_950hPa',
      'geopotential_height_925hPa',
      'geopotential_height_900hPa',
      'geopotential_height_850hPa',
      'geopotential_height_800hPa',
      'geopotential_height_700hPa',
      'geopotential_height_600hPa',
      'geopotential_height_500hPa',
      'geopotential_height_400hPa',
      'geopotential_height_300hPa',
      'geopotential_height_250hPa',
      'geopotential_height_200hPa',
      'geopotential_height_150hPa',
      'geopotential_height_100hPa',
      'geopotential_height_70hPa',
      'geopotential_height_50hPa',
      'geopotential_height_30hPa',
      'vertical_velocity_1000hPa',
      'vertical_velocity_975hPa',
      'vertical_velocity_950hPa',
      'vertical_velocity_925hPa',
      'vertical_velocity_900hPa',
      'vertical_velocity_850hPa',
      'vertical_velocity_800hPa',
      'vertical_velocity_700hPa',
      'vertical_velocity_600hPa',
      'vertical_velocity_500hPa',
      'vertical_velocity_400hPa',
      'vertical_velocity_300hPa',
      'vertical_velocity_250hPa',
      'vertical_velocity_200hPa',
      'vertical_velocity_150hPa',
      'vertical_velocity_100hPa',
      'vertical_velocity_70hPa',
      'vertical_velocity_50hPa',
      'vertical_velocity_30hPa',
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
      'dew_point_2m_mean',
      'dew_point_2m_max',
      'dew_point_2m_min',
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

// Union of the model IDs accepted by the live /v1/forecast API: the historical names
// already in this schema, plus the canonical names from the OpenAPI spec (verified —
// both families resolve on the live API; Open-Meteo keeps them as aliases).
export const MinutelyVariablesSchema = z
  .array(
    z.enum([
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'snowfall',
      'snowfall_height',
      'freezing_level_height',
      'sunshine_duration',
      'weather_code',
      'wind_speed_10m',
      'wind_speed_80m',
      'wind_speed_100m',
      'wind_direction_10m',
      'wind_direction_80m',
      'wind_direction_100m',
      'wind_gusts_10m',
      'visibility',
      'cape',
      'lightning_potential',
      'is_day',
    ]),
  )
  .optional();

export const ForecastModelsSchema = z
  .enum([
    'best_match',
    'ecmwf_ifs04',
    'ecmwf_ifs',
    'ecmwf_ifs025',
    'ecmwf_aifs025_single',
    'cma_grapes_global',
    'bom_access_global',
    'gfs_seamless',
    'ncep_gfs_seamless',
    'ncep_gfs_global',
    'ncep_hrrr_conus',
    'ncep_nbm_conus',
    'ncep_nam_conus',
    'ncep_gfs_graphcast025',
    'ncep_aigfs025',
    'ncep_hgefs025_ensemble_mean',
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
    'icon_seamless',
    'icon_global',
    'icon_eu',
    'icon_d2',
    'gem_seamless',
    'gem_global',
    'gem_regional',
    'gem_hrdps_continental',
    'gem_hrdps_west',
    'cmc_gem_seamless',
    'cmc_gem_gdps',
    'cmc_gem_rdps',
    'cmc_gem_hrdps',
    'cmc_gem_hrdps_west',
    'meteofrance_seamless',
    'meteofrance_arpege_world',
    'meteofrance_arpege_europe',
    'meteofrance_arome_france',
    'meteofrance_arome_france_hd',
    'italia_meteo_arpae_icon_2i',
    'metno_seamless',
    'metno_nordic',
    'knmi_seamless',
    'knmi_harmonie_arome_europe',
    'knmi_harmonie_arome_netherlands',
    'dmi_seamless',
    'dmi_harmonie_arome_europe',
    'ukmo_seamless',
    'ukmo_global_deterministic_10km',
    'ukmo_uk_deterministic_2km',
    'meteoswiss_icon_seamless',
    'meteoswiss_icon_ch1',
    'meteoswiss_icon_ch2',
    'geosphere_seamless',
    'geosphere_arome_austria',
  ])
  .optional();

// Valid model IDs for the dedicated /v1/ecmwf endpoint (different from /v1/forecast)
export const EcmwfModelsSchema = z.enum(['ecmwf_ifs', 'ecmwf_ifs025', 'best_match']).optional();

// Note: the ensemble.yml OpenAPI spec documents dwd_*_eps / cmc_gem_geps names, but
// the live /v1/ensemble API rejects them (verified) and only accepts the names below.
const EnsembleModelEnum = z.enum([
  'icon_seamless_eps',
  'icon_global_eps',
  'icon_eu_eps',
  'icon_d2_eps',
  'gfs_seamless',
  'ncep_gefs025',
  'ncep_gefs05',
  'ncep_aigefs025',
  'ecmwf_ifs025_ensemble',
  'ecmwf_aifs025_ensemble',
  'gem_global',
  'bom_access_global',
  'ukmo_global_ensemble_20km',
  'ukmo_uk_ensemble_2km',
  'meteoswiss_icon_ch1',
  'meteoswiss_icon_ch2',
]);

// The live /v1/ensemble API accepts a comma-separated list of models (verified),
// so this accepts either a single model or an array of models.
export const EnsembleModelsSchema = z
  .union([EnsembleModelEnum, z.array(EnsembleModelEnum)])
  .optional();

// Forecast parameters schema
export const ForecastParamsSchema = CoordinateSchema.extend({
  hourly: HourlyVariablesSchema,
  daily: DailyVariablesSchema,
  minutely_15: MinutelyVariablesSchema,
  current_weather: z.boolean().optional(),
  current: HourlyVariablesSchema,
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timeformat: TimeFormatSchema,
  timezone: z.string().optional(),
  past_days: z.number().int().min(1).max(92).optional(),
  past_hours: z.number().int().min(0).optional(),
  forecast_days: z.number().min(1).max(16).optional(),
  forecast_hours: z.number().int().min(0).optional(),
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
  cell_selection: z.enum(['land', 'sea', 'nearest']).optional(),
  tilt: z.number().min(0).max(90).optional(),
  azimuth: z.number().min(-180).max(180).optional(),
  models: ForecastModelsSchema,
});

// ECMWF-specific parameters schema (uses a different model ID namespace than /v1/forecast)
export const EcmwfParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: EcmwfModelsSchema,
});

// Per-provider model ID subsets, so each model-specific tool only accepts model IDs
// that are actually valid for its own dedicated endpoint.
export const DwdIconModelsSchema = z
  .enum([
    'dwd_icon_seamless',
    'dwd_icon_global',
    'dwd_icon_eu',
    'dwd_icon_d2',
    'icon_seamless',
    'icon_global',
    'icon_eu',
    'icon_d2',
  ])
  .optional();

export const GfsModelsSchema = z
  .enum([
    'gfs_seamless',
    'ncep_gfs_seamless',
    'ncep_gfs_global',
    'ncep_hrrr_conus',
    'ncep_nbm_conus',
    'ncep_nam_conus',
    'ncep_gfs_graphcast025',
    'ncep_aigfs025',
    'ncep_hgefs025_ensemble_mean',
  ])
  .optional();

export const MeteoFranceModelsSchema = z
  .enum([
    'meteofrance_seamless',
    'meteofrance_arpege_world',
    'meteofrance_arpege_europe',
    'meteofrance_arome_france',
    'meteofrance_arome_france_hd',
  ])
  .optional();

export const JmaModelsSchema = z.enum(['jma_seamless', 'jma_msm', 'jma_gsm']).optional();

export const MetnoModelsSchema = z.enum(['metno_seamless', 'metno_nordic']).optional();

export const GemModelsSchema = z
  .enum([
    'gem_seamless',
    'gem_global',
    'gem_regional',
    'gem_hrdps_continental',
    'gem_hrdps_west',
    'cmc_gem_seamless',
    'cmc_gem_gdps',
    'cmc_gem_rdps',
    'cmc_gem_hrdps',
    'cmc_gem_hrdps_west',
  ])
  .optional();

export const DwdIconParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: DwdIconModelsSchema,
});
export const GfsParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: GfsModelsSchema,
});
export const MeteoFranceParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: MeteoFranceModelsSchema,
});
export const JmaParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: JmaModelsSchema,
});
export const MetnoParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: MetnoModelsSchema,
});
export const GemParamsSchema = ForecastParamsSchema.omit({ models: true }).extend({
  models: GemModelsSchema,
});

// ERA5 archive-specific variable schemas (different from forecast API)
export const ArchiveHourlyVariablesSchema = z
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
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'et0_fao_evapotranspiration',
      'vapour_pressure_deficit',
      'wind_speed_10m',
      'wind_speed_100m',
      'wind_direction_10m',
      'wind_direction_100m',
      'wind_gusts_10m',
      'soil_temperature_0_to_7cm',
      'soil_temperature_7_to_28cm',
      'soil_temperature_28_to_100cm',
      'soil_temperature_100_to_255cm',
      'soil_moisture_0_to_7cm',
      'soil_moisture_7_to_28cm',
      'soil_moisture_28_to_100cm',
      'soil_moisture_100_to_255cm',
      'surface_temperature',
      'shortwave_radiation',
      'direct_radiation',
      'diffuse_radiation',
      'direct_normal_irradiance',
      'terrestrial_radiation',
      'shortwave_radiation_instant',
      'direct_radiation_instant',
      'diffuse_radiation_instant',
      'direct_normal_irradiance_instant',
      'terrestrial_radiation_instant',
      'sunshine_duration',
      'is_day',
      'boundary_layer_height',
      'wet_bulb_temperature_2m',
      'total_column_integrated_water_vapour',
      'growing_degree_days_base_0_limit_50',
      'leaf_wetness_probability',
      'soil_moisture_0_to_100cm',
      'soil_temperature_0_to_100cm',
      'soil_moisture_index_0_to_7cm',
      'soil_moisture_index_7_to_28cm',
      'soil_moisture_index_28_to_100cm',
      'soil_moisture_index_0_to_100cm',
      'global_tilted_irradiance',
      'global_tilted_irradiance_instant',
    ]),
  )
  .optional();

export const ArchiveDailyVariablesSchema = z
  .array(
    z.enum([
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'apparent_temperature_mean',
      'sunrise',
      'sunset',
      'daylight_duration',
      'sunshine_duration',
      'precipitation_sum',
      'rain_sum',
      'snowfall_sum',
      'precipitation_hours',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'shortwave_radiation_sum',
      'et0_fao_evapotranspiration',
      'cloud_cover_mean',
      'dew_point_2m_mean',
      'dew_point_2m_max',
      'dew_point_2m_min',
      'relative_humidity_2m_mean',
      'relative_humidity_2m_max',
      'relative_humidity_2m_min',
      'pressure_msl_mean',
      'wind_speed_10m_mean',
      'wet_bulb_temperature_2m_mean',
      'vapour_pressure_deficit_max',
      'soil_moisture_0_to_7cm_mean',
      'soil_moisture_7_to_28cm_mean',
      'soil_moisture_28_to_100cm_mean',
      'soil_moisture_0_to_100cm_mean',
      'soil_temperature_0_to_7cm_mean',
      'soil_temperature_7_to_28cm_mean',
      'soil_temperature_28_to_100cm_mean',
    ]),
  )
  .optional();

export const ArchiveModelsSchema = z
  .enum([
    'best_match',
    'era5_seamless',
    'era5',
    'era5_land',
    'ecmwf_ifs',
    'cerra',
    'era5_ensemble',
    'ecmwf_ifs_analysis_long_window',
  ])
  .optional();

// Archive parameters schema
export const ArchiveParamsSchema = CoordinateSchema.extend({
  hourly: ArchiveHourlyVariablesSchema,
  daily: ArchiveDailyVariablesSchema,
  models: ArchiveModelsSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timeformat: TimeFormatSchema,
  timezone: z.string().optional(),
}).refine((data) => data.start_date <= data.end_date, {
  message: 'start_date must be before or equal to end_date',
  path: ['end_date'],
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
      'formaldehyde',
      'glyoxal',
      'non_methane_volatile_organic_compounds',
      'pm10_wildfires',
      'peroxyacyl_nitrates',
      'secondary_inorganic_aerosol',
      'residential_elementary_carbon',
      'total_elementary_carbon',
      'pm2_5_total_organic_matter',
      'sea_salt_aerosol',
      'nitrogen_monoxide',
      'is_day',
    ]),
  )
  .optional();

export const AirQualityCurrentVariablesSchema = z
  .array(
    z.enum([
      'european_aqi',
      'us_aqi',
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'aerosol_optical_depth',
      'dust',
      'uv_index',
      'uv_index_clear_sky',
      'ammonia',
      'alder_pollen',
      'birch_pollen',
      'grass_pollen',
      'mugwort_pollen',
      'olive_pollen',
      'ragweed_pollen',
    ]),
  )
  .optional();

export const AirQualityParamsSchema = CoordinateSchema.extend({
  hourly: AirQualityVariablesSchema,
  current: AirQualityCurrentVariablesSchema,
  domains: z.enum(['auto', 'cams_europe', 'cams_global']).optional(),
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(0).max(92).optional(),
  forecast_days: z.number().min(0).max(7).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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

export const MarineMinutelyVariablesSchema = z
  .array(z.enum(['ocean_current_velocity', 'ocean_current_direction', 'sea_level_height_msl']))
  .optional();

export const MarineModelsSchema = z
  .enum([
    'best_match',
    'meteofrance_wave',
    'dwd_ewam',
    'ecmwf_wam',
    'ncep_gfswave025',
    'era5_ocean',
  ])
  .optional();

export const MarineParamsSchema = CoordinateSchema.extend({
  hourly: MarineHourlyVariablesSchema,
  daily: MarineDailyVariablesSchema,
  current: MarineHourlyVariablesSchema,
  minutely_15: MarineMinutelyVariablesSchema,
  models: MarineModelsSchema,
  length_unit: z.enum(['metric', 'imperial']).optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(0).max(92).optional(),
  forecast_days: z.number().min(0).max(16).optional(),
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

export const FloodModelsSchema = z
  .enum([
    'seamless_v4',
    'forecast_v4',
    'consolidated_v4',
    'seamless_v3',
    'forecast_v3',
    'consolidated_v3',
  ])
  .optional();

export const FloodParamsSchema = CoordinateSchema.extend({
  daily: FloodDailyVariablesSchema,
  models: FloodModelsSchema,
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().min(0).max(92).optional(),
  forecast_days: z.number().min(0).max(366).optional(),
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
        'temperature_2m',
        'temperature_2m_max',
        'temperature_2m_min',
        'dew_point_2m',
        'pressure_msl',
        'sea_surface_temperature',
        'snowfall_water_equivalent',
        'precipitation',
        'rain',
        'showers',
        'snowfall',
        'cloud_cover',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_speed_100m',
        'wind_direction_100m',
        'wind_speed_200m',
        'wind_direction_200m',
        'relative_humidity_2m',
        'apparent_temperature',
        'et0_fao_evapotranspiration',
        'vapour_pressure_deficit',
        'weather_code',
        'sunshine_duration',
        'wave_height',
        'wave_direction',
        'wave_period',
        'wave_peak_period',
        'soil_temperature_0_to_7cm',
        'soil_temperature_7_to_28cm',
        'soil_temperature_28_to_100cm',
        'soil_temperature_100_to_255cm',
        'soil_moisture_0_to_7cm',
        'soil_moisture_7_to_28cm',
        'soil_moisture_28_to_100cm',
        'soil_moisture_100_to_255cm',
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
    .optional(),
  daily: z
    .array(
      z.enum([
        'sunrise',
        'sunset',
        'weather_code',
        'et0_fao_evapotranspiration',
        'vapour_pressure_deficit_max',
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'sunshine_duration',
        'dew_point_2m_mean',
        'pressure_msl_mean',
        'sea_surface_temperature_mean',
        'cloud_cover_mean',
        'wind_speed_10m_mean',
        'wind_speed_100m_mean',
        'snow_depth_mean',
        'soil_temperature_0_to_7cm_mean',
        'shortwave_radiation_sum',
        'precipitation_sum',
        'rain_sum',
        'precipitation_hours',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
      ]),
    )
    .optional(),
  weekly: z
    .array(
      z.enum([
        'wind_speed_10m_mean',
        'wind_speed_10m_anomaly',
        'wind_speed_100m_mean',
        'wind_speed_100m_anomaly',
        'wind_direction_10m_mean',
        'wind_direction_10m_anomaly',
        'wind_direction_100m_mean',
        'wind_direction_100m_anomaly',
        'snow_depth_mean',
        'snow_depth_anomaly',
        'snowfall_mean',
        'snowfall_anomaly',
        'temperature_2m_anomaly_gt0',
        'temperature_2m_anomaly_gt1',
        'temperature_2m_anomaly_gt2',
        'temperature_2m_anomaly_ltm1',
        'temperature_2m_anomaly_ltm2',
        'pressure_msl_anomaly_gt0',
        'surface_temperature_anomaly_gt0',
        'precipitation_anomaly_gt0',
        'precipitation_anomaly_gt10',
        'precipitation_anomaly_gt20',
        'temperature_2m_sot10',
        'temperature_2m_sot90',
        'temperature_2m_efi',
        'precipitation_efi',
        'precipitation_sot90',
        'showers_mean',
        'snow_density_mean',
        'snow_density_anomaly',
        'snow_depth_water_equivalent_mean',
        'snow_depth_water_equivalent_anomaly',
        'total_column_integrated_water_vapour_mean',
        'total_column_integrated_water_vapour_anomaly',
        'temperature_2m_mean',
        'temperature_2m_anomaly',
        'dew_point_2m_mean',
        'dew_point_2m_anomaly',
        'pressure_msl_mean',
        'pressure_msl_anomaly',
        'sea_surface_temperature_mean',
        'sea_surface_temperature_anomaly',
        'wind_u_component_10m_mean',
        'wind_u_component_10m_anomaly',
        'wind_v_component_10m_mean',
        'wind_v_component_10m_anomaly',
        'wind_u_component_100m_mean',
        'wind_u_component_100m_anomaly',
        'wind_v_component_100m_mean',
        'wind_v_component_100m_anomaly',
        'snowfall_water_equivalent_mean',
        'snowfall_water_equivalent_anomaly',
        'precipitation_mean',
        'precipitation_anomaly',
        'cloud_cover_mean',
        'cloud_cover_anomaly',
        'sunshine_duration_mean',
        'sunshine_duration_anomaly',
        'soil_temperature_0_to_7cm_mean',
        'soil_temperature_0_to_7cm_anomaly',
        'temperature_max6h_2m_mean',
        'temperature_max6h_2m_anomaly',
        'temperature_min6h_2m_mean',
        'temperature_min6h_2m_anomaly',
      ]),
    )
    .optional(),
  monthly: z
    .array(
      z.enum([
        'wind_gusts_10m_anomaly',
        'wind_speed_10m_mean',
        'wind_speed_10m_anomaly',
        'albedo_mean',
        'albedo_anomaly',
        'cloud_cover_low_mean',
        'cloud_cover_low_anomaly',
        'showers_mean',
        'showers_anomaly',
        'runoff_mean',
        'runoff_anomaly',
        'snow_density_mean',
        'snow_density_anomaly',
        'snow_depth_water_equivalent_mean',
        'snow_depth_water_equivalent_anomaly',
        'total_column_integrated_water_vapour_mean',
        'total_column_integrated_water_vapour_anomaly',
        'temperature_2m_mean',
        'temperature_2m_anomaly',
        'dew_point_2m_mean',
        'dew_point_2m_anomaly',
        'pressure_msl_mean',
        'pressure_msl_anomaly',
        'sea_surface_temperature_mean',
        'sea_surface_temperature_anomaly',
        'wind_u_component_10m_mean',
        'wind_u_component_10m_anomaly',
        'wind_v_component_10m_mean',
        'wind_v_component_10m_anomaly',
        'snowfall_water_equivalent_mean',
        'snowfall_water_equivalent_anomaly',
        'precipitation_mean',
        'precipitation_anomaly',
        'shortwave_radiation_mean',
        'shortwave_radiation_anomaly',
        'longwave_radiation_mean',
        'longwave_radiation_anomaly',
        'cloud_cover_mean',
        'cloud_cover_anomaly',
        'sunshine_duration_mean',
        'sunshine_duration_anomaly',
        'soil_temperature_0_to_7cm_mean',
        'soil_temperature_0_to_7cm_anomaly',
        'soil_temperature_7_to_28cm_mean',
        'soil_temperature_7_to_28cm_anomaly',
        'soil_temperature_28_to_100cm_mean',
        'soil_temperature_28_to_100cm_anomaly',
        'soil_temperature_100_to_255cm_mean',
        'soil_temperature_100_to_255cm_anomaly',
        'soil_moisture_0_to_7cm_mean',
        'soil_moisture_0_to_7cm_anomaly',
        'soil_moisture_7_to_28cm_mean',
        'soil_moisture_7_to_28cm_anomaly',
        'soil_moisture_28_to_100cm_mean',
        'soil_moisture_28_to_100cm_anomaly',
        'soil_moisture_100_to_255cm_mean',
        'soil_moisture_100_to_255cm_anomaly',
        'temperature_max24h_2m_mean',
        'temperature_max24h_2m_anomaly',
        'temperature_min24h_2m_mean',
        'temperature_min24h_2m_anomaly',
        'sea_ice_cover_mean',
        'sea_ice_cover_anomaly',
        'latent_heat_flux_mean',
        'latent_heat_flux_anomaly',
        'sensible_heat_flux_mean',
        'sensible_heat_flux_anomaly',
        'evapotranspiration_mean',
        'evapotranspiration_anomaly',
        'snowfall_mean',
        'snowfall_anomaly',
        'snow_depth_mean',
        'snow_depth_anomaly',
      ]),
    )
    .optional(),
  forecast_days: z.number().int().min(0).max(217).optional(),
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
  timeformat: TimeFormatSchema,
  cell_selection: z.enum(['land', 'sea', 'nearest']).optional(),
  models: z
    .enum([
      'best_match',
      'ecmwf_seasonal_seamless',
      'ecmwf_seas5',
      'ecmwf_ec46',
      'ecmwf_seasonal_ensemble_mean_seamless',
      'ecmwf_seas5_ensemble_mean',
      'ecmwf_ec46_ensemble_mean',
    ])
    .optional(),
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
  daily: z
    .array(
      z.enum([
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'cloud_cover_mean',
        'relative_humidity_2m_max',
        'relative_humidity_2m_min',
        'relative_humidity_2m_mean',
        'precipitation_sum',
        'rain_sum',
        'snowfall_sum',
        'snowfall_water_equivalent_sum',
        'wind_speed_10m_mean',
        'wind_speed_10m_max',
        'wind_gusts_10m_mean',
        'wind_gusts_10m_max',
        'pressure_msl_mean',
        'shortwave_radiation_sum',
        'et0_fao_evapotranspiration_sum',
        'vapour_pressure_deficit_max',
        'dew_point_2m_mean',
        'dew_point_2m_max',
        'dew_point_2m_min',
        'growing_degree_days_base_0_limit_50',
        'leaf_wetness_probability_mean',
        'daylight_duration',
        'soil_moisture_0_to_7cm_mean',
        'soil_moisture_7_to_28cm_mean',
        'soil_moisture_28_to_100cm_mean',
        'soil_moisture_0_to_100cm_mean',
        'soil_moisture_index_0_to_7cm_mean',
        'soil_moisture_index_7_to_28cm_mean',
        'soil_moisture_index_28_to_100cm_mean',
        'soil_temperature_0_to_7cm_mean',
        'soil_temperature_7_to_28cm_mean',
        'soil_temperature_28_to_100cm_mean',
        'soil_temperature_0_to_100cm_mean',
      ]),
    )
    .optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  models: ClimateModelsSchema.optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  disable_bias_correction: z.boolean().optional(),
  timezone: z.string().optional(),
  timeformat: TimeFormatSchema,
  cell_selection: z.enum(['land', 'sea', 'nearest']).optional(),
}).refine((data) => data.start_date <= data.end_date, {
  message: 'start_date must be before or equal to end_date',
  path: ['end_date'],
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
        'temperature_2m_min',
        'temperature_2m_max',
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
  forecast_days: z.number().min(0).max(36).optional(),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timezone: z.string().optional(),
  elevation: z.number().optional(),
  timeformat: TimeFormatSchema,
  past_days: z.number().int().min(0).max(92).optional(),
  past_hours: z.number().int().min(0).optional(),
  forecast_hours: z.number().int().min(0).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  tilt: z.number().min(0).max(90).optional(),
  azimuth: z.number().min(-180).max(180).optional(),
  cell_selection: z.enum(['land', 'sea', 'nearest']).optional(),
  temporal_resolution: z.enum(['native', 'hourly', 'hourly_3', 'hourly_6']).optional(),
});

// Elevation parameters — the API supports batch lookups via comma-separated
// lat/lon lists, so each coordinate accepts either a single value or an array.
export const ElevationParamsSchema = z.object({
  latitude: z.union([z.number().min(-90).max(90), z.array(z.number().min(-90).max(90))]),
  longitude: z.union([z.number().min(-180).max(180), z.array(z.number().min(-180).max(180))]),
});

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
      temperature: z.number(),
      wind_speed: z.number(),
      wind_direction: z.number(),
      weather_code: z.number(),
    })
    .optional(),
});

export const ElevationResponseSchema = z.object({
  elevation: z.array(z.number()),
});

export type ForecastParams = z.infer<typeof ForecastParamsSchema>;
export type EcmwfParams = z.infer<typeof EcmwfParamsSchema>;
export type DwdIconParams = z.infer<typeof DwdIconParamsSchema>;
export type GfsParams = z.infer<typeof GfsParamsSchema>;
export type MeteoFranceParams = z.infer<typeof MeteoFranceParamsSchema>;
export type JmaParams = z.infer<typeof JmaParamsSchema>;
export type MetnoParams = z.infer<typeof MetnoParamsSchema>;
export type GemParams = z.infer<typeof GemParamsSchema>;
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
