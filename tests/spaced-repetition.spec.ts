import { expect, test, type Page, type Route } from '@playwright/test';
import {
  mockUserShellApis,
  seedAuthenticatedUser,
} from './helpers/browser-auth';

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

type ReviewRequestPayload = {
  itemId: number;
  isCorrect: boolean;
  responseTimeMs?: number;
  answerChangeCount?: number;
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
  tags: [
    { id: 1, name: 'Địa lý' },
    { id: 2, name: 'Châu Á' },
  ],
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
        { id: 101, content: 'Lựa chọn A', isCorrect: null },
        { id: 102, content: 'Lựa chọn B', isCorrect: null },
      ],
    },
  ],
};

const ATTEMPT_RESULT_RESPONSE = {
  attemptId: 99,
  examId: 1,
  examTitle: 'Exam Geography',
  status: 'SUBMITTED',
  startedAt: ISO_NOW,
  submittedAt: ISO_NOW,
  durationSeconds: 60,
  scoreRaw: 0,
  scoreMax: 1,
  scorePercent: 0,
  passingScore: 50,
  passed: false,
  questionResults: [
    {
      questionId: 11,
      content: 'Which option is correct?',
      maxScore: 1,
      earnedScore: 0,
      correct: false,
      options: [
        { id: 101, content: 'Lựa chọn A' },
        { id: 102, content: 'Lựa chọn B' },
      ],
      selectedOptionIds: [102],
      correctOptionIds: [101],
      responseTimeMs: 12000,
      answerChangeCount: 1,
    },
  ],
};

