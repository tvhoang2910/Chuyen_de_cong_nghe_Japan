import { expect, test, type Page, type Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const EXAM_ID = 42;

const MOCK_EXAMS = [
  {
    id: EXAM_ID,
    title: 'Đề thi Toán 12 E2E',
    description: 'Bộ đề toán dành cho học sinh lớp 12',
    durationMinutes: 60,
    passingScore: 5,
    maxAttempts: 3,
    premium: false,
    premiumLocked: false,
    teaserQuestionCount: 0,
    tags: [{ id: 1, name: 'Toán' }],
    totalQuestions: 2,
    status: 'PUBLISHED',
    createdAt: '2026-01-01T00:00:00Z',
    modifiedAt: '2026-01-01T00:00:00Z',
  },
];

const MOCK_EXAM_DETAIL = {
  ...MOCK_EXAMS[0],
  questions: [
    {
      id: 101,
      content: 'Tính 2 + 2 = ?',
      scoreWeight: 1,
      options: [
        { id: 1001, content: 'A. 3' },
        { id: 1002, content: 'B. 4' },
        { id: 1003, content: 'C. 5' },
      ],
    },
    {
      id: 102,
      content: 'Tính 3 × 3 = ?',
      scoreWeight: 1,
      options: [
        { id: 1004, content: 'A. 6' },
        { id: 1005, content: 'B. 9' },
      ],
    },
  ],
};

const MOCK_ATTEMPT_RESULT = {
  attemptId: 999,
  examId: EXAM_ID,
  examTitle: 'Đề thi Toán 12 E2E',
  status: 'SUBMITTED',
  startedAt: '2026-04-01T08:00:00Z',
  submittedAt: '2026-04-01T09:00:00Z',
  durationSeconds: 3600,
  scoreRaw: 2,
  scoreMax: 2,
  scorePercent: 100,
  passingScore: 5,
  passed: true,
  questionResults: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedAuth(page: Page, role = 'USER'): Promise<void> {
  await page.addInitScript(
    ({ role }) => {
      localStorage.setItem('access_token', 'mock-access-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      localStorage.setItem('user_email', 'user@example.com');
      localStorage.setItem('user_role', role);
    },
    { role },
  );
}

async function mockShellApis(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'user@example.com',
        fullName: 'E2E User',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/my-requests', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/v1/notification**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [], totalElements: 0, totalPages: 0, number: 0, size: 20,
        first: true, last: true, unreadCount: 0,
      }),
    });
  });
}

// ---------------------------------------------------------------------------
// Tests: Browse public exams
// ---------------------------------------------------------------------------

test.describe('Exam Flow — Browse', () => {
  test('user can browse public exams', async ({ page }) => {
    await seedAuth(page);
    await mockShellApis(page);

    await page.route('**/api/v1/exam/exams**', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXAMS),
      });
    });

    await page.route('**/api/v1/exam/exam-ratings/summaries**', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto('/dashboard/exams');

    await expect(page.getByText('Đề thi Toán 12 E2E')).toBeVisible({ timeout: 10000 });
  });

  test('user can view exam details / start page', async ({ page }) => {
    await seedAuth(page);
    await mockShellApis(page);

    await page.route(`**/api/v1/exam/exams/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXAMS[0]),
      });
    });

    await page.route(`**/api/v1/exam/exams/${EXAM_ID}/attempt-view`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXAM_DETAIL),
      });
    });

    await page.route(`**/api/v1/exam/exams/${EXAM_ID}/ratings/summary`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ examId: EXAM_ID, averageRating: 4.5, ratingCount: 10, userRating: null }),
      });
    });

    await page.route('**/api/v1/exam/attempts/my-history**', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.goto(`/dashboard/exams/${EXAM_ID}`);

    await expect(page.getByText('Đề thi Toán 12 E2E')).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Tests: Exam attempt flow
// ---------------------------------------------------------------------------

test.describe('Exam Flow — Attempt', () => {
  test('user can start an exam attempt', async ({ page }) => {
    await seedAuth(page);
    await mockShellApis(page);

    await page.route(`**/api/v1/exam/exams/${EXAM_ID}/attempt-view`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXAM_DETAIL),
      });
    });

    await page.route(`**/api/v1/exam/attempts`, async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attemptId: 999,
            examId: EXAM_ID,
            startedAt: '2026-04-01T08:00:00Z',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            durationMinutes: 60,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/dashboard/exams/${EXAM_ID}/attempt`);

    await expect(page.getByText('Đề thi Toán 12 E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Tính 2 \+ 2/i)).toBeVisible();
  });

  test('user can answer questions and submit exam', async ({ page }) => {
    await seedAuth(page);
    await mockShellApis(page);

    await page.route(`**/api/v1/exam/exams/${EXAM_ID}/attempt-view`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXAM_DETAIL),
      });
    });

    await page.route('**/api/v1/exam/attempts', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attemptId: 999,
            examId: EXAM_ID,
            startedAt: '2026-04-01T08:00:00Z',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            durationMinutes: 60,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/exam/attempts/999/answers/batch', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/v1/exam/attempts/999/submit', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATTEMPT_RESULT),
      });
    });

    await page.goto(`/dashboard/exams/${EXAM_ID}/attempt`);

    // Wait for questions to load
    await expect(page.getByText(/Tính 2 \+ 2/i)).toBeVisible({ timeout: 10000 });

    // Select answers
    await page.getByText('B. 4').click();
    await page.getByText('B. 9').click();

    // Submit exam
    await page.getByRole('button', { name: /Nộp bài/i }).click();

    // Should navigate to result page
    await expect(page).toHaveURL(/attempts\/999\/result/, { timeout: 10000 });
  });

  test('user can see exam results after submit', async ({ page }) => {
    await seedAuth(page);
    await mockShellApis(page);

    await page.route('**/api/v1/exam/attempts/999', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATTEMPT_RESULT),
      });
    });

    await page.route('**/api/v1/exam/attempts/999/result', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ATTEMPT_RESULT),
      });
    });

    await page.goto('/dashboard/attempts/999/result');

    // Should show result content
    await expect(page.getByText(/Đề thi Toán 12 E2E/i)).toBeVisible({ timeout: 10000 });
  });
});
