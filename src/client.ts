import axios, { type AxiosInstance } from 'axios';
import { LRUCache } from 'lru-cache';
import type {
  AirQualityParams,
  ArchiveParams,
  ClimateParams,
  DwdIconParams,
  EcmwfParams,
  ElevationParams,
  ElevationResponse,
  EnsembleParams,
  FloodParams,
  ForecastParams,
  GemParams,
  GeocodingParams,
  GeocodingResponse,
  GfsParams,
  JmaParams,
  MarineParams,
  MeteoFranceParams,
  MetnoParams,
  SeasonalParams,
  WeatherResponse,
} from './types.js';

export const MAX_RESPONSE_BYTES = 5_000_000;

export const MAX_ARCHIVE_RESPONSE_BYTES = 10_000_000;

export const MAX_REQUEST_BODY_BYTES = 1_000_000;

export const CACHE_MAX_BYTES = 20_000_000;

export const CACHE_TTL_MS = {
  forecast: 15 * 60 * 1000,
  ensemble: 15 * 60 * 1000,
  airQuality: 30 * 60 * 1000,
  marine: 30 * 60 * 1000,
  flood: 60 * 60 * 1000,
  seasonal: 6 * 60 * 60 * 1000,
  archive: 24 * 60 * 60 * 1000,
  climate: 24 * 60 * 60 * 1000,
  geocoding: 7 * 24 * 60 * 60 * 1000,
  elevation: 30 * 24 * 60 * 60 * 1000,
} as const;

export class OpenMeteoClient {
  private client: AxiosInstance;
  private airQualityClient: AxiosInstance;
  private marineClient: AxiosInstance;
  private archiveClient: AxiosInstance;
  private seasonalClient: AxiosInstance;
  private ensembleClient: AxiosInstance;
  private geocodingClient: AxiosInstance;
  private floodClient: AxiosInstance;
  private climateClient: AxiosInstance;
  private cache: LRUCache<string, object> | undefined;

  constructor(
    baseURL: string = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com',
    version = 'unknown',
  ) {
    const config = {
      timeout: 30000,
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_REQUEST_BODY_BYTES,
      headers: {
        Accept: 'application/json',
        'User-Agent': `Open-Meteo-MCP-Server/${version}`,
      },
    };

    // Environment variables with sensible defaults
    const airQualityURL =
      process.env.OPEN_METEO_AIR_QUALITY_API_URL || 'https://air-quality-api.open-meteo.com';
    const marineURL = process.env.OPEN_METEO_MARINE_API_URL || 'https://marine-api.open-meteo.com';
    const archiveURL =
      process.env.OPEN_METEO_ARCHIVE_API_URL || 'https://archive-api.open-meteo.com';
    const seasonalURL =
      process.env.OPEN_METEO_SEASONAL_API_URL || 'https://seasonal-api.open-meteo.com';
    const ensembleURL =
      process.env.OPEN_METEO_ENSEMBLE_API_URL || 'https://ensemble-api.open-meteo.com';
    const geocodingURL =
      process.env.OPEN_METEO_GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com';
    const floodURL = process.env.OPEN_METEO_FLOOD_API_URL || 'https://flood-api.open-meteo.com';
    const climateURL =
      process.env.OPEN_METEO_CLIMATE_API_URL || 'https://climate-api.open-meteo.com';

    this.client = axios.create({ baseURL, ...config });
    this.airQualityClient = axios.create({ baseURL: airQualityURL, ...config });
    this.marineClient = axios.create({ baseURL: marineURL, ...config });
    this.archiveClient = axios.create({
      baseURL: archiveURL,
      ...config,
      maxContentLength: MAX_ARCHIVE_RESPONSE_BYTES,
    });
    this.seasonalClient = axios.create({ baseURL: seasonalURL, ...config });
    this.ensembleClient = axios.create({ baseURL: ensembleURL, ...config });
    this.geocodingClient = axios.create({ baseURL: geocodingURL, ...config });
    this.floodClient = axios.create({ baseURL: floodURL, ...config });
    this.climateClient = axios.create({
      baseURL: climateURL,
      ...config,
      maxContentLength: MAX_ARCHIVE_RESPONSE_BYTES,
    });

    const configured = Number(process.env.OPEN_METEO_CACHE_MAX_BYTES ?? CACHE_MAX_BYTES);
    const maxSize = Number.isFinite(configured) && configured >= 0 ? configured : CACHE_MAX_BYTES;
    this.cache = maxSize > 0 ? new LRUCache<string, object>({ maxSize }) : undefined;

    this.setupErrorInterceptors();
  }

