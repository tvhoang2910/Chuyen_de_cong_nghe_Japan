import { expect, test, type Route } from '@playwright/test';
import {
  mockUserShellApis,
  seedAuthenticatedUser,
} from '../tests/helpers/browser-auth';

const PUBLIC_EXAMS = [
  {
    id: 1,
    title: 'Đề thi Công nghệ & Tin học',
    description: 'Bộ đề công khai cho khối công nghệ',
    durationMinutes: 60,
    passingScore: 5,
    maxAttempts: 3,
    premium: false,
    premiumLocked: false,
    teaserQuestionCount: 0,
    tags: [
      { id: 101, name: 'IT' },
      { id: 102, name: 'Công nghệ' },
    ],
    totalQuestions: 40,
    status: 'PUBLISHED',
    createdAt: '2026-04-18T10:00:00Z',
    modifiedAt: '2026-04-18T10:00:00Z',
  },
  {
    id: 2,
    title: 'Đề thi Toán 12',
    description: 'Đề ôn tập đại số',
    durationMinutes: 90,
    passingScore: 5,
    maxAttempts: 2,
    premium: false,
    premiumLocked: false,
    teaserQuestionCount: 0,
    tags: [{ id: 201, name: 'Toán' }],
    totalQuestions: 50,
    status: 'PUBLISHED',
    createdAt: '2026-04-19T10:00:00Z',
    modifiedAt: '2026-04-19T10:00:00Z',
  },
  {
    id: 3,
    title: 'Đề thi Vật lý',
    description: 'Đề tổng hợp cơ bản',
    durationMinutes: 75,
    passingScore: 5,
    maxAttempts: 2,
    premium: true,
    premiumLocked: false,
    teaserQuestionCount: 2,
    tags: [{ id: 301, name: 'Vật lý' }],
    totalQuestions: 45,
    status: 'PUBLISHED',
    createdAt: '2026-04-17T10:00:00Z',
    modifiedAt: '2026-04-17T10:00:00Z',
  },
];

test.describe('Public exams search browser flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page, {
      email: 'search-user@example.com',
      fullName: 'Search User',
    });
    await mockUserShellApis(page, {
      email: 'search-user@example.com',
      fullName: 'Search User',
    });

    await page.route('**/api/v1/exam/exams/public', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PUBLIC_EXAMS),
      });
    });

    await page.route('**/api/v1/exam/exam-ratings/summaries**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    });
  });

  test('user can search by keyword, quick tag, combined filters, and reset', async ({ page }) => {
    await page.route('**/api/v1/search/exams**', async (route: Route) => {
      const url = new URL(route.request().url());
      const keyword = url.searchParams.get('keyword') ?? '';
      const tags = url.searchParams.getAll('tags');

      const matches = PUBLIC_EXAMS.filter((exam) => {
        const haystack = [exam.title, exam.description ?? '', ...exam.tags.map((tag) => tag.name)]
          .join(' ')
          .toLowerCase();
        const keywordMatch = !keyword || haystack.includes(keyword.toLowerCase());
        const tagMatch =
          tags.length === 0 ||
          tags.every((tag) =>
            exam.tags.some((examTag) => examTag.name.toLowerCase().includes(tag.toLowerCase())),
          );
        return keywordMatch && tagMatch;
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          matches.map((exam) => ({
            id: exam.id,
            title: exam.title,
            status: exam.status,
            tags: exam.tags.map((tag) => tag.name),
          })),
        ),
      });
    });

    await page.goto('/dashboard/exams');

    await expect(page.getByRole('heading', { name: 'Kho đề thi công khai' })).toBeVisible();
    await expect(page.getByText('3 đề thi')).toBeVisible();

    await page.getByPlaceholder('Tìm theo từ khóa (ví dụ: toán 12)').fill('công nghệ');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();
    await expect(page.getByText('1 đề thi')).toBeVisible();
    await expect(page.getByText('Đề thi Công nghệ & Tin học')).toBeVisible();
    await expect(page.getByText('Đề thi Toán 12')).toHaveCount(0);

    await page.getByRole('button', { name: 'Xóa lọc' }).click();
    await expect(page.getByText('3 đề thi')).toBeVisible();

    await page.getByRole('button', { name: /#IT \(1\)/i }).click();
    await expect(page.getByText('1 đề thi')).toBeVisible();
    await expect(page.getByText('Bộ lọc đang áp dụng:')).toBeVisible();
    await expect(page.getByRole('article').getByText('#IT')).toBeVisible();
    await expect(page.getByText('Đề thi Công nghệ & Tin học')).toBeVisible();

    await page.getByRole('button', { name: 'Xóa lọc' }).click();
    await expect(page.getByText('3 đề thi')).toBeVisible();

    await page.getByPlaceholder('Tìm theo từ khóa (ví dụ: toán 12)').fill('toán');
    await page.getByPlaceholder('Lọc tags, ngăn cách dấu phẩy (toán, hình học)').fill('Toán');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();
    await expect(page.getByText('1 đề thi')).toBeVisible();
    await expect(page.getByText('Đề thi Toán 12')).toBeVisible();
    await expect(page.getByText('Từ khóa: toán')).toBeVisible();
  });

  test('user falls back to local filtering when search service fails', async ({ page }) => {
    await page.route('**/api/v1/search/exams**', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'search temporarily unavailable' }),
      });
    });

    await page.goto('/dashboard/exams');

    await page.getByPlaceholder('Lọc tags, ngăn cách dấu phẩy (toán, hình học)').fill('toan');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();

    await expect(page.getByText('Search service đang bận, kết quả đang lọc cục bộ.')).toBeVisible();
    await expect(page.getByText('1 đề thi')).toBeVisible();
    await expect(page.getByText('Đề thi Toán 12')).toBeVisible();
  });
});
