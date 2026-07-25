import { describe, expect, it } from 'vitest';
import { CHARACTER_LIMIT, serializeToolResponse, truncateResponse } from './truncation.js';

function makeHourlySeries(length: number) {
  return {
    time: Array.from({ length }, (_, i) => `2026-01-01T${i}:00`),
    temperature_2m: Array.from({ length }, (_, i) => i / 10),
    relative_humidity_2m: Array.from({ length }, (_, i) => 100 - i),
  };
}

describe('truncateResponse', () => {
  it('returns the input unchanged when already within the character limit', () => {
    const small = { latitude: 48.85, longitude: 2.35, hourly: makeHourlySeries(5) };
    expect(truncateResponse(small)).toEqual(small);
  });

  it('returns non-object results unchanged', () => {
    expect(truncateResponse('just a string')).toBe('just a string');
    expect(truncateResponse(null)).toBe(null);
    expect(truncateResponse([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('returns oversized objects unchanged when they have no recognized truncatable shape', () => {
    const big = { note: 'x'.repeat(CHARACTER_LIMIT + 1000) };
    expect(truncateResponse(big)).toEqual(big);
  });

  it('shrinks hourly time-series arrays in sync and stays under the limit', () => {
    const large = {
      latitude: 48.85,
      longitude: 2.35,
      hourly: makeHourlySeries(20_000),
    };
    expect(JSON.stringify(large).length).toBeGreaterThan(CHARACTER_LIMIT);

    const result = truncateResponse(large) as typeof large & {
      truncated: boolean;
      truncation_message: string;
    };

    expect(JSON.stringify(result).length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(result.truncated).toBe(true);
    expect(result.truncation_message).toContain('truncated');

    // All parallel arrays under `hourly` must be shrunk to the exact same length.
    const lengths = Object.values(result.hourly).map((arr) => (arr as unknown[]).length);
    expect(new Set(lengths).size).toBe(1);
    expect(lengths[0]).toBeGreaterThan(0);
    expect(lengths[0]).toBeLessThan(20_000);
  });

  it('shrinks a top-level results array (e.g. geocoding) directly', () => {
    const large = {
      results: Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `City ${i}`,
        latitude: 0,
        longitude: 0,
      })),
    };
    expect(JSON.stringify(large).length).toBeGreaterThan(CHARACTER_LIMIT);

    const result = truncateResponse(large) as typeof large & { truncated: boolean };

    expect(JSON.stringify(result).length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(result.truncated).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThan(5000);
  });
});

describe('serializeToolResponse', () => {
  it('keeps the emitted text within the character limit, indentation included', () => {
    const large = { latitude: 48.85, longitude: 2.35, hourly: makeHourlySeries(20_000) };

    const text = serializeToolResponse(large);

    // The budget applies to what is actually sent to the client, so the
    // measurement has to account for the pretty-printing whitespace.
    expect(text.length).toBeLessThanOrEqual(CHARACTER_LIMIT);
    expect(JSON.parse(text).truncated).toBe(true);
  });

  it('pretty-prints responses that fit without marking them truncated', () => {
    const small = { latitude: 48.85, longitude: 2.35, hourly: makeHourlySeries(5) };

    const text = serializeToolResponse(small);

    expect(text).toBe(JSON.stringify(small, null, 2));
    expect(JSON.parse(text).truncated).toBeUndefined();
  });
});
