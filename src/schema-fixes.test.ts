import { describe, expect, it } from 'vitest';
import { ForecastParamsSchema } from './types.js';
import { WEATHER_FORECAST_TOOL } from './tools.js';

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
