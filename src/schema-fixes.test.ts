import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AirQualityParamsSchema,
  ArchiveParamsSchema,
  ClimateParamsSchema,
  EnsembleParamsSchema,
  FloodParamsSchema,
  ForecastParamsSchema,
  GeocodingParamsSchema,
  MarineParamsSchema,
  SeasonalParamsSchema,
} from './types.js';

describe('Fix 1: past_days cap', () => {
  // These two tests fail before the fix (92 is rejected, enum still present)
  it('should accept past_days up to 92', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      past_days: 92,
    });
    expect(result.success).toBe(true);
  });

  // These tests pass both before and after the fix (boundary behavior unchanged)
  it('should accept past_days of 1 (lower bound)', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      past_days: 1,
    });
    expect(result.success).toBe(true);
  });

  it('should reject past_days above 92', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      past_days: 93,
    });
    expect(result.success).toBe(false);
  });
});

describe('Fix 2: date range validation', () => {
  describe('ArchiveParamsSchema', () => {
    it('should accept start_date equal to end_date', () => {
      const result = ArchiveParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '2024-01-01',
        end_date: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('should accept start_date before end_date', () => {
      const result = ArchiveParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject start_date after end_date', () => {
      const result = ArchiveParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '2024-12-31',
        end_date: '2024-01-01',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('end_date');
    });

    it('should reject start_date one day after end_date (minimally invalid)', () => {
      const result = ArchiveParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '2024-01-02',
        end_date: '2024-01-01',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('end_date');
    });
  });

  describe('ClimateParamsSchema', () => {
    it('should reject start_date after end_date', () => {
      const result = ClimateParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '2050-01-01',
        end_date: '2020-01-01',
        models: ['CMCC_CM2_VHR4'],
        daily: ['temperature_2m_max'],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain('end_date');
    });

    it('should accept valid date range', () => {
      const result = ClimateParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '1950-01-01',
        end_date: '2050-01-01',
        models: ['CMCC_CM2_VHR4'],
        daily: ['temperature_2m_max'],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Fix 3: EnsembleModelsSchema accepts a single model or an array of models', () => {
  it('should accept a single model string', () => {
    const result = EnsembleParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      models: 'icon_seamless_eps',
      hourly: ['temperature_2m'],
    });
    expect(result.success).toBe(true);
  });

  it('should accept an array of models (verified valid on the live /v1/ensemble API)', () => {
    const result = EnsembleParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      models: ['icon_seamless_eps', 'gfs_seamless'],
      hourly: ['temperature_2m'],
    });
    expect(result.success).toBe(true);
  });
});

describe('Fix 5: EnsembleModelsSchema correct API model names', () => {
  const validNewModels = [
    'ncep_gefs025',
    'ncep_gefs05',
    'ncep_aigefs025',
    'ecmwf_ifs025_ensemble',
    'ecmwf_aifs025_ensemble',
    'ukmo_global_ensemble_20km',
    'ukmo_uk_ensemble_2km',
    // Added 2026-09-21, verified against the live /v1/ensemble API
    'dwd_icon_seamless_eps',
    'dwd_icon_d2_eps',
    'cmc_gem_geps',
    'google_weathernext2_ensemble',
    'meteoswiss_icon_ch1_ensemble',
    'ecmwf_aifs_europe_ensemble',
    'ncep_gefs_seamless',
    'ecmwf_ifs025_ensemble_mean',
  ];

  const invalidOldModels = [
    'gfs_ensemble_025',
    'gfs_ensemble_05',
    'aigefs_025',
    'ecmwf_ifs_025',
    'ecmwf_aifs_025',
    'ukmo_global_20km',
    'ukmo_uk_2km',
  ];

  for (const model of validNewModels) {
    it(`should accept canonical model: ${model}`, () => {
      const result = EnsembleParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
        hourly: ['temperature_2m'],
      });
      expect(result.success).toBe(true);
    });
  }

  for (const model of invalidOldModels) {
    it(`should reject invalid old model: ${model}`, () => {
      const result = EnsembleParamsSchema.safeParse({
        latitude: 48.8566,
        longitude: 2.3522,
        models: model,
        hourly: ['temperature_2m'],
      });
      expect(result.success).toBe(false);
    });
  }
});

