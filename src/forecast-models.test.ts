import { describe, expect, it } from 'vitest';
import { WEATHER_FORECAST_TOOL } from './tools.js';
import { ForecastParamsSchema } from './types.js';

// Canonical model names verified against the Open-Meteo API (/v1/forecast)
// Wrong names produce: "Cannot initialize MultiDomains from invalid String value <name>"
const VALID_MODELS = [
  // ECMWF — correct names (no underscores before resolution digits)
  'ecmwf_ifs04',
  'ecmwf_ifs025',
  'ecmwf_aifs025_single',
  // NCEP/GFS — correct names
  'gfs_seamless',
  'ncep_gfs_global',
  'ncep_hrrr_conus', // was ncep_hrrr_us_conus
  'ncep_nbm_conus', // was ncep_nbm_us_conus
  'ncep_nam_conus', // was ncep_nam_us_conus
  'ncep_gfs_graphcast025', // was ncep_gfs_graphcast
  'ncep_aigfs025', // was ncep_aigfs_025
  'ncep_hgefs025_ensemble_mean', // was ncep_hgefs_025_ensemble_mean
  // Italy
  'italia_meteo_arpae_icon_2i', // was italiameteo_arpae_icon_2i
  // MetNo
  'metno_seamless', // was met_norway_nordic_seamless
  'metno_nordic', // was met_norway_nordic
  // UKMO
  'ukmo_seamless', // was uk_met_office_seamless
  'ukmo_global_deterministic_10km', // was uk_met_office_global_10km
  'ukmo_uk_deterministic_2km', // was uk_met_office_uk_2km
] as const;

const INVALID_OLD_MODELS = [
  'ecmwf_ifs_hres_9km',
  'ecmwf_ifs_025',
  'ecmwf_aifs_025_single',
  'ncep_gfs_seamless',
  'ncep_hrrr_us_conus',
  'ncep_nbm_us_conus',
  'ncep_nam_us_conus',
  'ncep_gfs_graphcast',
  'ncep_aigfs_025',
  'ncep_hgefs_025_ensemble_mean',
  'italiameteo_arpae_icon_2i',
  'met_norway_nordic_seamless',
  'met_norway_nordic',
  'uk_met_office_seamless',
  'uk_met_office_global_10km',
  'uk_met_office_uk_2km',
];

describe('ForecastModelsSchema — canonical API model names', () => {
  const toolModelsEnum: string[] =
    (WEATHER_FORECAST_TOOL.inputSchema.properties as Record<string, { enum?: string[] }>).models
      ?.enum ?? [];

  for (const model of VALID_MODELS) {
    it(`ForecastParamsSchema should accept canonical model: ${model}`, () => {
      const result = ForecastParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
      });
      expect(result.success).toBe(true);
    });

    it(`WEATHER_FORECAST_TOOL schema should include canonical model: ${model}`, () => {
      expect(toolModelsEnum).toContain(model);
    });
  }

  for (const model of INVALID_OLD_MODELS) {
    it(`ForecastParamsSchema should reject invalid old model: ${model}`, () => {
      const result = ForecastParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
      });
      expect(result.success).toBe(false);
    });

    it(`WEATHER_FORECAST_TOOL schema should NOT include invalid old model: ${model}`, () => {
      expect(toolModelsEnum).not.toContain(model);
    });
  }
});

describe('metno_forecast description — no models instruction', () => {
  it('metno_nordic is a valid model in ForecastParamsSchema', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 59.91,
      longitude: 10.75,
      models: 'metno_nordic',
    });
    expect(result.success).toBe(true);
  });
});
