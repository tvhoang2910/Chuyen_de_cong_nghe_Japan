import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  fetchMySubscriptionRequests,
  fetchPremiumPlans,
  type PremiumPlanSummary,
  type UserSubscriptionQueueItem,
} from '../api/axiosClient';
import SubscriptionPayments from '../pages/SubscriptionPayments';

vi.mock('../api/axiosClient', async () => {
  const actual = await vi.importActual<typeof import('../api/axiosClient')>('../api/axiosClient');

  return {
    ...actual,
    fetchPremiumPlans: vi.fn(),
    fetchMySubscriptionRequests: vi.fn(),
    createSubscriptionPurchaseRequest: vi.fn(),
    fetchSubscriptionBillImage: vi.fn(),
  };
});

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockPlans: PremiumPlanSummary[] = [
  {
    id: 1,
    name: 'Premium 30',
    price: 199000,
    durationDays: 30,
    lifetime: false,
    description: 'Goi theo thang',
    active: true,
  },
];

const baseRequest: UserSubscriptionQueueItem = {
  id: 100,
  userId: 9,
  userEmail: 'premium.user@example.com',
  userFullName: 'Premium User',
  planId: 1,
  planName: 'Premium 30',
  purchasedPrice: 199000,
  status: 'PENDING_REVIEW',
  billImageUrl: 'https://example.com/bill.png',
  paymentMethod: 'bank_transfer',
  transactionRef: 'TXN-1',
  promoCode: null,
  trial: false,
  startDate: '2026-04-10T00:00:00Z',
  endDate: '2026-05-10T00:00:00Z',
  createdAt: '2026-04-10T00:00:00Z',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <SubscriptionPayments />
    </MemoryRouter>,
  );

describe('SubscriptionPayments purchase guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPremiumPlans).mockResolvedValue(mockPlans);
  });

  it('disables purchase form when there is a pending premium request', async () => {
    vi.mocked(fetchMySubscriptionRequests).mockResolvedValue([
      {
        ...baseRequest,
        status: 'PENDING_REVIEW',
      },
    ]);

    renderPage();

    expect(await screen.findByText('Nâng cấp Premium qua QR Banking')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Bạn đang có yêu cầu Premium chờ duyệt. Vui lòng đợi kết quả trước khi gửi yêu cầu khác.',
        ),
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Đang chờ duyệt yêu cầu trước' });
    expect(submitButton).toBeDisabled();
  });

  it('disables purchase form when an approved subscription is still active', async () => {
    vi.mocked(fetchMySubscriptionRequests).mockResolvedValue([
      {
        ...baseRequest,
        status: 'APPROVED',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2099-01-01T00:00:00Z',
      },
    ]);

    renderPage();

    expect(await screen.findByText('Nâng cấp Premium qua QR Banking')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('Tài khoản đang có Premium hiệu lực. Bạn chưa thể mua thêm gói mới.'),
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: 'Đang có Premium hiệu lực' });
    expect(submitButton).toBeDisabled();
  });
});
