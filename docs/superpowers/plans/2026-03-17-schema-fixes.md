# Schema Fixes (Issue #38) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 schema inconsistencies between `types.ts`, `tools.ts` and the actual Open-Meteo API.

**Architecture:** All changes are isolated to two files: `src/types.ts` (Zod schemas) and `src/tools.ts` (JSON Schema for MCP tool definitions). Tests go in a new `src/schema-fixes.test.ts` file. Each fix is independent.

**Tech Stack:** TypeScript, Zod v3, Vitest, @modelcontextprotocol/sdk

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Zod schema changes for all 4 fixes |
| `src/tools.ts` | Modify | JSON Schema changes for fixes 1, 3, 4 |
| `src/schema-fixes.test.ts` | Create | Tests for all 4 fixes |

---

## Task 1: Fix `past_days` cap (1→92)

**Files:**
- Modify: `src/types.ts:291`
- Modify: `src/tools.ts:193-197`
- Test: `src/schema-fixes.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/schema-fixes.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- schema-fixes
```

Expected: FAIL — specifically the two tests marked "fail before the fix": `past_days: 92` rejected by the old `z.literal(1)|z.literal(2)` schema, and the `enum` presence check in tools.ts. The other two tests (`past_days: 1` and `past_days: 93`) may pass at this step, which is expected.

- [ ] **Step 3: Fix `src/types.ts:291`**

Change:
```ts
past_days: z.union([z.literal(1), z.literal(2)]).optional(),
```
To:
```ts
past_days: z.number().int().min(1).max(92).optional(),
```

- [ ] **Step 4: Fix `src/tools.ts:193-197`**

Change:
```ts
past_days: {
  type: 'integer',
  enum: [1, 2],
  description: 'Include past days data',
},
```
To:
```ts
past_days: {
  type: 'integer',
  minimum: 1,
  maximum: 92,
  description: 'Include past days data (1–92)',
},
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- schema-fixes
```

Expected: PASS (all 4 tests in the `Fix 1` describe block)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/tools.ts src/schema-fixes.test.ts
git commit -m "fix: raise past_days cap from 2 to 92 in ForecastParamsSchema and WEATHER_FORECAST_TOOL"
```

---

## Task 2: Date range validation for Archive and Climate schemas

**Files:**
- Modify: `src/types.ts:396-406` (ArchiveParamsSchema)
- Modify: `src/types.ts:615-642` (ClimateParamsSchema)
- Test: `src/schema-fixes.test.ts`

- [ ] **Step 1: Add failing tests to `src/schema-fixes.test.ts`**

Append:

```ts
import { ArchiveParamsSchema, ClimateParamsSchema } from './types.js';

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- schema-fixes
```

Expected: FAIL (date order not validated yet)

- [ ] **Step 3: Fix `ArchiveParamsSchema` in `src/types.ts`**

The schema at line ~396 currently ends at `timezone`. Add `.refine()` after the closing `})`:

Change:
```ts
export const ArchiveParamsSchema = CoordinateSchema.extend({
  hourly: ArchiveHourlyVariablesSchema,
  daily: ArchiveDailyVariablesSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  temperature_unit: TemperatureUnitSchema,
  wind_speed_unit: WindSpeedUnitSchema,
  precipitation_unit: PrecipitationUnitSchema,
  timeformat: TimeFormatSchema,
  timezone: z.string().optional(),
});
```

To:
```ts
export const ArchiveParamsSchema = CoordinateSchema.extend({
  hourly: ArchiveHourlyVariablesSchema,
  daily: ArchiveDailyVariablesSchema,
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
```

- [ ] **Step 4: Fix `ClimateParamsSchema` in `src/types.ts`**

Change the closing `});` of `ClimateParamsSchema` (~line 642) from:
```ts
  disable_bias_correction: z.boolean().optional(),
});
```
To:
```ts
  disable_bias_correction: z.boolean().optional(),
}).refine((data) => data.start_date <= data.end_date, {
  message: 'start_date must be before or equal to end_date',
  path: ['end_date'],
});
```

- [ ] **Step 5: Run tests**

```bash
npm test -- schema-fixes
```

Expected: PASS (all Fix 2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/schema-fixes.test.ts
git commit -m "fix: add start_date <= end_date validation to ArchiveParamsSchema and ClimateParamsSchema"
```

