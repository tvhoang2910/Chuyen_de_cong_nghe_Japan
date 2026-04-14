import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePushNotification } from '../hooks/usePushNotification';

const {
  fetchVapidPublicKey,
  subscribePush,
  unsubscribePush,
} = vi.hoisted(() => ({
  fetchVapidPublicKey: vi.fn(),
  subscribePush: vi.fn(),
  unsubscribePush: vi.fn(),
}));

vi.mock('../api/pushNotification', () => ({
  fetchVapidPublicKey,
  subscribePush,
  unsubscribePush,
}));

type MockSubscription = {
  endpoint: string;
  options: {
    applicationServerKey: ArrayBuffer | null;
  };
  toJSON: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
};

const toBase64Url = (bytes: number[]): string => {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const createSubscription = (
  endpoint: string,
  keyBytes: number[] | null,
  payload: Record<string, unknown>,
): MockSubscription => ({
  endpoint,
  options: {
    applicationServerKey: keyBytes ? Uint8Array.from(keyBytes).buffer : null,
  },
  toJSON: vi.fn().mockReturnValue(payload),
  unsubscribe: vi.fn().mockResolvedValue(true),
});

describe('usePushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'PushManager', {
      value: function MockPushManager() {
        return undefined;
      },
      configurable: true,
    });

    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted' },
      configurable: true,
    });

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn(),
        register: vi.fn(),
      },
      configurable: true,
    });
  });

  it('reuses existing subscription when applicationServerKey matches current VAPID key', async () => {
    const vapidBytes = [1, 2, 3, 4, 5, 6];
    const vapidPublicKey = toBase64Url(vapidBytes);

    const existingSubscription = createSubscription(
      'https://push.example.com/existing',
      vapidBytes,
      {
        endpoint: 'https://push.example.com/existing',
        keys: { p256dh: 'p256dh', auth: 'auth' },
      },
    );

    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(existingSubscription),
      subscribe: vi.fn(),
    };

    const registration = { pushManager };
    const getRegistration = vi.fn().mockResolvedValue(registration);

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        getRegistration,
        register: vi.fn(),
      },
      configurable: true,
    });

    fetchVapidPublicKey.mockResolvedValue(vapidPublicKey);
    subscribePush.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePushNotification());
    const success = await result.current.subscribe();

    expect(success).toBe(true);
    expect(fetchVapidPublicKey).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(unsubscribePush).not.toHaveBeenCalled();
    expect(existingSubscription.unsubscribe).not.toHaveBeenCalled();
    expect(subscribePush).toHaveBeenCalledWith(existingSubscription.toJSON());
  });

  it('recreates subscription when existing applicationServerKey is stale', async () => {
    const currentVapidBytes = [8, 7, 6, 5, 4, 3];
    const currentVapidPublicKey = toBase64Url(currentVapidBytes);

    const existingSubscription = createSubscription(
      'https://push.example.com/stale',
      [1, 1, 1, 1],
      {
        endpoint: 'https://push.example.com/stale',
        keys: { p256dh: 'old', auth: 'old' },
      },
    );

    const freshSubscription = createSubscription(
      'https://push.example.com/fresh',
      currentVapidBytes,
      {
        endpoint: 'https://push.example.com/fresh',
        keys: { p256dh: 'new', auth: 'new' },
      },
    );

    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(existingSubscription),
      subscribe: vi.fn().mockResolvedValue(freshSubscription),
    };

    const registration = { pushManager };

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(registration),
        register: vi.fn(),
      },
      configurable: true,
    });

    fetchVapidPublicKey.mockResolvedValue(currentVapidPublicKey);
    subscribePush.mockResolvedValue(undefined);
    unsubscribePush.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePushNotification());
    const success = await result.current.subscribe();

    expect(success).toBe(true);
    expect(unsubscribePush).toHaveBeenCalledWith(existingSubscription.endpoint);
    expect(existingSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);

    const subscribeArgs = pushManager.subscribe.mock.calls[0][0] as {
      userVisibleOnly: boolean;
      applicationServerKey: BufferSource;
    };

    expect(subscribeArgs.userVisibleOnly).toBe(true);

    const sentKey = subscribeArgs.applicationServerKey instanceof Uint8Array
      ? subscribeArgs.applicationServerKey
      : new Uint8Array(subscribeArgs.applicationServerKey as ArrayBuffer);

    expect(Array.from(sentKey)).toEqual(currentVapidBytes);
    expect(subscribePush).toHaveBeenCalledWith(freshSubscription.toJSON());
  });
});
