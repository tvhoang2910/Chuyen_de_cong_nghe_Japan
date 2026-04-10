import { expect, test, type Page, type Route } from '@playwright/test';

type DeckQuestion = {
  itemId: number;
  topicTagIds: string | null;
  selectedOptionIds: string | null;
  correctOptionIds: string | null;
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  nextReviewAt: string;
  dueNow: boolean;
  totalReviews: number;
  correctReviews: number;
};

type DeckResponse = {
  generatedAt: string;
  deckCount: number;
  totalWrongQuestions: number;
  decks: Array<{
    examId: number;
    examTitle: string;
    latestAttemptId: number;
    latestSubmittedAt: string;
    wrongQuestionCount: number;
    questions: DeckQuestion[];
  }>;
};

const ISO_NOW = '2026-04-07T15:00:00.000Z';

const BASE_QUESTIONS: DeckQuestion[] = [
  {
    itemId: 101,
    topicTagIds: '1,2',
    selectedOptionIds: null,
    correctOptionIds: '1001',
    repetition: 0,
    intervalDays: 0,
    easinessFactor: 2.5,
    nextReviewAt: ISO_NOW,
    dueNow: true,
    totalReviews: 1,
    correctReviews: 1,
  },
  {
    itemId: 102,
    topicTagIds: '2,3',
    selectedOptionIds: null,
    correctOptionIds: '1003',
    repetition: 0,
    intervalDays: 0,
    easinessFactor: 2.5,
    nextReviewAt: ISO_NOW,
    dueNow: true,
    totalReviews: 0,
    correctReviews: 0,
  },
];

const BASE_DECK_RESPONSE: DeckResponse = {
  generatedAt: ISO_NOW,
  deckCount: 1,
  totalWrongQuestions: 2,
  decks: [
    {
      examId: 9,
      examTitle: 'Exam Professional Suite',
      latestAttemptId: 300,
      latestSubmittedAt: ISO_NOW,
      wrongQuestionCount: 2,
      questions: BASE_QUESTIONS,
    },
  ],
};

const BASE_ATTEMPT_VIEW = {
  id: 9,
  title: 'Exam Professional Suite',
  description: 'Attempt view for e2e',
  durationMinutes: 45,
  passingScore: 70,
  maxAttempts: 3,
  tags: [],
  totalQuestions: 2,
  status: 'PUBLISHED',
  createdAt: ISO_NOW,
  modifiedAt: ISO_NOW,
  questions: [
    {
      id: 101,
      content: 'Question one content',
      explanation: 'Question one explanation',
      scoreWeight: 1,
      options: [
        { id: 1001, content: 'Option A', isCorrect: true },
        { id: 1002, content: 'Option B', isCorrect: false },
      ],
    },
    {
      id: 102,
      content: 'Question two content',
      explanation: 'Question two explanation',
      scoreWeight: 1,
      options: [
        { id: 1003, content: 'Option C', isCorrect: true },
        { id: 1004, content: 'Option D', isCorrect: false },
      ],
    },
  ],
};

async function seedAuthenticatedUser(page: Page, role: 'USER' | 'ADMIN' | 'CONTRIBUTOR' = 'USER'): Promise<void> {
  await page.addInitScript(([seedRole]) => {
    localStorage.setItem('access_token', 'seed-token');
    localStorage.setItem('refresh_token', 'seed-refresh-token');
    localStorage.setItem('user_email', 'qa-user@example.com');
    localStorage.setItem('user_role', seedRole);
  }, [role]);
}

async function mockAuthApis(page: Page, role: 'USER' | 'ADMIN' | 'CONTRIBUTOR' = 'USER'): Promise<void> {
  await page.route('**/api/v1/auth/**', async (route: Route) => {
    const url = route.request().url();

    if (url.endsWith('/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 50,
          email: 'qa-user@example.com',
          fullName: 'QA User',
          avatarUrl: null,
          phoneNumber: null,
          school: null,
          subject: null,
          role,
          premium: false,
        }),
      });
      return;
    }

    if (url.includes('/subscriptions/my-requests')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
      return;
    }

    if (url.endsWith('/push-subscription/vapid-public-key')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ publicKey: 'BOr7dummyVapidPublicKeyForE2ETestOnly1234567890abcXYZ' }),
      });
      return;
    }

    if (url.endsWith('/push-subscription')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
}

