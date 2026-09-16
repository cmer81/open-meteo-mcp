import type { AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_ARCHIVE_RESPONSE_BYTES,
  MAX_REQUEST_BODY_BYTES,
  MAX_RESPONSE_BYTES,
  OpenMeteoClient,
} from './client.js';

describe('OpenMeteoClient error interceptor', () => {
  let client: OpenMeteoClient;

  beforeEach(() => {
    client = new OpenMeteoClient();
  });

  it('throws structured message on HTTP 400', async () => {
    const axiosError = Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { reason: 'Invalid latitude' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(client.getForecast({ latitude: 999, longitude: 0 })).rejects.toThrow(
      'Invalid request parameters: Invalid latitude',
    );
  });

  it('throws structured message on HTTP 422', async () => {
    const axiosError = Object.assign(new Error('Unprocessable Entity'), {
      isAxiosError: true,
      response: { status: 422, data: { error: 'Cannot initialize model for given coordinates' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(client.getForecast({ latitude: 0, longitude: 0 })).rejects.toThrow(
      'Invalid parameter value: Cannot initialize model for given coordinates',
    );
  });

  it('throws structured message on HTTP 429', async () => {
    const axiosError = Object.assign(new Error('Too Many Requests'), {
      isAxiosError: true,
      response: { status: 429, data: {} },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(client.getForecast({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow(
      'Open-Meteo rate limit reached. Please retry later.',
    );
  });

  it('throws structured message on HTTP 500', async () => {
    const axiosError = Object.assign(new Error('Internal Server Error'), {
      isAxiosError: true,
      response: { status: 500, data: { reason: 'Upstream failure' } },
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(client.getForecast({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow(
      'Open-Meteo server error (500): Upstream failure',
    );
  });

  it('relays non-Axios errors unchanged', async () => {
    const networkError = new Error('Network timeout');
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(networkError);

    await expect(client.getForecast({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow(
      'Network timeout',
    );
  });

  it('applies to archiveClient (HTTP 400)', async () => {
    const axiosError = Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { reason: 'Invalid date range' } },
    });
    vi.spyOn(
      (client as unknown as { archiveClient: { get: unknown } }).archiveClient,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getArchive({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: 'bad',
        end_date: 'bad',
      }),
    ).rejects.toThrow('Invalid request parameters: Invalid date range');
  });
});

describe('OpenMeteoClient response size limits', () => {
  const defaultsFor = (client: OpenMeteoClient, name: string) =>
    (client as unknown as Record<string, AxiosInstance>)[name].defaults;

  it('caps response size on the shared clients', () => {
    const client = new OpenMeteoClient();

    for (const name of [
      'client',
      'airQualityClient',
      'marineClient',
      'seasonalClient',
      'ensembleClient',
      'geocodingClient',
      'floodClient',
    ]) {
      expect(defaultsFor(client, name).maxContentLength).toBe(MAX_RESPONSE_BYTES);
      expect(defaultsFor(client, name).maxBodyLength).toBe(MAX_REQUEST_BODY_BYTES);
    }
  });

  it('gives archive and climate a looser cap', () => {
    const client = new OpenMeteoClient();

    for (const name of ['archiveClient', 'climateClient']) {
      expect(defaultsFor(client, name).maxContentLength).toBe(MAX_ARCHIVE_RESPONSE_BYTES);
    }
  });

  it('maps an exceeded maxContentLength to an actionable message', async () => {
    const client = new OpenMeteoClient();
    const axiosError = Object.assign(new Error('maxContentLength size of 10000000 exceeded'), {
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
    });
    vi.spyOn(
      (client as unknown as { archiveClient: { get: unknown } }).archiveClient,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(
      client.getArchive({
        latitude: 48.8566,
        longitude: 2.3522,
        start_date: '1940-01-01',
        end_date: '2024-12-31',
      }),
    ).rejects.toThrow('Response too large to process.');
  });

  it('relays other ERR_BAD_RESPONSE errors unchanged', async () => {
    const client = new OpenMeteoClient();
    const axiosError = Object.assign(new Error('stream has been aborted'), {
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
    });
    vi.spyOn(
      (client as unknown as { client: { get: unknown } }).client,
      'get',
    ).mockRejectedValueOnce(axiosError);

    await expect(client.getForecast({ latitude: 48.8566, longitude: 2.3522 })).rejects.toThrow(
      'stream has been aborted',
    );
  });
});
