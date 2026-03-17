import { describe, expect, it } from 'vitest';
import { ForecastParamsSchema, ArchiveParamsSchema, ClimateParamsSchema, EnsembleParamsSchema } from './types.js';
import { WEATHER_FORECAST_TOOL, ENSEMBLE_FORECAST_TOOL } from './tools.js';

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

  it('tools.ts should not have enum [1, 2] for past_days', () => {
    const props = WEATHER_FORECAST_TOOL.inputSchema.properties as Record<string, unknown>;
    const pastDays = props['past_days'] as Record<string, unknown>;
    expect(pastDays['enum']).toBeUndefined();
    expect(pastDays['minimum']).toBe(1);
    expect(pastDays['maximum']).toBe(92);
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

describe('Fix 3: EnsembleModelsSchema is a single string', () => {
  it('should accept a single model string', () => {
    const result = EnsembleParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      models: 'icon_seamless_eps',
      hourly: ['temperature_2m'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject an array of models', () => {
    const result = EnsembleParamsSchema.safeParse({
      latitude: 48.8566,
      longitude: 2.3522,
      models: ['icon_seamless_eps', 'gfs_seamless'],
      hourly: ['temperature_2m'],
    });
    expect(result.success).toBe(false);
  });

  it('tools.ts ENSEMBLE_FORECAST_TOOL models should be type string', () => {
    const props = ENSEMBLE_FORECAST_TOOL.inputSchema.properties as Record<string, unknown>;
    const models = props['models'] as Record<string, unknown>;
    expect(models['type']).toBe('string');
    expect(models['enum']).toBeDefined();
    expect(Array.isArray(models['enum'])).toBe(true);
  });
});
