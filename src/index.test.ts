import { describe, expect, it } from 'vitest';
import { OpenMeteoClient } from './client.js';
import { ALL_TOOLS } from './tools.js';
import {
  AirQualityParamsSchema,
  ArchiveParamsSchema,
  ElevationParamsSchema,
  ForecastParamsSchema,
  GeocodingParamsSchema,
  LocationSchema,
  MarineParamsSchema,
} from './types.js';

// Basic import tests
describe('Module imports', () => {
  it('should import types successfully', () => {
    expect(ForecastParamsSchema).toBeDefined();
    expect(ArchiveParamsSchema).toBeDefined();
    expect(AirQualityParamsSchema).toBeDefined();
    expect(MarineParamsSchema).toBeDefined();
    expect(ElevationParamsSchema).toBeDefined();
    expect(GeocodingParamsSchema).toBeDefined();
    expect(LocationSchema).toBeDefined();
  });

  it('should validate coordinates schema', () => {
    const validParams = {
      latitude: 48.8566,
      longitude: 2.3522,
    };

    expect(() => ForecastParamsSchema.parse(validParams)).not.toThrow();

    const invalidParams = {
      latitude: 91, // Invalid latitude
      longitude: 2.3522,
    };

    expect(() => ForecastParamsSchema.parse(invalidParams)).toThrow();
  });

  it('should validate geocoding parameters', () => {
    const validGeocodingParams = {
      name: 'Paris',
      count: 5,
    };

    expect(() => GeocodingParamsSchema.parse(validGeocodingParams)).not.toThrow();

    // Test avec les nouveaux paramètres optionnels
    const validGeocodingParamsWithOptional = {
      name: 'Berlin',
      count: 3,
      language: 'fr',
      countryCode: 'DE',
    };

    expect(() => GeocodingParamsSchema.parse(validGeocodingParamsWithOptional)).not.toThrow();

    const invalidGeocodingParams = {
      name: 'P', // Too short
      count: 5,
    };

    expect(() => GeocodingParamsSchema.parse(invalidGeocodingParams)).toThrow();

    // Test avec un code pays invalide
    const invalidCountryCode = {
      name: 'Lyon',
      countryCode: 'FRA', // Doit être 2 caractères
    };

    expect(() => GeocodingParamsSchema.parse(invalidCountryCode)).toThrow(
      'Le code pays doit être au format ISO-3166-1 alpha2',
    );
  });

  it('should import tools successfully', () => {
    expect(ALL_TOOLS).toBeDefined();
    expect(Array.isArray(ALL_TOOLS)).toBe(true);
    expect(ALL_TOOLS.length).toBeGreaterThan(0);

    // Vérifier que l'outil de géocodage est présent
    const geocodingTool = ALL_TOOLS.find((tool) => tool.name === 'geocoding');
    expect(geocodingTool).toBeDefined();
    expect(geocodingTool?.description).toContain('Search for locations');
  });

  it('should import client successfully', () => {
    expect(OpenMeteoClient).toBeDefined();
    const client = new OpenMeteoClient();
    expect(client).toBeInstanceOf(OpenMeteoClient);
  });
});
