import { expect, test, type Page, type Route } from '@playwright/test';
import {
  mockUserShellApis,
  seedAuthenticatedUser,
} from './helpers/browser-auth';

const ISO_NOW = '2026-04-12T08:00:00.000Z';
async function mockPremiumPlans(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/subscriptions/plans', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          name: 'Premium 30 ngày',
          price: 199000,
          durationDays: 30,
          lifetime: false,
          description: 'Gói premium theo tháng',
          active: true,
        },
        ]),
      });
  });
}

test.describe('Premium paywall flow', () => {
  test('public exams list shows premium badge and teaser hint', async ({ page }) => {
    await seedAuthenticatedUser(page, {
      userId: 12,
      email: 'premium-e2e-user@example.com',
      fullName: 'Premium E2E User',
    });
    await mockUserShellApis(page, {
      userId: 12,
      email: 'premium-e2e-user@example.com',
      fullName: 'Premium E2E User',
      premium: false,
    });
    await mockPremiumPlans(page);

    await page.route('**/api/v1/exam/exams/public', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 81,
            title: 'Đề miễn phí',
            description: 'Đề cho tất cả user',
            durationMinutes: 20,
            passingScore: 5,
            maxAttempts: 3,
            premium: false,
            teaserQuestionCount: 2,
            premiumLocked: false,
            tags: [],
            totalQuestions: 10,
            status: 'PUBLISHED',
            createdAt: ISO_NOW,
            modifiedAt: ISO_NOW,
          },
          {
            id: 82,
            title: 'Đề luyện chuyên sâu Premium',
            description: 'Đề nâng cao cần gói Premium',
            durationMinutes: 45,
            passingScore: 7,
            maxAttempts: 2,
            premium: true,
            teaserQuestionCount: 2,
            premiumLocked: true,
            tags: [{ id: 1, name: 'Nâng cao' }],
            totalQuestions: 50,
            status: 'PUBLISHED',
            createdAt: ISO_NOW,
            modifiedAt: ISO_NOW,
          },
        ]),
      });
    });

    await page.goto('/dashboard/exams');

    await expect(page.getByText('Đề luyện chuyên sâu Premium')).toBeVisible();
    await expect(page.getByText('Premium').first()).toBeVisible();
    await expect(page.getByText('Người dùng miễn phí chỉ xem thử 2 câu đầu.')).toBeVisible();
  });

  test('premium locked attempt shows teaser and upgrade modal', async ({ page }) => {
    await seedAuthenticatedUser(page, {
      userId: 12,
      email: 'premium-e2e-user@example.com',
      fullName: 'Premium E2E User',
    });
    await mockUserShellApis(page, {
      userId: 12,
      email: 'premium-e2e-user@example.com',
      fullName: 'Premium E2E User',
      premium: false,
    });
    await mockPremiumPlans(page);

    await page.route('**/api/v1/exam/exams/public/99/attempt-view', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          title: 'Premium Mock Exam',
          description: 'Premium only',
          durationMinutes: 60,
          passingScore: 8,
          maxAttempts: 2,
          premium: true,
          teaserQuestionCount: 2,
          premiumLocked: true,
          tags: [{ id: 2, name: 'Premium' }],
          totalQuestions: 30,
          status: 'PUBLISHED',
          createdAt: ISO_NOW,
          modifiedAt: ISO_NOW,
          questions: [
            {
              id: 1,
              content: 'Teaser question 1',
              explanation: '',
              scoreWeight: 1,
              options: [
                { id: 11, content: 'A', isCorrect: null },
                { id: 12, content: 'B', isCorrect: null },
              ],
            },
            {
              id: 2,
              content: 'Teaser question 2',
              explanation: '',
              scoreWeight: 1,
              options: [
                { id: 21, content: 'A', isCorrect: null },
                { id: 22, content: 'B', isCorrect: null },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/exams/99/attempt');

    await expect(page.getByText('Chế độ xem thử Premium')).toBeVisible();
    await expect(page.getByText('Bạn đang xem thử nội dung Premium')).toBeVisible();
    const premiumDialog = page.getByRole('dialog');
    await expect(premiumDialog.getByRole('heading', { name: 'Đề thi này thuộc gói Premium' })).toBeVisible();

    await premiumDialog.getByRole('button', { name: 'Nâng cấp Premium', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/subscription-payments$/);
  });
});