  private setupErrorInterceptors(): void {
    for (const instance of [
      this.client,
      this.airQualityClient,
      this.marineClient,
      this.archiveClient,
      this.seasonalClient,
      this.ensembleClient,
      this.geocodingClient,
      this.floodClient,
      this.climateClient,
    ]) {
      instance.interceptors.response.use(undefined, OpenMeteoClient.mapHttpError);
    }
  }

  private static mapHttpError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.message.startsWith('maxContentLength size of')) {
        throw new Error(
          'Response too large to process. Narrow the request: shorten the start_date/end_date range or request fewer variables.',
        );
      }

      const status = error.response?.status;
      const data = error.response?.data as Record<string, unknown> | undefined;
      const apiMessage =
        (data?.reason as string | undefined) ??
        (data?.error as string | undefined) ??
        error.message;

      if (status === 400) throw new Error(`Invalid request parameters: ${apiMessage}`);
      if (status === 422) throw new Error(`Invalid parameter value: ${apiMessage}`);
      if (status === 429) throw new Error('Open-Meteo rate limit reached. Please retry later.');
      if (status !== undefined && status >= 500)
        throw new Error(`Open-Meteo server error (${status}): ${apiMessage}`);
    }
    throw error;
  }

  private buildParams(params: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          result[key] = value.join(',');
        } else {
          result[key] = String(value);
        }
      }
    }

    return result;
  }

  // The cached value is handed out by reference; callers must not mutate it.
  private async cachedGet<T extends object>(
    instance: AxiosInstance,
    path: string,
    params: Record<string, unknown>,
    ttl: number,
    signal?: AbortSignal,
  ): Promise<T> {
    const query = this.buildParams(params);
    const sorted = Object.entries(query).sort(([a], [b]) => a.localeCompare(b));
    const key = `${path}?${new URLSearchParams(sorted).toString()}`;

    const hit = this.cache?.get(key);
    if (hit !== undefined) return hit as T;

    const response = await instance
      .get(path, { params: query, ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    const data = response.data as T;

    // Sized in serialized JSON; the parsed object retains roughly 1.3-2x that.
    this.cache?.set(key, data, { ttl, size: Math.max(JSON.stringify(data).length, 1) });

    return data;
  }

  async getForecast(params: ForecastParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/forecast',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getArchive(params: ArchiveParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.archiveClient,
      '/v1/archive',
      params,
      CACHE_TTL_MS.archive,
      signal,
    );
  }

  async getDwdIcon(params: DwdIconParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/dwd-icon',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getGfs(params: GfsParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/gfs',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getMeteoFrance(params: MeteoFranceParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/meteofrance',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getEcmwf(params: EcmwfParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/ecmwf',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getJma(params: JmaParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/jma',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getMetno(params: MetnoParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/metno',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getGem(params: GemParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.client,
      '/v1/gem',
      params,
      CACHE_TTL_MS.forecast,
      signal,
    );
  }

  async getAirQuality(params: AirQualityParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.airQualityClient,
      '/v1/air-quality',
      params,
      CACHE_TTL_MS.airQuality,
      signal,
    );
  }

  async getMarine(params: MarineParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.marineClient,
      '/v1/marine',
      params,
      CACHE_TTL_MS.marine,
      signal,
    );
  }

  async getEnsemble(params: EnsembleParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.ensembleClient,
      '/v1/ensemble',
      params,
      CACHE_TTL_MS.ensemble,
      signal,
    );
  }

  async getElevation(params: ElevationParams, signal?: AbortSignal): Promise<ElevationResponse> {
    return this.cachedGet<ElevationResponse>(
      this.client,
      '/v1/elevation',
      params,
      CACHE_TTL_MS.elevation,
      signal,
    );
  }

  async getFlood(params: FloodParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.floodClient,
      '/v1/flood',
      params,
      CACHE_TTL_MS.flood,
      signal,
    );
  }

  async getSeasonal(params: SeasonalParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.seasonalClient,
      '/v1/seasonal',
      params,
      CACHE_TTL_MS.seasonal,
      signal,
    );
  }

  async getClimate(params: ClimateParams, signal?: AbortSignal): Promise<WeatherResponse> {
    return this.cachedGet<WeatherResponse>(
      this.climateClient,
      '/v1/climate',
      params,
      CACHE_TTL_MS.climate,
      signal,
    );
  }

  async getGeocoding(params: GeocodingParams, signal?: AbortSignal): Promise<GeocodingResponse> {
    return this.cachedGet<GeocodingResponse>(
      this.geocodingClient,
      '/v1/search',
      params,
      CACHE_TTL_MS.geocoding,
      signal,
    );
  }
}
