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

const ISO_NOW = '2026-04-07T14:00:00.000Z';

const BASE_QUESTION: DeckQuestion = {
  itemId: 11,
  topicTagIds: '1,2',
  selectedOptionIds: null,
  correctOptionIds: '101',
  repetition: 0,
  intervalDays: 0,
  easinessFactor: 2.5,
  nextReviewAt: ISO_NOW,
  dueNow: true,
  totalReviews: 0,
  correctReviews: 0,
};

const BASE_DECK_RESPONSE: DeckResponse = {
  generatedAt: ISO_NOW,
  deckCount: 1,
  totalWrongQuestions: 1,
  decks: [
    {
      examId: 1,
      examTitle: 'Exam Geography',
      latestAttemptId: 99,
      latestSubmittedAt: ISO_NOW,
      wrongQuestionCount: 1,
      questions: [BASE_QUESTION],
    },
  ],
};

const ATTEMPT_VIEW_RESPONSE = {
  id: 1,
  title: 'Exam Geography',
  description: 'Mock exam',
  durationMinutes: 30,
  passingScore: 50,
  maxAttempts: 3,
  tags: [],
  totalQuestions: 1,
  status: 'PUBLISHED',
  createdAt: ISO_NOW,
  modifiedAt: ISO_NOW,
  questions: [
    {
      id: 11,
      content: 'Which option is correct?',
      explanation: 'Mock explanation',
      scoreWeight: 1,
      options: [
        { id: 101, content: 'Lua chon A', isCorrect: true },
        { id: 102, content: 'Lua chon B', isCorrect: false },
      ],
    },
  ],
};

async function seedAuthenticatedUser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'e2e-token');
    localStorage.setItem('refresh_token', 'e2e-refresh-token');
    localStorage.setItem('user_email', 'e2e-user@example.com');
    localStorage.setItem('user_role', 'USER');
  });
}

async function mockUserShellApis(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        email: 'e2e-user@example.com',
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

async function mockAttemptViewApi(page: Page, responseBody = ATTEMPT_VIEW_RESPONSE): Promise<void> {
  await page.route('**/api/v1/exam/exams/public/*/attempt-view', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

test.describe('Spaced repetition routing guard', () => {
  test('redirects unauthenticated users from protected spaced repetition route', async ({ page }) => {
    await page.goto('/dashboard/spaced-repetition');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Spaced repetition list page', () => {
  test('renders deck summary and list when API returns data', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      const body: DeckResponse = {
        ...BASE_DECK_RESPONSE,
        totalWrongQuestions: 3,
        decks: [
          {
            ...BASE_DECK_RESPONSE.decks[0],
            examTitle: 'Exam Geography',
            wrongQuestionCount: 3,
            questions: [
              BASE_QUESTION,
              { ...BASE_QUESTION, itemId: 12 },
              { ...BASE_QUESTION, itemId: 13 },
            ],
          },
        ],
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/dashboard/spaced-repetition');

    await expect(page.getByRole('heading', { name: /On tap thong minh tu study_service/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exam Geography - cac cau sai/i })).toBeVisible();

    const dueCard = page.getByText('Cau den han').locator('xpath=..');
    await expect(dueCard).toContainText('3');
  });

  test('refresh button fetches latest deck data and updates rendered content', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    const responses: DeckResponse[] = [
      {
        ...BASE_DECK_RESPONSE,
        totalWrongQuestions: 1,
        decks: [
          {
            ...BASE_DECK_RESPONSE.decks[0],
            examTitle: 'Exam First',
            wrongQuestionCount: 1,
          },
        ],
      },
      {
        ...BASE_DECK_RESPONSE,
        totalWrongQuestions: 4,
        decks: [
          {
            ...BASE_DECK_RESPONSE.decks[0],
            examTitle: 'Exam Refreshed',
            wrongQuestionCount: 4,
            questions: [
              BASE_QUESTION,
              { ...BASE_QUESTION, itemId: 21 },
              { ...BASE_QUESTION, itemId: 22 },
              { ...BASE_QUESTION, itemId: 23 },
            ],
          },
        ],
      },
    ];

    let callCount = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      const body = responses[Math.min(callCount, responses.length - 1)];
      callCount += 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/dashboard/spaced-repetition');
    await expect(page.getByRole('heading', { name: /Exam First - cac cau sai/i })).toBeVisible();

    await page.getByRole('button', { name: 'Lam moi' }).click();

    await expect(page.getByRole('heading', { name: /Exam Refreshed - cac cau sai/i })).toBeVisible();
    expect(callCount).toBeGreaterThanOrEqual(2);

    const dueCard = page.getByText('Cau den han').locator('xpath=..');
    await expect(dueCard).toContainText('4');
  });

  test('shows empty state when API returns no deck', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedAt: ISO_NOW,
          deckCount: 0,
          totalWrongQuestions: 0,
          decks: [],
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition');

    await expect(page.getByRole('heading', { name: /Khong co cau nao can on tap/i })).toBeVisible();
  });

  test('shows API error message when deck endpoint fails', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Deck API down' }),
      });
    });

    await page.goto('/dashboard/spaced-repetition');

    await expect(page.getByText('Cau den han').locator('xpath=..')).toContainText('0');
    await expect(page.getByRole('heading', { name: /Khong co cau nao can on tap/i })).toBeVisible();
  });
});

