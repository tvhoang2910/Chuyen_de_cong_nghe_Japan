import { expect, test, type Page, type Route } from '@playwright/test';

const ISO_NOW = '2026-04-11T10:00:00.000Z';

async function seedAdminSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'admin-e2e-token');
    localStorage.setItem('refresh_token', 'admin-e2e-refresh');
    localStorage.setItem('user_email', 'admin.e2e@example.com');
    localStorage.setItem('user_role', 'ADMIN');
  });
}

async function mockAdminShellApis(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'admin.e2e@example.com',
        fullName: 'Admin E2E',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'ADMIN',
        premium: true,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/review-queue?*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/purchase-requests/*/approvals', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route('**/api/v1/auth/push-subscription/vapid-public-key', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ publicKey: 'BOr7dummyVapidPublicKeyForE2ETestOnly1234567890abcXYZ' }),
    });
  });

  await page.route('**/api/v1/auth/push-subscription', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
}

test.describe('Admin subscription reviews history + cancel flow', () => {
  test('filters history and cancels an approved subscription with required reason', async ({ page }) => {
    await seedAdminSession(page);
    await mockAdminShellApis(page);

    let historyStatus = 'APPROVED';
    let cancelReason: string | null = null;

    await page.route('**/api/v1/auth/subscriptions/analytics/overview', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          monthlyRevenue: 2500000,
          activePremiumCount: 42,
          topPlanName: 'Premium 30 ngày',
          topPlanSubscriptions: 18,
          generatedAt: ISO_NOW,
        }),
      });
    });

    await page.route('**/api/v1/auth/subscriptions/history?*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 10,
              userId: 99,
              userEmail: 'premium.user@example.com',
              userFullName: 'Premium User',
              planId: 2,
              planName: 'Premium 30 ngày',
              purchasedPrice: 199000,
              status: historyStatus,
              billImageUrl: 'https://example.com/bill-10.jpg',
              paymentMethod: 'BANK_TRANSFER',
              transactionRef: 'TXN-1001',
              promoCode: null,
              trial: false,
              startDate: '2026-04-01T00:00:00Z',
              endDate: '2026-05-01T00:00:00Z',
              createdAt: '2026-04-01T01:00:00Z',
              cancellationReason: cancelReason,
              cancelledByEmail: cancelReason ? 'admin.e2e@example.com' : null,
              cancelledAt: cancelReason ? ISO_NOW : null,
              refundedAmount: cancelReason ? 99500 : null,
            },
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 10,
          first: true,
          last: true,
        }),
      });
    });

    await page.route('**/api/v1/auth/subscriptions/10/cancel', async (route: Route) => {
      const payload = route.request().postDataJSON() as { reason?: string };
      cancelReason = payload.reason ?? null;
      historyStatus = 'CANCELLED';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptionId: 10,
          previousStatus: 'APPROVED',
          currentStatus: 'CANCELLED',
          reason: cancelReason,
          refundPolicy: 'PRORATED_BY_REMAINING_TIME',
          refundRate: 0.5,
          refundAmount: 99500,
          cancelledAt: ISO_NOW,
        }),
      });
    });

    await page.goto('/admin/subscription-reviews');

    await expect(page.getByText('Doanh thu tháng')).toBeVisible();
    await expect(page.getByText('Premium User')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'APPROVED' })).toBeVisible();

    await page.getByRole('button', { name: 'Hủy gói' }).first().click();

    const modal = page.getByRole('heading', { name: 'Xác nhận hủy subscription' });
    await expect(modal).toBeVisible();

    const reasonBox = page.locator('textarea').first();
    await reasonBox.fill('Khach hang yeu cau huy goi ngay.');

    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();

    await expect(page.getByText('Đã hủy gói thành công')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CANCELLED' })).toBeVisible();
    await expect(page.getByText('Khach hang yeu cau huy goi ngay.')).toBeVisible();
  });
});