describe('Fix 4: current array parameter in weather_forecast', () => {
  it('ForecastParamsSchema should accept current array', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      current: ['temperature_2m', 'wind_speed_10m', 'weather_code'],
    });
    expect(result.success).toBe(true);
  });

  it('ForecastParamsSchema should reject invalid current variables', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      current: ['not_a_real_variable'],
    });
    expect(result.success).toBe(false);
  });

  it('ForecastParamsSchema should keep current_weather working', () => {
    const result = ForecastParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      current_weather: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('Fix 6: pressure-level variables published as a pattern, not ~130 enum members', () => {
  const base = { latitude: 48.8566, longitude: 2.3522 };
  const levels = [
    '1000',
    '975',
    '950',
    '925',
    '900',
    '850',
    '800',
    '700',
    '600',
    '500',
    '400',
    '300',
    '250',
    '200',
    '150',
    '100',
    '70',
    '50',
    '30',
  ];
  const ensembleBases = [
    'temperature',
    'relative_humidity',
    'wind_speed',
    'wind_direction',
    'geopotential_height',
    'vertical_velocity',
  ];
  // The forecast endpoints additionally serve cloud cover per pressure level.
  const forecastBases = [...ensembleBases, 'cloud_cover'];
  const combos = (bases: string[]) => bases.flatMap((b) => levels.map((l) => `${b}_${l}hPa`));

  it('accepts every forecast pressure-level combination in hourly and current', () => {
    const vars = combos(forecastBases);
    expect(vars).toHaveLength(133);
    expect(ForecastParamsSchema.safeParse({ ...base, hourly: vars, current: vars }).success).toBe(
      true,
    );
  });

  it('accepts every ensemble pressure-level combination', () => {
    const vars = combos(ensembleBases);
    expect(vars).toHaveLength(114);
    expect(EnsembleParamsSchema.safeParse({ ...base, hourly: vars }).success).toBe(true);
  });

  it.each([
    'temperature_851hPa',
    'temperature_10hPa',
    'temperature_850hpa',
    'dew_point_850hPa',
    'temperature__850hPa',
  ])('rejects malformed or unknown pressure-level variable %s', (variable) => {
    expect(ForecastParamsSchema.safeParse({ ...base, hourly: [variable] }).success).toBe(false);
  });

  it('rejects cloud_cover pressure levels for ensemble, which the endpoint does not serve', () => {
    const result = EnsembleParamsSchema.safeParse({ ...base, hourly: ['cloud_cover_850hPa'] });
    expect(result.success).toBe(false);
  });

  it('still accepts surface variables alongside pressure-level ones', () => {
    const result = ForecastParamsSchema.safeParse({
      ...base,
      hourly: ['temperature_2m', 'temperature_850hPa'],
    });
    expect(result.success).toBe(true);
  });

  it('explains the accepted naming when a variable is unknown', () => {
    const result = ForecastParamsSchema.safeParse({ ...base, hourly: ['temprature_2m'] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('<variable>_<level>hPa');
  });

  it('publishes pressure levels as a regex pattern instead of enumerating them', () => {
    const json = JSON.stringify(z.toJSONSchema(ForecastParamsSchema, { io: 'input' }));
    expect(json).not.toContain('temperature_850hPa"');
    expect(json).toContain('hPa$');
  });
});

describe('Fix 7: parameters whose meaning is not obvious from their name are described', () => {
  const published = (schema: z.ZodType) =>
    z.toJSONSchema(schema, { io: 'input' }).properties as Record<string, { description?: string }>;

  const withTimezone = {
    ForecastParamsSchema,
    ArchiveParamsSchema,
    AirQualityParamsSchema,
    MarineParamsSchema,
    FloodParamsSchema,
    SeasonalParamsSchema,
    ClimateParamsSchema,
    EnsembleParamsSchema,
  };

  // Without a timezone the API answers in GMT; "auto" is the value that gives
  // local hours and days, and a caller only learns it exists from here.
  it.each(Object.entries(withTimezone))('%s tells callers about timezone "auto"', (_, schema) => {
    expect(published(schema).timezone?.description).toContain('"auto"');
  });

  it.each([
    ['ArchiveParamsSchema', ArchiveParamsSchema, 'elevation'],
    ['EnsembleParamsSchema', EnsembleParamsSchema, 'elevation'],
    ['EnsembleParamsSchema', EnsembleParamsSchema, 'temporal_resolution'],
    ['FloodParamsSchema', FloodParamsSchema, 'ensemble'],
    ['AirQualityParamsSchema', AirQualityParamsSchema, 'domains'],
    ['ClimateParamsSchema', ClimateParamsSchema, 'disable_bias_correction'],
    ['ForecastParamsSchema', ForecastParamsSchema, 'current'],
    ['ForecastParamsSchema', ForecastParamsSchema, 'current_weather'],
    ['GeocodingParamsSchema', GeocodingParamsSchema, 'name'],
    ['GeocodingParamsSchema', GeocodingParamsSchema, 'language'],
  ] as const)('%s describes %s', (_, schema, field) => {
    expect(published(schema)[field]?.description).toBeTruthy();
  });

  it('keeps the shared hourly variable list undescribed where it is reused as current', () => {
    // .describe() returns a copy, so describing `current` must not leak onto `hourly`.
    expect(published(ForecastParamsSchema).hourly?.description).toBeUndefined();
  });

  it('rejects fractional day counts', () => {
    const base = { latitude: 48.85, longitude: 2.35 };
    expect(ForecastParamsSchema.safeParse({ ...base, forecast_days: 2.5 }).success).toBe(false);
    expect(MarineParamsSchema.safeParse({ ...base, past_days: 1.5 }).success).toBe(false);
    expect(GeocodingParamsSchema.safeParse({ name: 'Paris', count: 2.5 }).success).toBe(false);
  });
});
