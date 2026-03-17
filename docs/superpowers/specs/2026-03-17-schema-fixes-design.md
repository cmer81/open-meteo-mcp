# Schema Fixes Design — Issue #38

**Date:** 2026-03-17
**Issue:** https://github.com/cmer81/open-meteo-mcp/issues/38

## Overview

Four schema inconsistencies between `types.ts`, `tools.ts` and the actual Open-Meteo API. All fixes are targeted and isolated — no architectural changes required.

---

## Fix 1 — `past_days` cap raised from 2 to 92

**Files:** `src/types.ts:291`, `src/tools.ts:195`

**Current:**
- `types.ts`: `z.union([z.literal(1), z.literal(2)]).optional()`
- `tools.ts`: `enum: [1, 2]`

**Fix:**
- `types.ts`: `z.number().int().min(1).max(92).optional()`
- `tools.ts`: `minimum: 1, maximum: 92` (drop `enum`, use integer range)

**Rationale:** The Open-Meteo forecast API supports `past_days` up to 92. The cap of 2 was undocumented and unnecessarily restrictive.

---

## Fix 2 — Cross-field date validation for Archive and Climate schemas

**Files:** `src/types.ts` — `ArchiveParamsSchema` (~line 396), `ClimateParamsSchema` (~line 615)

**Fix:** Add `.refine()` to both schemas enforcing `start_date ≤ end_date`.

```ts
.refine(
  (data) => data.start_date <= data.end_date,
  { message: 'start_date must be before or equal to end_date', path: ['end_date'] }
)
```

Note: Both `start_date` and `end_date` are required in both schemas, so no optional guards are needed.

**No max range cap:** The Archive API has no documented maximum range. The Climate API explicitly recommends using the full 1950–2050 range. Adding an artificial cap would break legitimate use cases.

---

## Fix 3 — `EnsembleModelsSchema`: array → single string enum

**Files:** `src/types.ts` (~line 258), `src/tools.ts` (~line 921)

**Current:**
- `types.ts`: `z.array(z.enum([...]))`
- `tools.ts`: `type: 'array'` with items

**Fix:**
- `types.ts`: `z.enum([...]).optional()`
- `tools.ts`: `type: 'string'` with `enum: [...]` directly on the property

**Rationale:** The Open-Meteo ensemble API does not support multiple models per request. The current array schema contradicts the description comment and will confuse LLMs. Consistent with how `weather_forecast` handles `models`.

---

## Fix 4 — Add `current` array parameter to `weather_forecast`

**Files:** `src/types.ts` — `ForecastParamsSchema` (~line 282), `src/tools.ts` (~line 3)

**Fix in `types.ts`:** Add `current: HourlyVariablesSchema` to `ForecastParamsSchema` (reuses existing schema).

**Fix in `tools.ts`:** Add `current` property to `WEATHER_FORECAST_TOOL` inputSchema with same array/items structure as `hourly`.

**Rationale:** The `current_weather: boolean` parameter is deprecated by Open-Meteo. The current API supports a `current` array of specific variables (e.g. `["temperature_2m", "wind_speed_10m"]`). Both the old and new params should coexist — `current_weather` is kept for backward compatibility.

**Note on variable scope:** The Open-Meteo docs explicitly state "Every weather variable available in hourly data, is available as current condition as well." Reusing `HourlyVariablesSchema` is therefore correct and intentional — no separate `CurrentVariablesSchema` is needed.

---

## Out of Scope

- No changes to other schemas (`past_days` limits in `AirQualityParamsSchema`, `MarineParamsSchema`, etc. are separate concerns)
- No refactoring of surrounding code
- No changes to how parameters are serialized in `client.ts`
