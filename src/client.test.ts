import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_TTL_MS, OpenMeteoClient } from './client.js';

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

describe('OpenMeteoClient response cache', () => {
  const getSpy = (client: OpenMeteoClient, name: string) =>
    vi.spyOn((client as unknown as Record<string, { get: unknown }>)[name], 'get' as never);

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves a repeated identical request from cache', async () => {
    const client = new OpenMeteoClient();
    const get = getSpy(client, 'client').mockResolvedValue({ data: { hourly: {} } } as never);

    await client.getForecast({ latitude: 48.85, longitude: 2.35 });
    await client.getForecast({ latitude: 48.85, longitude: 2.35 });

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keys on the path so sibling endpoints do not collide', async () => {
    const client = new OpenMeteoClient();
    const get = getSpy(client, 'client').mockImplementation((async (path: string) => ({
      data: { path },
    })) as never);

    const gfs = await client.getGfs({ latitude: 48.85, longitude: 2.35 });
    const jma = await client.getJma({ latitude: 48.85, longitude: 2.35 });

    expect(get).toHaveBeenCalledTimes(2);
    expect(gfs).not.toEqual(jma);
  });

  it('ignores parameter order when building the key', async () => {
    const client = new OpenMeteoClient();
    const get = getSpy(client, 'client').mockResolvedValue({ data: { hourly: {} } } as never);

    await client.getForecast({ latitude: 48.85, longitude: 2.35 });
    await client.getForecast({ longitude: 2.35, latitude: 48.85 });

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const client = new OpenMeteoClient();
    const get = getSpy(client, 'client')
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValue({ data: { hourly: {} } } as never);

    await expect(client.getForecast({ latitude: 48.85, longitude: 2.35 })).rejects.toThrow(
      'Network timeout',
    );
    await client.getForecast({ latitude: 48.85, longitude: 2.35 });

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('caches each endpoint with its own TTL', async () => {
    const client = new OpenMeteoClient();
    getSpy(client, 'client').mockResolvedValue({ data: { hourly: {} } } as never);
    getSpy(client, 'geocodingClient').mockResolvedValue({ data: { results: [] } } as never);
    const set = vi.spyOn((client as unknown as { cache: { set: unknown } }).cache, 'set' as never);

    await client.getForecast({ latitude: 48.85, longitude: 2.35 });
    await client.getGeocoding({ name: 'Paris' });

    expect(set).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/v1/forecast'),
      expect.anything(),
      expect.objectContaining({ ttl: CACHE_TTL_MS.forecast }),
    );
    expect(set).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/v1/search'),
      expect.anything(),
      expect.objectContaining({ ttl: CACHE_TTL_MS.geocoding }),
    );
  });

  it('is disabled when OPEN_METEO_CACHE_MAX_BYTES is 0', async () => {
    vi.stubEnv('OPEN_METEO_CACHE_MAX_BYTES', '0');
    const client = new OpenMeteoClient();
    const get = getSpy(client, 'client').mockResolvedValue({ data: { hourly: {} } } as never);

    await client.getForecast({ latitude: 48.85, longitude: 2.35 });
    await client.getForecast({ latitude: 48.85, longitude: 2.35 });

    expect(get).toHaveBeenCalledTimes(2);
  });
});
