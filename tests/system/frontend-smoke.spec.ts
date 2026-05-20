import { expect, test, type Page } from '@playwright/test';

import { buildSystemTestContext } from './helpers/system-config';

const ctx = buildSystemTestContext();

const USER_PROFILE = {
  id: ctx.userIdentity.userId,
  email: ctx.userIdentity.email,
  fullName: 'Smoke User',
  avatarUrl: null,
  role: 'USER',
  premium: false,
};

const PUBLIC_EXAMS = [
  {
    id: 1,
    title: 'Đề thi Công nghệ & Tin học',
    description: 'Bộ đề công khai cho smoke test',
    durationMinutes: 60,
    passingScore: 5,
    maxAttempts: 3,
    premium: false,
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
    teaserQuestionCount: 0,
    tags: [{ id: 201, name: 'Toán' }],
    totalQuestions: 50,
    status: 'PUBLISHED',
    createdAt: '2026-04-19T10:00:00Z',
    modifiedAt: '2026-04-19T10:00:00Z',
  },
];

const RATINGS = [
  { examId: 1, averageRating: 4.8, ratingCount: 12, userRating: null },
  { examId: 2, averageRating: 4.3, ratingCount: 8, userRating: null },
];

const uploadedTitle = 'Smoke Upload Exam';

const onePxPng =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9k5x0AAAAASUVORK5CYII=';

const installBrowserSmokeShims = async (page: Page): Promise<void> => {
  await page.addInitScript(({ token, profile }) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', 'USER');
    localStorage.setItem('user_email', profile.email);
    localStorage.setItem('user_full_name', profile.fullName);

    try {
      delete (window as unknown as Record<string, unknown>).Notification;
    } catch {
      (window as unknown as Record<string, unknown>).Notification = undefined;
    }

    try {
      delete (window as unknown as Record<string, unknown>).PushManager;
    } catch {
      (window as unknown as Record<string, unknown>).PushManager = undefined;
    }

    class MockEventSource {
      addEventListener(): void {}
      close(): void {}
    }

    Object.defineProperty(window, 'EventSource', {
      configurable: true,
      writable: true,
      value: MockEventSource,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: () => {},
        removeEventListener: () => {},
        getRegistration: async () => null,
        register: async () => ({
          pushManager: {
            getSubscription: async () => null,
            subscribe: async () => ({
              endpoint: 'https://example.test/push',
              toJSON: () => ({}),
            }),
          },
        }),
      },
    });
  }, { token: ctx.userToken, profile: USER_PROFILE });
};

const mockAuthenticatedApis = async (page: Page): Promise<void> => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(USER_PROFILE),
    });
  });

  await page.route('**/api/v1/community/ratings/exams**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RATINGS),
    });
  });

  await page.route('**/api/v1/exam/exams/public**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PUBLIC_EXAMS),
    });
  });

  await page.route('**/api/v1/search/exams**', async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get('keyword') ?? '';
    const tags = url.searchParams.getAll('tags');

    const matches = PUBLIC_EXAMS.filter((exam) => {
      const searchableText = [exam.title, exam.description ?? '', ...exam.tags.map((tag) => tag.name)]
        .join(' ')
        .toLowerCase();
      const keywordMatch = !keyword || searchableText.includes(keyword.toLowerCase());
      const tagMatch =
        tags.length === 0 ||
        tags.every((tag) => exam.tags.some((item) => item.name.toLowerCase().includes(tag.toLowerCase())));
      return keywordMatch && tagMatch;
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(matches.map((exam) => ({ id: exam.id, title: exam.title, status: exam.status, tags: exam.tags.map((tag) => tag.name) }))),
    });
  });

  await page.route('**/api/v1/exam/uploads/initiate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        uploadId: 42,
        pages: [
          {
            index: 0,
            objectKey: 'uploads/smoke/page-1.png',
            url: '/mock-upload/page-1.png',
            expiresInSeconds: 600,
          },
        ],
      }),
    });
  });

  await page.route('**/mock-upload/page-1.png', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  await page.route('**/api/v1/exam/uploads/42/complete', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 42,
        uploaderId: ctx.userIdentity.userId,
        uploaderRole: 'USER',
        title: uploadedTitle,
        description: 'Smoke upload test',
        pageCount: 1,
        status: 'PENDING_APPROVAL',
        createdAt: '2026-04-29T00:00:00Z',
        modifiedAt: '2026-04-29T00:00:00Z',
      }),
    });
  });

  await page.route('**/api/v1/exam/uploads/mine**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 42,
            uploaderId: ctx.userIdentity.userId,
            uploaderRole: 'USER',
            title: uploadedTitle,
            description: 'Smoke upload test',
            pageCount: 1,
            status: 'PENDING_APPROVAL',
            createdAt: '2026-04-29T00:00:00Z',
            modifiedAt: '2026-04-29T00:00:00Z',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      }),
    });
  });
};

test.describe('frontend smoke', () => {
  test('search smoke: public exams page loads and searches by keyword', async ({ page }) => {
    await installBrowserSmokeShims(page);
    await mockAuthenticatedApis(page);

    await page.goto('/dashboard/exams');

    await expect(page.getByRole('heading', { name: 'Kho đề thi công khai' })).toBeVisible();
    await expect(page.getByText('Đề thi Công nghệ & Tin học')).toBeVisible();
    await expect(page.getByText('Đề thi Toán 12')).toBeVisible();

    await page.getByPlaceholder('Tìm theo từ khóa (ví dụ: toán 12)').fill('công nghệ');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();

    await expect(page.getByText('Đề thi Công nghệ & Tin học')).toBeVisible();
    await expect(page.getByText('Đề thi Toán 12')).toHaveCount(0);
    await expect(page.getByText('1 đề thi')).toBeVisible();
  });

  test('upload smoke: user can stage a file and complete upload flow', async ({ page }) => {
    await installBrowserSmokeShims(page);
    await mockAuthenticatedApis(page);

    await page.goto('/upload-exam');

    await expect(page.getByRole('heading', { name: 'Upload đề thi' })).toBeVisible();
    await page.getByLabel('Tiêu đề đề thi').fill(uploadedTitle);
    await page.getByLabel('Mô tả (tuỳ chọn)').fill('Smoke upload test');
    await page.locator('#upload-files').setInputFiles([
      {
        name: 'page-1.png',
        mimeType: 'image/png',
        buffer: Buffer.from(onePxPng, 'base64'),
      },
    ]);

    await expect(page.getByText('Trang 1 · page-1.png')).toBeVisible();
    await page.getByRole('button', { name: 'Gửi duyệt' }).click();

    await expect(page).toHaveURL(/\/my-uploads$/);
    await expect(page.getByRole('heading', { name: 'Đề đã upload' })).toBeVisible();
    await expect(page.getByText(uploadedTitle)).toBeVisible();
    await expect(
      page.locator('tr', { hasText: uploadedTitle }).getByText('Chờ duyệt', { exact: true }),
    ).toBeVisible();
  });
});