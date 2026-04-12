import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchNotificationPreferences,
  fetchUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  updateNotificationPreferences,
} from '../api/axiosClient';

const getItemMock = vi.fn();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: getItemMock,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

const { mockClient, mockRefreshClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
  mockRefreshClient: {
    post: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi
      .fn()
      .mockImplementationOnce(() => mockClient)
      .mockImplementationOnce(() => mockRefreshClient),
  },
}));

describe('axiosClient notification extensions', () => {
  beforeEach(() => {
    getItemMock.mockReturnValue(null);
    mockClient.get.mockReset();
    mockClient.patch.mockReset();
    mockRefreshClient.post.mockReset();
  });

  it('fetchNotificationPreferences caches response for repeated calls', async () => {
    const payload = {
      emailEnabled: true,
      webPushEnabled: false,
    };
    mockClient.get.mockResolvedValue({ data: payload });

    const first = await fetchNotificationPreferences();
    const second = await fetchNotificationPreferences();

    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(mockClient.get).toHaveBeenCalledWith('/notifications/preferences');
    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
  });

  it('updateNotificationPreferences sends patch payload', async () => {
    const payload = {
      emailEnabled: false,
      webPushEnabled: true,
    };
    mockClient.patch.mockResolvedValue({ data: payload });

    const result = await updateNotificationPreferences({ emailEnabled: false });

    expect(mockClient.patch).toHaveBeenCalledWith('/notifications/preferences', {
      emailEnabled: false,
    });
    expect(result).toEqual(payload);
  });

  it('markUserNotificationRead invalidates notification list cache', async () => {
    const firstPagePayload = {
      content: [
        {
          id: 501,
          type: 'SUBSCRIPTION_REVIEWED',
          title: 'Yeu cau Premium da duoc duyet',
          message: 'Goi Premium 30 da duoc duyet',
          actionUrl: '/dashboard/subscription-payments',
          read: false,
          createdAt: '2026-04-11T08:00:00Z',
          readAt: null,
        },
      ],
      number: 9,
      size: 2,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      unreadCount: 1,
    };
    const reloadedPagePayload = {
      ...firstPagePayload,
      content: [
        {
          ...firstPagePayload.content[0],
          read: true,
          readAt: '2026-04-11T08:05:00Z',
        },
      ],
      unreadCount: 0,
    };

    mockClient.get.mockResolvedValueOnce({ data: firstPagePayload });
    await fetchUserNotifications(9, 2);

    mockClient.patch.mockResolvedValueOnce({ data: reloadedPagePayload.content[0] });
    await markUserNotificationRead(501);

    mockClient.get.mockResolvedValueOnce({ data: reloadedPagePayload });
    await fetchUserNotifications(9, 2);

    expect(mockClient.patch).toHaveBeenCalledWith('/notifications/501/read');
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });

  it('markAllUserNotificationsRead returns updated count and invalidates cache', async () => {
    const initialPagePayload = {
      content: [
        {
          id: 601,
          type: 'SUBSCRIPTION_EXPIRY_REMINDER',
          title: 'Goi Premium sap het han',
          message: 'Goi Premium 30 se het han vao 2026-04-14T00:00:00Z',
          actionUrl: '/dashboard/subscription-payments',
          read: false,
          createdAt: '2026-04-11T09:00:00Z',
          readAt: null,
        },
      ],
      number: 10,
      size: 3,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      unreadCount: 1,
    };
    const reloadedPagePayload = {
      ...initialPagePayload,
      content: [
        {
          ...initialPagePayload.content[0],
          read: true,
          readAt: '2026-04-11T09:02:00Z',
        },
      ],
      unreadCount: 0,
    };

    mockClient.get.mockResolvedValueOnce({ data: initialPagePayload });
    await fetchUserNotifications(10, 3);

    mockClient.patch.mockResolvedValueOnce({ data: { updatedCount: 1 } });
    const updatedCount = await markAllUserNotificationsRead();

    mockClient.get.mockResolvedValueOnce({ data: reloadedPagePayload });
    await fetchUserNotifications(10, 3);

    expect(updatedCount).toBe(1);
    expect(mockClient.patch).toHaveBeenCalledWith('/notifications/read-all');
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});
