import { expect, test, type APIRequestContext } from '@playwright/test';

import { buildSystemTestContext } from './helpers/system-config';
import { assertServiceReachable } from './helpers/service-health';

type ExamOption = {
  id: number;
  content: string;
  isCorrect?: boolean;
};

type ExamQuestion = {
  id: number;
  content: string;
  options: ExamOption[];
};

type AttemptViewExam = {
  id: number;
  title: string;
  premium?: boolean;
  questions: ExamQuestion[];
};

type PublicExam = {
  id: number;
  title: string;
  premium?: boolean;
};

type StartAttemptResponse = {
  attemptId: number;
  examId: number;
};

type SubmittedAttemptResult = {
  attemptId: number;
  examId: number;
  status: 'SUBMITTED' | 'AUTO_SUBMITTED' | 'IN_PROGRESS';
  scorePercent: number;
  questionResults: Array<{
    questionId: number;
    selectedOptionIds: number[];
  }>;
};

type CreatedComment = {
  id: number;
  content: string;
};

type AuthTokenResponse = {
  accessToken?: string;
};

type FlowActor = {
  token: string;
  userId: number;
};

const ctx = buildSystemTestContext();

const authHeader = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

const requestJson = async <T>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  token: string,
  data?: unknown,
): Promise<{ status: number; body: T | null }> => {
  const options = {
    headers: authHeader(token),
    data,
    failOnStatusCode: false,
    timeout: 20_000,
  };

  const response =
    method === 'GET'
      ? await request.get(url, options)
      : method === 'POST'
        ? await request.post(url, options)
        : method === 'PUT'
          ? await request.put(url, options)
          : method === 'PATCH'
            ? await request.patch(url, options)
            : await request.delete(url, options);

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T) : null;
  return { status: response.status(), body };
};

const requestNoAuthJson = async <T>(
  request: APIRequestContext,
  url: string,
): Promise<{ status: number; body: T | null }> => {
  const response = await request.get(url, {
    headers: { Accept: 'application/json' },
    failOnStatusCode: false,
    timeout: 20_000,
  });
  const text = await response.text();
  return {
    status: response.status(),
    body: text ? (JSON.parse(text) as T) : null,
  };
};