async function mockDecks(page: Page, responseBody: DeckResponse): Promise<void> {
  await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

async function mockAttemptView(page: Page, body = BASE_ATTEMPT_VIEW): Promise<void> {
  await page.route('**/api/v1/exam/exams/public/*/attempt-view', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test.describe('Professional coverage for spaced repetition', () => {
  test('redirects admin user away from USER-only spaced repetition route', async ({ page }) => {
    await seedAuthenticatedUser(page, 'ADMIN');
    await mockAuthApis(page, 'ADMIN');

    await page.goto('/dashboard/spaced-repetition');

    await expect(page).toHaveURL(/\/admin\/users$/);
  });

  test('computes completion rate based on reviewed questions', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);

    const response: DeckResponse = {
      ...BASE_DECK_RESPONSE,
      totalWrongQuestions: 4,
      decks: [
        {
          ...BASE_DECK_RESPONSE.decks[0],
          wrongQuestionCount: 4,
          questions: [
            { ...BASE_QUESTIONS[0], itemId: 201, totalReviews: 2 },
            { ...BASE_QUESTIONS[1], itemId: 202, totalReviews: 1 },
            { ...BASE_QUESTIONS[1], itemId: 203, totalReviews: 0 },
            { ...BASE_QUESTIONS[1], itemId: 204, totalReviews: 0 },
          ],
        },
      ],
    };
    await mockDecks(page, response);

    await page.goto('/dashboard/spaced-repetition');

    const completionCard = page.getByText('Tỉ lệ có lịch sử ôn').locator('xpath=..');
    await expect(completionCard).toContainText('50%');
  });

  test('uses attemptId query to choose matching deck for practice page', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);

    const response: DeckResponse = {
      ...BASE_DECK_RESPONSE,
      deckCount: 2,
      totalWrongQuestions: 4,
      decks: [
        {
          ...BASE_DECK_RESPONSE.decks[0],
          examId: 9,
          examTitle: 'Wrong Attempt Deck',
          latestAttemptId: 111,
          questions: [{ ...BASE_QUESTIONS[0], itemId: 301 }],
          wrongQuestionCount: 1,
        },
        {
          ...BASE_DECK_RESPONSE.decks[0],
          examId: 9,
          examTitle: 'Matched Attempt Deck',
          latestAttemptId: 222,
          questions: [{ ...BASE_QUESTIONS[0], itemId: 302 }],
          wrongQuestionCount: 1,
        },
      ],
    };

    await mockDecks(page, response);
    await mockAttemptView(page, {
      ...BASE_ATTEMPT_VIEW,
      questions: [
        {
          id: 302,
          content: 'Question matched by attempt id',
          explanation: 'Matched explanation',
          scoreWeight: 1,
          options: [
            { id: 1001, content: 'Option A', isCorrect: true },
            { id: 1002, content: 'Option B', isCorrect: false },
          ],
        },
      ],
    });

    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=222');

    await expect(page.getByRole('heading', { name: /Matched Attempt Deck - các câu sai/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Câu hỏi #302/i })).toBeVisible();
  });

  test('navigates back to list when user clicks back button in practice page', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);
    await mockDecks(page, BASE_DECK_RESPONSE);
    await mockAttemptView(page);

    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=300');
    await page.getByRole('button', { name: 'Quay lại danh sách deck' }).click();

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition$/);
    await expect(page.getByRole('heading', { name: /Ôn tập thông minh từ study_service/i })).toBeVisible();
  });

  test('shows warning block when attempt-view has no options for question', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);
    await mockDecks(page, BASE_DECK_RESPONSE);
    await mockAttemptView(page, {
      ...BASE_ATTEMPT_VIEW,
      questions: [
        {
          id: 101,
          content: 'Question without options',
          explanation: '',
          scoreWeight: 1,
          options: [],
        },
      ],
    });

    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=300');

    await expect(page.getByText(/Không tải được danh sách đáp án cho câu này/i).first()).toBeVisible();
  });

  test('sends isCorrect=false for wrong answer submission', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);
    await mockDecks(page, BASE_DECK_RESPONSE);
    await mockAttemptView(page);

    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cardId: 333,
          itemId: 101,
          quality: 0,
          repetition: 0,
          intervalDays: 0,
          easinessFactor: 1.3,
          nextReviewAt: ISO_NOW,
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=300');
    await page.getByRole('button', { name: '2. Option B' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    expect(payload).toBeTruthy();
    expect(payload).toMatchObject({
      itemId: 101,
      isCorrect: false,
    });

    await expect(page.getByText(/Chưa đúng\. Đã cập nhật SM-2 cho câu 101/i)).toBeVisible();
  });

  test('shows backend message when review save fails and stays on practice page', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockAuthApis(page);
    await mockDecks(page, BASE_DECK_RESPONSE);
    await mockAttemptView(page);

    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Cannot save review now' }),
      });
    });

    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=300');
    await page.getByRole('button', { name: '1. Option A' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    await expect(page.getByText('Cannot save review now')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition\/9\/practice\?attemptId=300$/);
  });

  test('redirects unauthenticated user from practice route to login', async ({ page }) => {
    await page.goto('/dashboard/spaced-repetition/9/practice?attemptId=300');

    await expect(page).toHaveURL(/\/login$/);
  });
});
