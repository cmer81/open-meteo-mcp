import { describe, expect, it } from 'vitest';
import { WEATHER_ARCHIVE_TOOL } from './tools.js';
import {
  ArchiveDailyVariablesSchema,
  ArchiveHourlyVariablesSchema,
  ArchiveParamsSchema,
} from './types.js';

describe('ArchiveHourlyVariablesSchema', () => {
  it('should be defined as a dedicated schema', () => {
    expect(ArchiveHourlyVariablesSchema).toBeDefined();
  });

  it('should accept valid ERA5 hourly variables', () => {
    const era5Variables = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'wind_speed_10m',
      'wind_direction_10m',
      'shortwave_radiation',
      'soil_moisture_0_to_7cm',
      'soil_moisture_7_to_28cm',
      'soil_moisture_28_to_100cm',
      'soil_moisture_100_to_255cm',
      'soil_temperature_0_to_7cm',
      'soil_temperature_7_to_28cm',
      'soil_temperature_28_to_100cm',
      'soil_temperature_100_to_255cm',
      'surface_temperature',
      'wind_speed_100m',
      'wind_direction_100m',
      'dew_point_2m',
      'surface_pressure',
      'is_day',
      'sunshine_duration',
    ];

    expect(() => ArchiveHourlyVariablesSchema.parse(era5Variables)).not.toThrow();
  });

  it('should reject forecast-only variables that ERA5 does not support', () => {
    // These variables exist in HourlyVariablesSchema (forecast) but NOT in ERA5 archive
    const forecastOnlyVariables = ['precipitation_probability'];
    expect(() => ArchiveHourlyVariablesSchema.parse(forecastOnlyVariables)).toThrow();
  });

  it('should reject boundary_layer_height_pbl which is forecast-only', () => {
    expect(() => ArchiveHourlyVariablesSchema.parse(['boundary_layer_height_pbl'])).toThrow();
  });

  it('should reject forecast-specific soil moisture variables (1cm/3cm/9cm layers)', () => {
    // ERA5 uses 0_to_7cm layers, not forecast's 0_to_1cm / 1_to_3cm layers
    expect(() => ArchiveHourlyVariablesSchema.parse(['soil_moisture_0_to_1cm'])).toThrow();
    expect(() => ArchiveHourlyVariablesSchema.parse(['soil_moisture_1_to_3cm'])).toThrow();
    expect(() => ArchiveHourlyVariablesSchema.parse(['soil_moisture_3_to_9cm'])).toThrow();
    expect(() => ArchiveHourlyVariablesSchema.parse(['soil_moisture_9_to_27cm'])).toThrow();
    expect(() => ArchiveHourlyVariablesSchema.parse(['soil_moisture_27_to_81cm'])).toThrow();
  });
});

describe('ArchiveDailyVariablesSchema', () => {
  it('should be defined as a dedicated schema', () => {
    expect(ArchiveDailyVariablesSchema).toBeDefined();
  });

  it('should accept valid ERA5 daily variables', () => {
    const era5DailyVariables = [
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
    ];

    expect(() => ArchiveDailyVariablesSchema.parse(era5DailyVariables)).not.toThrow();
  });

  it('should reject forecast-only daily variables', () => {
    // precipitation_probability_max is a forecast variable, not ERA5
    expect(() => ArchiveDailyVariablesSchema.parse(['precipitation_probability_max'])).toThrow();
    expect(() => ArchiveDailyVariablesSchema.parse(['precipitation_probability_mean'])).toThrow();
    expect(() => ArchiveDailyVariablesSchema.parse(['showers_sum'])).toThrow();
  });
});

describe('ArchiveParamsSchema uses archive-specific schemas', () => {
  it('should reject forecast-only hourly variables in archive params', () => {
    const params = {
      latitude: 48.8566,
      longitude: 2.3522,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
      hourly: ['precipitation_probability'], // forecast-only variable
    };

    expect(() => ArchiveParamsSchema.parse(params)).toThrow();
  });

  it('should accept ERA5-specific soil moisture layers in archive params', () => {
    const params = {
      latitude: 48.8566,
      longitude: 2.3522,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
      hourly: ['soil_moisture_0_to_7cm', 'surface_temperature'],
    };

    expect(() => ArchiveParamsSchema.parse(params)).not.toThrow();
  });

  it('should reject forecast-only daily variables in archive params', () => {
    const params = {
      latitude: 48.8566,
      longitude: 2.3522,
      start_date: '2024-01-01',
      end_date: '2024-01-07',
      daily: ['precipitation_probability_max'], // forecast-only variable
    };

    expect(() => ArchiveParamsSchema.parse(params)).toThrow();
  });
});

describe('WEATHER_ARCHIVE_TOOL schema alignment', () => {
  const toolInputSchema = WEATHER_ARCHIVE_TOOL.inputSchema;
  const hourlyEnum: string[] =
    (toolInputSchema.properties as Record<string, { items?: { enum?: string[] } }>).hourly?.items
      ?.enum ?? [];
  const dailyEnum: string[] =
    (toolInputSchema.properties as Record<string, { items?: { enum?: string[] } }>).daily?.items
      ?.enum ?? [];

  it('should include ERA5-specific hourly variables in tool schema', () => {
    expect(hourlyEnum).toContain('soil_moisture_0_to_7cm');
    expect(hourlyEnum).toContain('soil_moisture_7_to_28cm');
    expect(hourlyEnum).toContain('soil_moisture_28_to_100cm');
    expect(hourlyEnum).toContain('soil_moisture_100_to_255cm');
    expect(hourlyEnum).toContain('surface_temperature');
    expect(hourlyEnum).toContain('soil_temperature_0_to_7cm');
    expect(hourlyEnum).toContain('wind_speed_100m');
    expect(hourlyEnum).toContain('wind_direction_100m');
  });

  it('should not include forecast-only variables in tool hourly schema', () => {
    expect(hourlyEnum).not.toContain('precipitation_probability');
    expect(hourlyEnum).not.toContain('boundary_layer_height_pbl');
    expect(hourlyEnum).not.toContain('soil_moisture_0_to_1cm');
    expect(hourlyEnum).not.toContain('soil_moisture_1_to_3cm');
  });

  it('should include ERA5 daily variables in tool schema', () => {
    expect(dailyEnum).toContain('temperature_2m_mean');
    expect(dailyEnum).toContain('apparent_temperature_mean');
    expect(dailyEnum).toContain('precipitation_sum');
  });

  it('should not include forecast-only daily variables in tool schema', () => {
    expect(dailyEnum).not.toContain('precipitation_probability_max');
    expect(dailyEnum).not.toContain('showers_sum');
  });
});
