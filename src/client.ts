import axios, { type AxiosInstance } from 'axios';
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

  async getForecast(params: ForecastParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/forecast', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getArchive(params: ArchiveParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.archiveClient
      .get('/v1/archive', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getDwdIcon(params: DwdIconParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/dwd-icon', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getGfs(params: GfsParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/gfs', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getMeteoFrance(params: MeteoFranceParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/meteofrance', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getEcmwf(params: EcmwfParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/ecmwf', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getJma(params: JmaParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/jma', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getMetno(params: MetnoParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/metno', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getGem(params: GemParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.client
      .get('/v1/gem', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getAirQuality(params: AirQualityParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.airQualityClient
      .get('/v1/air-quality', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getMarine(params: MarineParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.marineClient
      .get('/v1/marine', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getEnsemble(params: EnsembleParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.ensembleClient
      .get('/v1/ensemble', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getElevation(params: ElevationParams, signal?: AbortSignal): Promise<ElevationResponse> {
    const response = await this.client
      .get('/v1/elevation', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getFlood(params: FloodParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.floodClient
      .get('/v1/flood', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getSeasonal(params: SeasonalParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.seasonalClient
      .get('/v1/seasonal', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getClimate(params: ClimateParams, signal?: AbortSignal): Promise<WeatherResponse> {
    const response = await this.climateClient
      .get('/v1/climate', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }

  async getGeocoding(params: GeocodingParams, signal?: AbortSignal): Promise<GeocodingResponse> {
    const response = await this.geocodingClient
      .get('/v1/search', { params: this.buildParams(params), ...(signal && { signal }) })
      .catch(OpenMeteoClient.mapHttpError);
    return response.data;
  }
}
