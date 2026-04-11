import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelSubscriptionByAdmin,
  fetchSubscriptionAnalyticsOverview,
  fetchSubscriptionHistory,
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

describe('axiosClient subscription review extensions', () => {
  beforeEach(() => {
    getItemMock.mockReturnValue(null);
    mockClient.get.mockReset();
    mockClient.patch.mockReset();
    mockRefreshClient.post.mockReset();
  });

  it('fetchSubscriptionHistory builds query params and calls history endpoint', async () => {
    const payload = {
      content: [
        {
          id: 10,
          userId: 7,
          userEmail: 'admin@example.com',
          userFullName: 'Admin User',
          planId: 2,
          planName: 'Premium 30',
          purchasedPrice: 199000,
          status: 'APPROVED',
          billImageUrl: 'https://img.example.com/bill.jpg',
          trial: false,
          startDate: '2026-04-01T00:00:00Z',
          endDate: '2026-05-01T00:00:00Z',
          createdAt: '2026-04-01T00:00:00Z',
        },
      ],
      number: 1,
      size: 5,
      totalElements: 11,
      totalPages: 3,
      first: false,
      last: false,
    };
    mockClient.get.mockResolvedValue({ data: payload });

    const result = await fetchSubscriptionHistory({
      search: 'admin',
      status: 'APPROVED',
      from: '2026-04-01',
      to: '2026-04-11',
      page: 1,
      size: 5,
      sort: 'createdAt,asc',
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      '/subscriptions/history?page=1&size=5&sort=createdAt%2Casc&search=admin&status=APPROVED&from=2026-04-01&to=2026-04-11',
    );
    expect(result).toEqual(payload);
  });

  it('cancelSubscriptionByAdmin calls cancel endpoint with reason', async () => {
    const payload = {
      subscriptionId: 10,
      previousStatus: 'APPROVED',
      currentStatus: 'CANCELLED',
      reason: 'Khach hang yeu cau',
      refundPolicy: 'PRORATED_BY_REMAINING_TIME',
      refundRate: 0.5,
      refundAmount: 99500,
      cancelledAt: '2026-04-11T09:00:00Z',
    };
    mockClient.patch.mockResolvedValue({ data: payload });

    const result = await cancelSubscriptionByAdmin(10, {
      reason: 'Khach hang yeu cau',
    });

    expect(mockClient.patch).toHaveBeenCalledWith('/subscriptions/10/cancel', {
      reason: 'Khach hang yeu cau',
    });
    expect(result.currentStatus).toBe('CANCELLED');
    expect(result.refundAmount).toBe(99500);
  });

  it('fetchSubscriptionAnalyticsOverview caches value for subsequent calls', async () => {
    const payload = {
      monthlyRevenue: 1230000,
      activePremiumCount: 25,
      topPlanName: 'Premium 30',
      topPlanSubscriptions: 11,
      generatedAt: '2026-04-11T10:00:00Z',
    };
    mockClient.get.mockResolvedValue({ data: payload });

    const first = await fetchSubscriptionAnalyticsOverview();
    const second = await fetchSubscriptionAnalyticsOverview();

    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(mockClient.get).toHaveBeenCalledWith('/subscriptions/analytics/overview');
    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
  });
});
