import { expect, test } from '@playwright/test';

type ReportQueueResponse = {
  content: Array<{ questionId: number }>;
};

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const examApiBaseUrl = env.SMOKE_EXAM_API_BASE_URL;
const adminToken = env.SMOKE_ADMIN_TOKEN;
const contributorToken = env.SMOKE_CONTRIBUTOR_TOKEN;
const studentToken = env.SMOKE_STUDENT_TOKEN;
const reportedQuestionIdRaw = env.SMOKE_REPORTED_QUESTION_ID;
const reportedQuestionId = reportedQuestionIdRaw ? Number(reportedQuestionIdRaw) : Number.NaN;

const hasRequiredEnv =
  Boolean(examApiBaseUrl) &&
  Boolean(adminToken) &&
  Boolean(contributorToken) &&
  Boolean(studentToken) &&
  Number.isFinite(reportedQuestionId);

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

test.describe('staging smoke - report ownership visibility', () => {
  test.skip(!hasRequiredEnv,
    'Missing required env: SMOKE_EXAM_API_BASE_URL, SMOKE_ADMIN_TOKEN, SMOKE_CONTRIBUTOR_TOKEN, SMOKE_STUDENT_TOKEN, SMOKE_REPORTED_QUESTION_ID');

  test('admin sees own reported question, contributor cannot access it, student is forbidden', async ({ request }) => {
    const adminQueueResponse = await request.get(`${examApiBaseUrl}/admin/reports?page=0&size=100`, {
      headers: authHeaders(adminToken as string),
    });
    expect(adminQueueResponse.ok()).toBeTruthy();

    const adminQueue = (await adminQueueResponse.json()) as ReportQueueResponse;
    expect(adminQueue.content.some((item) => item.questionId === reportedQuestionId)).toBeTruthy();

    const contributorQueueResponse = await request.get(`${examApiBaseUrl}/admin/reports?page=0&size=100`, {
      headers: authHeaders(contributorToken as string),
    });
    expect(contributorQueueResponse.ok()).toBeTruthy();

    const contributorQueue = (await contributorQueueResponse.json()) as ReportQueueResponse;
    expect(contributorQueue.content.some((item) => item.questionId === reportedQuestionId)).toBeFalsy();

    const contributorDetailResponse = await request.get(
      `${examApiBaseUrl}/admin/reports/questions/${reportedQuestionId}`,
      {
        headers: authHeaders(contributorToken as string),
      },
    );
    expect(contributorDetailResponse.status()).toBe(404);

    const contributorHistoryResponse = await request.get(
      `${examApiBaseUrl}/admin/reports/questions/${reportedQuestionId}/history`,
      {
        headers: authHeaders(contributorToken as string),
      },
    );
    expect(contributorHistoryResponse.status()).toBe(404);

    const studentQueueResponse = await request.get(`${examApiBaseUrl}/admin/reports?page=0&size=10`, {
      headers: authHeaders(studentToken as string),
    });
    expect(studentQueueResponse.status()).toBe(403);
  });
});
