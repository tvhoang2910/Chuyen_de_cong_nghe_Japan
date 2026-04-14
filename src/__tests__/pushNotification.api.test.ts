import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchVapidPublicKey } from '../api/pushNotification';

describe('pushNotification API helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchVapidPublicKey calls public endpoint without Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ publicKey: 'test-vapid-key' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const key = await fetchVapidPublicKey();

    expect(key).toBe('test-vapid-key');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(calledUrl).toContain('/api/v1/auth/push-subscription/vapid-public-key');
    expect(calledInit).toBeUndefined();
  });
});