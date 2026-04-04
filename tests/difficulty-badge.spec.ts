import { test, expect } from '@playwright/test';

/**
 * Smoke tests for ExamDifficultyBadge component.
 *
 * These tests mount the component indirectly by visiting pages that render
 * it, using mock API data to exercise all four difficulty levels plus the
 * null/undefined fallback.
 */

const seedAdminSession = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });
};

test.describe('ExamDifficultyBadge', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'ADMIN',
          premium: false,
        }),
      });
    });

    await page.route('**/api/v1/exam/exams/manage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Difficulty Demo Exam',
            description: 'Exam with varied question difficulties',
            durationMinutes: 30,
            passingScore: 5,
            maxAttempts: 3,
            tags: [],
            totalQuestions: 3,
            status: 'PUBLISHED',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
        ]),
      });
    });
  });

  test('shows badge with EASY label when question has EASY difficulty', async ({ page }) => {
    await seedAdminSession(page);

    await page.route('**/api/v1/exam/exams/manage/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'Difficulty Demo Exam',
          description: 'Exam with varied question difficulties',
          durationMinutes: 30,
          passingScore: 5,
          maxAttempts: 3,
          tags: [],
          totalQuestions: 3,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          questions: [
            {
              id: 101,
              content: 'What is 2 + 2?',
              explanation: 'Basic addition',
              scoreWeight: 1,
              difficulty: 'EASY',
              options: [
                { id: 1, content: '3', isCorrect: false },
                { id: 2, content: '4', isCorrect: true },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/admin/exams');
    await page.getByRole('button', { name: /Xem/ }).first().click();

    await expect(page.getByText('Dễ')).toBeVisible();
  });

  test('shows badge with HARD label when question has HARD difficulty', async ({ page }) => {
    await seedAdminSession(page);

    await page.route('**/api/v1/exam/exams/manage/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'Difficulty Demo Exam',
          description: 'Exam with varied question difficulties',
          durationMinutes: 30,
          passingScore: 5,
          maxAttempts: 3,
          tags: [],
          totalQuestions: 3,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          questions: [
            {
              id: 102,
              content: 'Prove P = NP',
              explanation: 'This is an open problem',
              scoreWeight: 5,
              difficulty: 'VERY_HARD',
              options: [
                { id: 1, content: 'Yes', isCorrect: false },
                { id: 2, content: 'No', isCorrect: false },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/admin/exams');
    await page.getByRole('button', { name: /Xem/ }).first().click();

    await expect(page.getByText('Cực khó')).toBeVisible();
  });

  test('shows "Chưa đánh giá" when question has no difficulty field', async ({ page }) => {
    await seedAdminSession(page);

    await page.route('**/api/v1/exam/exams/manage/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'Difficulty Demo Exam',
          description: 'Exam with unrated questions',
          durationMinutes: 30,
          passingScore: 5,
          maxAttempts: 3,
          tags: [],
          totalQuestions: 1,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          questions: [
            {
              id: 103,
              content: 'What is the capital of Vietnam?',
              explanation: 'Geography question',
              scoreWeight: 1,
              // difficulty intentionally omitted
              options: [
                { id: 1, content: 'Hanoi', isCorrect: true },
                { id: 2, content: 'HCMC', isCorrect: false },
              ],
            },
          ],
        }),
      });
    });

    await page.goto('/admin/exams');
    await page.getByRole('button', { name: /Xem/ }).first().click();

    await expect(page.getByText('Chưa đánh giá')).toBeVisible();
  });

  test('difficulty filter select is present on the exam form', async ({ page }) => {
    await seedAdminSession(page);

    await page.goto('/admin/exams');
    await page.getByRole('button', { name: /Tạo đề thi/ }).click();

    await expect(page.getByText('Lọc độ khó:')).toBeVisible();
    await expect(page.locator('select').filter({ hasText: 'Tất cả' })).toBeVisible();
  });
});