async function mockAttemptViewApi(page: Page, responseBody = ATTEMPT_VIEW_RESPONSE): Promise<void> {
  await page.route('**/api/v1/exam/exams/public/*/attempt-view', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

async function mockAttemptResultApi(page: Page, responseBody = ATTEMPT_RESULT_RESPONSE): Promise<void> {
  await page.route('**/api/v1/exam/attempts/*/result', async (route: Route) => {
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

    await expect(page.getByRole('heading', { name: /Ôn tập thông minh/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Exam Geography - các câu sai/i })).toBeVisible();

    const dueCard = page.getByText('Câu đến hạn').locator('xpath=..');
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

    let refreshClicked = false;
    let callCount = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      callCount += 1;
      const body = refreshClicked ? responses[1] : responses[0];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.goto('/dashboard/spaced-repetition');
    await expect(page.getByRole('heading', { name: /Exam First - các câu sai/i })).toBeVisible();

    refreshClicked = true;
    await page.getByRole('button', { name: 'Làm mới' }).click();

    await expect(page.getByRole('heading', { name: /Exam Refreshed - các câu sai/i })).toBeVisible();
    expect(callCount).toBeGreaterThanOrEqual(2);

    const dueCard = page.getByText('Câu đến hạn').locator('xpath=..');
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

    await expect(page.getByRole('heading', { name: /Không có câu nào cần ôn tập/i })).toBeVisible();
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

    await expect(page.getByText('Câu đến hạn').locator('xpath=..')).toContainText('0');
    await expect(page.getByRole('heading', { name: /Không có câu nào cần ôn tập/i })).toBeVisible();
  });
});

test.describe('Spaced repetition practice page', () => {
  test('opens practice page from list and submits a correct answer payload', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);
    await mockAttemptResultApi(page);

    let deckCalls = 0;
    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      deckCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_DECK_RESPONSE),
      });
    });

    let submitPayload: ReviewRequestPayload | null = null;
    let submitResponseTimeMs = -1;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      const requestPayload = route.request().postDataJSON() as ReviewRequestPayload;
      submitPayload = requestPayload;
      submitResponseTimeMs = typeof requestPayload.responseTimeMs === 'number' ? requestPayload.responseTimeMs : -1;
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
    await page.getByRole('button', { name: 'Luyện tập' }).click();

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition\/1\/practice\?attemptId=99$/);
    await expect(page.getByRole('heading', { name: /Exam Geography - các câu sai/i })).toBeVisible();
    await expect(page.getByText('#Địa lý #Châu Á')).toBeVisible();

    await page.getByRole('button', { name: '1. Lựa chọn A' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    await expect(page.getByText(/Chính xác! Đã cập nhật SM-2 cho câu 11/i)).toBeVisible();

    expect(submitPayload).toBeTruthy();
    expect(submitPayload).toMatchObject({
      itemId: 11,
      isCorrect: true,
      answerChangeCount: 0,
    });
    expect(submitResponseTimeMs).toBeGreaterThanOrEqual(0);
    expect(deckCalls).toBeGreaterThanOrEqual(2);
  });

  test('requires option selection before submitting', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);
    await mockAttemptResultApi(page);

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
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    await expect(page.getByText('Bạn cần chọn đáp án trước khi kiểm tra.')).toBeVisible();
    expect(reviewCallCount).toBe(0);
  });

  test('locks review action until question is due', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);
    await mockAttemptResultApi(page);

    const lockedDeck: DeckResponse = {
      ...BASE_DECK_RESPONSE,
      decks: [
        {
          ...BASE_DECK_RESPONSE.decks[0],
          questions: [
            {
              ...BASE_QUESTION,
              dueNow: false,
              nextReviewAt: '2026-04-08T14:00:00.000Z',
            },
          ],
        },
      ],
    };

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lockedDeck),
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

    const lockedButton = page.getByRole('button', { name: 'Chưa đến hạn ôn' });
    await expect(lockedButton).toBeDisabled();
    await expect(page.getByText(/Chưa đến hạn ôn. Mở lại lúc/i)).toBeVisible();
    expect(reviewCallCount).toBe(0);
  });

  test('tracks answer changes and sends answerChangeCount in review payload', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
    await mockAttemptViewApi(page);
    await mockAttemptResultApi(page);

    await page.route('**/api/v1/study/spaced-repetition/me/exam-decks', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BASE_DECK_RESPONSE),
      });
    });

    let submitPayload: ReviewRequestPayload | null = null;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      submitPayload = route.request().postDataJSON() as ReviewRequestPayload;
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
    await page.getByRole('button', { name: '2. Lựa chọn B' }).click();
    await page.getByRole('button', { name: '1. Lựa chọn A' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    expect(submitPayload).toBeTruthy();
    expect(submitPayload).toMatchObject({
      itemId: 11,
      isCorrect: true,
      answerChangeCount: 1,
    });
  });

  test('falls back to attempt-result correct options when deck has no correct option data', async ({ page }) => {
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
  await mockAttemptResultApi(page);

    let reviewCallCount = 0;
    let submitPayload: ReviewRequestPayload | null = null;
    await page.route('**/api/v1/study/spaced-repetition/me/review', async (route: Route) => {
      reviewCallCount += 1;
      submitPayload = route.request().postDataJSON() as ReviewRequestPayload;
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
    await page.getByRole('button', { name: '1. Lựa chọn A' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    await expect(page.getByText(/Chính xác! Đã cập nhật SM-2 cho câu 11/i)).toBeVisible();
    expect(reviewCallCount).toBe(1);
    expect(submitPayload).toMatchObject({
      itemId: 11,
      isCorrect: true,
    });
  });

  test('blocks submit when both deck and attempt-view lack correct option data', async ({ page }) => {
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
    await mockAttemptResultApi(page, {
      ...ATTEMPT_RESULT_RESPONSE,
      questionResults: [
        {
          ...ATTEMPT_RESULT_RESPONSE.questionResults[0],
          correctOptionIds: [],
        },
      ],
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
    await page.getByRole('button', { name: '1. Lựa chọn A' }).click();
    await page.getByRole('button', { name: 'Kiểm tra câu này' }).first().click();

    await expect(page.getByText(/Không có đáp án chuẩn cho câu này/i)).toBeVisible();
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
    await expect(page.getByText('Deck này không còn trong danh sách ôn tập.')).toBeVisible();
  });

  test('redirects back to list when exam id param is invalid', async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);

    await page.goto('/dashboard/spaced-repetition/abc/practice?attemptId=99');

    await expect(page).toHaveURL(/\/dashboard\/spaced-repetition$/);
    await expect(page.getByText('ID đề không hợp lệ.')).toBeVisible();
  });
});