test.describe('Spaced repetition practice page', () => {
  test('opens practice page from list and submits a correct answer payload', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);

    let deckCalls = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      deckCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_DECK_RESPONSE),
      });
    });

    let submitPayload: Record<string, unknown> | null = null;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      submitPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cardId: 1001,
          itemId: 11,
          quality: 5,
          repetition: 1,
          intervalDays: 1,
          easinessFactor: 2.6,
          nextReviewAt: '2026-04-08T14:00:00.000Z',
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition');
    await page.getByRole('button', { name: 'Luyen tap' }).click();

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition\/1\/practice\?attemptId=99$/);
    await expect(page.getByRole('heading', { name: /Exam Geography - cac cau sai/i })).toBeVisible();

    await page.getByRole('button', { name: '1. Lua chon A' }).click();
    await page.getByRole('button', { name: 'Kiem tra cau nay' }).first().click();

    await expect(page.getByText(/Chinh xac! Da cap nhat SM-2 cho cau 11/i)).toBeVisible();

    expect(submitPayload).toBeTruthy();
    expect(submitPayload).toMatchObject({
      itemId: 11,
      isCorrect: true,
      answerChangeCount: 0,
    });
    expect(Number(submitPayload?.responseTimeMs ?? -1)).toBeGreaterThanOrEqual(0);
    expect(deckCalls).toBeGreaterThanOrEqual(2);
  });

  test('requires option selection before submitting', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_DECK_RESPONSE),
      });
    });

    let reviewCallCount = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      reviewCallCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cardId: 1001,
          itemId: 11,
          quality: 0,
          repetition: 0,
          intervalDays: 0,
          easinessFactor: 1.3,
          nextReviewAt: ISO_NOW,
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition/1/practice?attemptId=99');
    await page.getByRole('button', { name: 'Kiem tra cau nay' }).first().click();

    await expect(page.getByText('Ban can chon dap an truoc khi kiem tra.')).toBeVisible();
    expect(reviewCallCount).toBe(0);
  });

  test('tracks answer changes and sends answerChangeCount in review payload', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_DECK_RESPONSE),
      });
    });

    let submitPayload: Record<string, unknown> | null = null;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      submitPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cardId: 1001,
          itemId: 11,
          quality: 5,
          repetition: 1,
          intervalDays: 1,
          easinessFactor: 2.6,
          nextReviewAt: '2026-04-08T14:00:00.000Z',
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition/1/practice?attemptId=99');
    await page.getByRole('button', { name: '2. Lua chon B' }).click();
    await page.getByRole('button', { name: '1. Lua chon A' }).click();
    await page.getByRole('button', { name: 'Kiem tra cau nay' }).first().click();

    expect(submitPayload).toBeTruthy();
    expect(submitPayload).toMatchObject({
      itemId: 11,
      isCorrect: true,
      answerChangeCount: 1,
    });
  });

  test('blocks submit when question has no correct option data', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    const noAnswerDeck: DeckResponse = {
      ...BASE_DECK_RESPONSE,
      decks: [
        {
          ...BASE_DECK_RESPONSE.decks[0],
          questions: [{ ...BASE_QUESTION, correctOptionIds: null }],
        },
      ],
    };

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(noAnswerDeck),
      });
    });

    await mockAttemptViewApi(page);

    let reviewCallCount = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      reviewCallCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cardId: 1001,
          itemId: 11,
          quality: 0,
          repetition: 0,
          intervalDays: 0,
          easinessFactor: 1.3,
          nextReviewAt: ISO_NOW,
        }),
      });
    });

    await page.goto('/dashboard/spaced-repetition/1/practice?attemptId=99');
    await page.getByRole('button', { name: '1. Lua chon A' }).click();
    await page.getByRole('button', { name: 'Kiem tra cau nay' }).first().click();

    await expect(page.getByText(/Khong co dap an chuan cho cau nay/i)).toBeVisible();
    expect(reviewCallCount).toBe(0);
  });

  test('redirects back to list when deck does not exist for route params', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      const mismatchResponse: DeckResponse = {
        ...BASE_DECK_RESPONSE,
        decks: [
          {
            ...BASE_DECK_RESPONSE.decks[0],
            examId: 999,
          },
        ],
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mismatchResponse),
      });
    });

    await page.goto('/dashboard/spaced-repetition/1/practice?attemptId=99');

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition$/);
    await expect(page.getByText('Deck nay khong con trong danh sach on tap.')).toBeVisible();
  });

  test('redirects back to list when exam id param is invalid', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    await page.goto('/dashboard/spaced-repetition/abc/practice?attemptId=99');

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition$/);
    await expect(page.getByText('ID de khong hop le.')).toBeVisible();
  });
});
