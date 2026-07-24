// Maximum response size in characters before truncation kicks in.
export const CHARACTER_LIMIT = 25_000;

// Object-shaped fields whose values are parallel time-series arrays
// (e.g. hourly.time, hourly.temperature_2m — same length, same index meaning).
const TIME_SERIES_KEYS = ['hourly', 'daily', 'minutely_15'] as const;

function shrinkArraysInPlace(container: Record<string, unknown>, ratio: number): void {
  for (const field of Object.keys(container)) {
    const value = container[field];
    if (Array.isArray(value)) {
      container[field] = value.slice(0, Math.max(1, Math.floor(value.length * ratio)));
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Truncates large tool responses so they stay within CHARACTER_LIMIT.
 *
 * Weather responses hold parallel time-series arrays under `hourly`/`daily`/
 * `minutely_15` (one entry per timestamp across several variables); shrinking
 * them all by the same ratio keeps the series internally consistent. List
 * responses (e.g. geocoding's `results`) are truncated directly.
 *
 * Returns the original value unchanged if it's already within the limit, or
 * if it has no recognized shape to truncate (nothing is guessed at).
 */
export function truncateResponse(result: unknown): unknown {
  const originalText = JSON.stringify(result);
  if (originalText.length <= CHARACTER_LIMIT || !isPlainObject(result)) {
    return result;
  }

  const seriesKeys = TIME_SERIES_KEYS.filter((key) => isPlainObject(result[key]));
  const hasResultsArray = Array.isArray(result.results);

  if (seriesKeys.length === 0 && !hasResultsArray) {
    return result;
  }

  const clone = structuredClone(result) as Record<string, unknown>;
  let currentText = originalText;

  for (let attempt = 0; attempt < 5 && currentText.length > CHARACTER_LIMIT; attempt++) {
    const ratio = CHARACTER_LIMIT / currentText.length;
    for (const key of seriesKeys) {
      shrinkArraysInPlace(clone[key] as Record<string, unknown>, ratio);
    }
    if (hasResultsArray) {
      const arr = clone.results as unknown[];
      clone.results = arr.slice(0, Math.max(1, Math.floor(arr.length * ratio)));
    }
    currentText = JSON.stringify(clone);
  }

  return {
    ...clone,
    truncated: true,
    truncation_message:
      `Response truncated from ${originalText.length} to ${currentText.length} characters ` +
      `to stay within the ${CHARACTER_LIMIT}-character limit. Narrow the request (start_date/` +
      'end_date, forecast_days, past_days, or fewer variables) to retrieve the full data.',
  };
}
