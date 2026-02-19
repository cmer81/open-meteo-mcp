import axios, { type AxiosInstance } from 'axios';
import type {
  AirQualityParams,
  ArchiveParams,
  ClimateParams,
  ElevationParams,
  ElevationResponse,
  EnsembleParams,
  FloodParams,
  ForecastParams,
  GeocodingParams,
  GeocodingResponse,
  MarineParams,
  SeasonalParams,
  WeatherResponse,
} from './types.js';

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

  constructor(baseURL: string = process.env.OPEN_METEO_API_URL || 'https://api.open-meteo.com') {
    const config = {
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Open-Meteo-MCP-Server/1.0.0',
      },
    };

    // Utilisation des variables d'environnement avec des valeurs par défaut
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
    this.archiveClient = axios.create({ baseURL: archiveURL, ...config });
    this.seasonalClient = axios.create({ baseURL: seasonalURL, ...config });
    this.ensembleClient = axios.create({ baseURL: ensembleURL, ...config });
    this.geocodingClient = axios.create({ baseURL: geocodingURL, ...config });
    this.floodClient = axios.create({ baseURL: floodURL, ...config });
    this.climateClient = axios.create({ baseURL: climateURL, ...config });
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

  async getForecast(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/forecast', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getArchive(params: ArchiveParams): Promise<WeatherResponse> {
    const response = await this.archiveClient.get('/v1/archive', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getDwdIcon(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/dwd-icon', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getGfs(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/gfs', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getMeteoFrance(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/meteofrance', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getEcmwf(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/ecmwf', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getJma(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/jma', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getMetno(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/metno', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getGem(params: ForecastParams): Promise<WeatherResponse> {
    const response = await this.client.get('/v1/gem', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getAirQuality(params: AirQualityParams): Promise<WeatherResponse> {
    const response = await this.airQualityClient.get('/v1/air-quality', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getMarine(params: MarineParams): Promise<WeatherResponse> {
    const response = await this.marineClient.get('/v1/marine', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getEnsemble(params: EnsembleParams): Promise<WeatherResponse> {
    const response = await this.ensembleClient.get('/v1/ensemble', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getElevation(params: ElevationParams): Promise<ElevationResponse> {
    const response = await this.client.get('/v1/elevation', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getFlood(params: FloodParams): Promise<WeatherResponse> {
    const response = await this.floodClient.get('/v1/flood', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getSeasonal(params: SeasonalParams): Promise<WeatherResponse> {
    const response = await this.seasonalClient.get('/v1/seasonal', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getClimate(params: ClimateParams): Promise<WeatherResponse> {
    const response = await this.climateClient.get('/v1/climate', {
      params: this.buildParams(params),
    });
    return response.data;
  }

  async getGeocoding(params: GeocodingParams): Promise<GeocodingResponse> {
    const response = await this.geocodingClient.get('/v1/search', {
      params: this.buildParams(params),
    });
    return response.data;
  }
}