---

## Task 3: EnsembleModelsSchema — array → single string enum

**Files:**
- Modify: `src/types.ts:258-279` (EnsembleModelsSchema)
- Modify: `src/tools.ts:921-945` (ENSEMBLE_FORECAST_TOOL models property)
- Test: `src/schema-fixes.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/schema-fixes.test.ts`:

```ts
import { EnsembleParamsSchema } from './types.js';
import { ENSEMBLE_FORECAST_TOOL } from './tools.js';

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- schema-fixes
```

Expected: FAIL (array still accepted, type is 'array' in tools.ts)

- [ ] **Step 3: Fix `EnsembleModelsSchema` in `src/types.ts:258-279`**

Change:
```ts
export const EnsembleModelsSchema = z
  .array(
    z.enum([
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
    ]),
  )
  .optional();
```

To:
```ts
export const EnsembleModelsSchema = z
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
  .optional();
```

- [ ] **Step 4: Fix `ENSEMBLE_FORECAST_TOOL` models property in `src/tools.ts:921-945`**

Change:
```ts
models: {
  type: 'array',
  items: {
    type: 'string',
    enum: [
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
    ],
  },
  description:
    'Ensemble model to use. Only one model per request — multi-value arrays are not supported by the API.',
},
```

To:
```ts
models: {
  type: 'string',
  enum: [
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
  ],
  description: 'Ensemble model to use. Only one model per request is supported.',
},
```

- [ ] **Step 5: Run tests**

```bash
npm test -- schema-fixes
```

Expected: PASS (all Fix 3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/tools.ts src/schema-fixes.test.ts
git commit -m "fix: change EnsembleModelsSchema from array to single enum, update ENSEMBLE_FORECAST_TOOL"
```

---

## Task 4: Add `current` array parameter to `weather_forecast`

**Files:**
- Modify: `src/types.ts:282-310` (ForecastParamsSchema)
- Modify: `src/tools.ts:167-170` (WEATHER_FORECAST_TOOL, after `current_weather`)
- Test: `src/schema-fixes.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/schema-fixes.test.ts`:

```ts
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

  it('WEATHER_FORECAST_TOOL should have a current property of type array', () => {
    const props = WEATHER_FORECAST_TOOL.inputSchema.properties as Record<string, unknown>;
    const current = props['current'] as Record<string, unknown>;
    expect(current).toBeDefined();
    expect(current['type']).toBe('array');
    const items = current['items'] as Record<string, unknown>;
    expect(items['enum']).toContain('temperature_2m');
    expect(items['enum']).toContain('wind_speed_10m');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- schema-fixes
```

Expected: FAIL (`current` not defined yet)

- [ ] **Step 3: Fix `ForecastParamsSchema` in `src/types.ts`**

In `ForecastParamsSchema` (line ~285), add one line after `current_weather`. Do NOT replace the whole schema — only insert this single line:

```ts
current_weather: z.boolean().optional(),
```

→ becomes:

```ts
current_weather: z.boolean().optional(),
current: HourlyVariablesSchema,
```

All other fields in the schema remain unchanged.

- [ ] **Step 4: Fix `WEATHER_FORECAST_TOOL` in `src/tools.ts`**

After the `current_weather` property (line ~170), add a `current` property. It must use the same enum values as `hourly` (lines 27–92). Insert after the `current_weather` block:

```ts
      current: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
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
          ],
        },
        description:
          'Current conditions variables to retrieve. Preferred over the deprecated current_weather boolean.',
      },
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests pass (including existing `archive-schema.test.ts`, `index.test.ts`, `security.test.ts`)

- [ ] **Step 6: Type check**

```bash
npm run typecheck
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/tools.ts src/schema-fixes.test.ts
git commit -m "fix: add current array parameter to ForecastParamsSchema and WEATHER_FORECAST_TOOL"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test
```

Expected: All tests pass

- [ ] **Run linter**

```bash
npm run lint
```

Expected: No errors
