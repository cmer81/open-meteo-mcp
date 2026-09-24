import { describe, expect, it } from 'vitest';
import { EcmwfParamsSchema, ForecastParamsSchema } from './types.js';

// Canonical model names verified against the Open-Meteo API (/v1/forecast)
// Wrong names produce: "Cannot initialize MultiDomains from invalid String value <name>"
const VALID_MODELS = [
  // ECMWF — correct names (no underscores before resolution digits)
  'ecmwf_ifs04',
  'ecmwf_ifs025',
  'ecmwf_aifs025_single',
  // NCEP/GFS — correct names
  'gfs_seamless',
  'ncep_gfs_seamless', // spec-documented alias for gfs_seamless, also verified valid on the live API
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
  // Added 2026-09-21, verified against the live API
  'ecmwf_aifs025',
  'ecmwf_ifs_europe_ensemble_mean',
  'ncep_hrrr_conus_15min',
  'ncep_aigefs025_ensemble_mean',
  'dwd_icon_d2_15min',
  'meteofrance_arome_france_15min',
  'meteofrance_arpege_world025',
  'jma_msm_upper_level',
  'chmi_aladin_seamless',
  'chmi_aladin_cz_1km',
  'chmi_aladin_central_europe_2km',
] as const;

const INVALID_OLD_MODELS = [
  'ecmwf_ifs_hres_9km',
  'ecmwf_ifs_025',
  'ecmwf_aifs_025_single',
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
  for (const model of VALID_MODELS) {
    it(`ForecastParamsSchema should accept canonical model: ${model}`, () => {
      const result = ForecastParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
      });
      expect(result.success).toBe(true);
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

// Model IDs verified against the live /v1/ecmwf endpoint on 2026-09-21
describe('EcmwfModelsSchema — models accepted by /v1/ecmwf', () => {
  const valid = [
    'best_match',
    'ecmwf_ifs',
    'ecmwf_ifs04',
    'ecmwf_ifs025',
    'ecmwf_aifs025',
    'ecmwf_aifs025_single',
    'ecmwf_ifs_europe_ensemble_mean',
    'ecmwf_aifs_europe_ensemble_mean',
  ];

  for (const model of valid) {
    it(`EcmwfParamsSchema should accept model: ${model}`, () => {
      const result = EcmwfParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
        hourly: ['temperature_2m'],
      });
      expect(result.success).toBe(true);
    });
  }

  for (const model of [
    'ecmwf_ifs_025',
    'ecmwf_aifs_025_single',
    'ecmwf_ifs_hres_9km',
    'gfs_seamless',
  ]) {
    it(`EcmwfParamsSchema should reject model: ${model}`, () => {
      const result = EcmwfParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
        hourly: ['temperature_2m'],
      });
      expect(result.success).toBe(false);
    });
  }
});
