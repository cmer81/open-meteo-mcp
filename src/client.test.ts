import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenMeteoClient } from './client.js';

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