const getJwtUserId = (token: string): number | null => {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(segments[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { userId?: number | string };
    if (typeof payload.userId === 'number' && payload.userId > 0) {
      return payload.userId;
    }
    if (typeof payload.userId === 'string') {
      const parsed = Number(payload.userId);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return null;
  } catch {
    return null;
  }
};

const resolveFlowActor = async (request: APIRequestContext): Promise<FlowActor> => {
  const loginResponse = await request.post(`${ctx.authBaseUrl}/login`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    data: {
      email: ctx.adminLoginEmail,
      password: ctx.adminLoginPassword,
    },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  const loginText = await loginResponse.text();
  const loginBody = loginText ? (JSON.parse(loginText) as AuthTokenResponse) : null;

  if (loginResponse.status() !== 200 || !loginBody?.accessToken) {
    throw new Error(
      `Flow actor login failed with status ${loginResponse.status()}. ` +
        'Ensure auth_service is running with bootstrap admin credentials configured.',
    );
  }

  return {
    token: loginBody.accessToken,
    userId: getJwtUserId(loginBody.accessToken) ?? ctx.adminIdentity.userId,
  };
};

const ensurePublishedExam = async (request: APIRequestContext, adminToken: string): Promise<PublicExam> => {
  const publicExamsResponse = await requestNoAuthJson<PublicExam[]>(request, `${ctx.examBaseUrl}/exams/public`);
  expect(publicExamsResponse.status).toBe(200);

  const nonPremiumExam = (publicExamsResponse.body ?? []).find((exam) => !exam.premium);
  if (nonPremiumExam) {
    return nonPremiumExam;
  }

  const timestamp = Date.now();
  const createExamPayload = {
    title: `E2E Published Exam ${timestamp}`,
    description: 'End-user platform flow E2E exam',
    durationMinutes: 25,
    passingScore: 50,
    maxAttempts: 5,
    premium: false,
    teaserQuestionCount: 2,
    tagIds: [],
    newTags: [`e2e-${timestamp}`],
    questions: [
      {
        content: '2 + 2 = ? ',
        explanation: 'Basic arithmetic',
        scoreWeight: 1,
        options: [
          { content: '4', isCorrect: true },
          { content: '5', isCorrect: false },
        ],
      },
      {
        content: 'Capital of Vietnam is?',
        explanation: 'General knowledge',
        scoreWeight: 1,
        options: [
          { content: 'Ha Noi', isCorrect: true },
          { content: 'Da Nang', isCorrect: false },
        ],
      },
    ],
  };

  const createdExam = await requestJson<{ id: number; title: string }>(
    request,
    'POST',
    `${ctx.examBaseUrl}/exams`,
    adminToken,
    createExamPayload,
  );
  expect(createdExam.status).toBe(200);
  expect(createdExam.body?.id).toBeTruthy();

  const updateStatus = await requestJson<{ id: number; status: string }>(
    request,
    'PATCH',
    `${ctx.examBaseUrl}/exams/${createdExam.body!.id}/status?status=PUBLISHED`,
    adminToken,
  );
  expect(updateStatus.status).toBe(200);

  return {
    id: createdExam.body!.id,
    title: createdExam.body!.title,
    premium: false,
  };
};

const pickAnswerPayload = (attemptView: AttemptViewExam): { questionId: number; selectedOptionIds: number[] } => {
  const question = attemptView.questions.find((item) => item.options && item.options.length > 0) ?? attemptView.questions[0];
  if (!question || !question.id) {
    throw new Error('No question available in attempt-view payload to answer.');
  }

  const firstOption = question.options?.[0];
  return {
    questionId: question.id,
    selectedOptionIds: firstOption?.id ? [firstOption.id] : [],
  };
};

test.describe.serial('End-user full platform journey (real services)', () => {
  test.beforeAll(async ({ request }) => {
    await assertServiceReachable(request, 'auth_service', ctx.authBaseUrl);
    await assertServiceReachable(request, 'exam_service', ctx.examBaseUrl);
    await assertServiceReachable(request, 'study_service', ctx.studyBaseUrl);
    await assertServiceReachable(request, 'community_service', ctx.communityBaseUrl);
  });

  test('user can complete exam flow then access study and community modules', async ({ request }) => {
    const flowActor = await resolveFlowActor(request);
    const selectedExam = await ensurePublishedExam(request, flowActor.token);

    const attemptViewRes = await requestJson<AttemptViewExam>(
      request,
      'GET',
      `${ctx.examBaseUrl}/exams/public/${selectedExam.id}/attempt-view`,
      flowActor.token,
    );
    expect(attemptViewRes.status).toBe(200);
    expect(attemptViewRes.body?.questions?.length ?? 0).toBeGreaterThan(0);

    const startAttemptRes = await requestJson<StartAttemptResponse>(
      request,
      'POST',
      `${ctx.examBaseUrl}/attempts`,
      flowActor.token,
      { examId: selectedExam.id, clientVersion: 'e2e-system-test' },
    );
    expect(startAttemptRes.status).toBe(200);
    expect(startAttemptRes.body?.attemptId).toBeTruthy();

    const answerPayload = pickAnswerPayload(attemptViewRes.body!);

    const saveBatch = await requestJson<null>(
      request,
      'PUT',
      `${ctx.examBaseUrl}/attempts/${startAttemptRes.body!.attemptId}/answers/batch`,
      flowActor.token,
      {
        answers: [
          {
            ...answerPayload,
            responseTimeMs: 8_000,
            answerChangeCount: 0,
          },
        ],
      },
    );
    expect(saveBatch.status).toBe(204);

    const submitAttemptRes = await requestJson<SubmittedAttemptResult>(
      request,
      'POST',
      `${ctx.examBaseUrl}/attempts/${startAttemptRes.body!.attemptId}/submit`,
      flowActor.token,
    );
    expect(submitAttemptRes.status).toBe(200);
    expect(submitAttemptRes.body?.attemptId).toBe(startAttemptRes.body!.attemptId);
    expect(submitAttemptRes.body?.status).toMatch(/SUBMITTED|AUTO_SUBMITTED/);

    const resultRes = await requestJson<SubmittedAttemptResult>(
      request,
      'GET',
      `${ctx.examBaseUrl}/attempts/${startAttemptRes.body!.attemptId}/result`,
      flowActor.token,
    );
    expect(resultRes.status).toBe(200);
    expect(resultRes.body?.questionResults?.length ?? 0).toBeGreaterThan(0);

    const studyStatsRes = await requestJson<Record<string, unknown>>(
      request,
      'GET',
      `${ctx.studyBaseUrl}/analytics/me/stats`,
      flowActor.token,
    );
    expect(studyStatsRes.status).toBe(200);

    const gamificationOverviewRes = await requestJson<Record<string, unknown>>(
      request,
      'GET',
      `${ctx.studyBaseUrl}/gamification/me/overview`,
      flowActor.token,
    );
    expect(gamificationOverviewRes.status).toBe(200);

    const examDecksRes = await requestJson<Record<string, unknown>>(
      request,
      'GET',
      `${ctx.studyBaseUrl}/spaced-repetition/me/exam-decks`,
      flowActor.token,
    );
    expect(examDecksRes.status).toBe(200);

    const createdCommentRes = await requestJson<CreatedComment>(
      request,
      'POST',
      `${ctx.communityBaseUrl}/comments`,
      flowActor.token,
      {
        userId: flowActor.userId,
        targetId: selectedExam.id,
        content: `E2E flow comment for exam ${selectedExam.id}`,
      },
    );
    expect(createdCommentRes.status).toBe(201);
    expect(createdCommentRes.body?.id).toBeTruthy();

    const listCommentsRes = await requestJson<Array<Record<string, unknown>>>(
      request,
      'GET',
      `${ctx.communityBaseUrl}/comments/exam/${selectedExam.id}`,
      flowActor.token,
    );
    expect(listCommentsRes.status).toBe(200);
    expect(Array.isArray(listCommentsRes.body)).toBeTruthy();

    const createdCommentId = createdCommentRes.body!.id;
    const voteRes = await requestJson<Record<string, unknown>>(
      request,
      'POST',
      `${ctx.communityBaseUrl}/comments/${createdCommentId}/vote`,
      flowActor.token,
      { voteType: 'UP' },
    );
    expect(voteRes.status).toBe(200);
  });
});
