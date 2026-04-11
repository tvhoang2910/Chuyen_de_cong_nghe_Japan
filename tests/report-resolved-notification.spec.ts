import { expect, test, type Page, type Route } from '@playwright/test';
import type { ResolveReportPayload } from '../src/api/reportClient';

const ISO_NOW = '2026-04-12T09:30:00.000Z';

async function seedContributor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'report-e2e-token');
    localStorage.setItem('refresh_token', 'report-e2e-refresh-token');
    localStorage.setItem('user_email', 'contributor-report-e2e@example.com');
    localStorage.setItem('user_role', 'CONTRIBUTOR');
  });
}

async function mockContributorShellApis(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 71,
        email: 'contributor-report-e2e@example.com',
        fullName: 'Contributor E2E',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'CONTRIBUTOR',
        premium: true,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/review-queue**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 5,
        first: true,
        last: true,
      }),
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

test.describe('Report resolved notification flow', () => {
  test('resolving a question report to RESOLVED sends expected payload and shows reporter notify UX', async ({ page }) => {
    await seedContributor(page);
    await mockContributorShellApis(page);

    let isResolved = false;
    let resolveCallCount = 0;
    let capturedPayload: ResolveReportPayload | null = null;

    await page.route('**/api/v1/exam/admin/reports**', async (route: Route) => {
      const queue = isResolved
        ? {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
          }
        : {
            content: [
              {
                questionId: 501,
                questionPreview: 'Cau hoi can duoc xu ly bao cao',
                examId: 41,
                examTitle: 'De thi thong bao bao cao',
                topReportType: 'WRONG_ANSWER',
                topReportTypeLabel: 'Sai đáp án',
                totalReportCount: 2,
                uniqueReportersCount: 2,
                reportTypeCounts: {
                  WRONG_ANSWER: 2,
                },
                latestReportedAt: ISO_NOW,
              },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
          };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(queue),
      });
    });

    await page.route('**/api/v1/exam/admin/reports/processed**', async (route: Route) => {
      const processed = isResolved
        ? {
            content: [
              {
                questionId: 501,
                questionPreview: 'Cau hoi can duoc xu ly bao cao',
                examId: 41,
                examTitle: 'De thi thong bao bao cao',
                topReportType: 'WRONG_ANSWER',
                topReportTypeLabel: 'Sai đáp án',
                totalReportCount: 2,
                uniqueReportersCount: 2,
                reportTypeCounts: {
                  WRONG_ANSWER: 2,
                },
                latestReportedAt: ISO_NOW,
              },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
          }
        : {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
          };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(processed),
      });
    });

    await page.route('**/api/v1/exam/admin/reports/questions/501', async (route: Route) => {
      const reports = isResolved
        ? [
            {
              id: 901,
              questionId: 501,
              questionPreview: 'Cau hoi can duoc xu ly bao cao',
              attemptId: 1001,
              examId: 41,
              examTitle: 'De thi thong bao bao cao',
              reporterId: 7001,
              reporterUsername: 'User #7001',
              reportType: 'WRONG_ANSWER',
              reportTypeLabel: 'Sai đáp án',
              description: 'Dap an hien tai khong dung',
              status: 'RESOLVED',
              statusLabel: 'Đã xử lý',
              resolutionNote: 'Da sua dap an',
              resolvedBy: 71,
              resolvedByUsername: 'User #71',
              resolvedAt: ISO_NOW,
              createdAt: ISO_NOW,
            },
            {
              id: 902,
              questionId: 501,
              questionPreview: 'Cau hoi can duoc xu ly bao cao',
              attemptId: 1002,
              examId: 41,
              examTitle: 'De thi thong bao bao cao',
              reporterId: 7002,
              reporterUsername: 'User #7002',
              reportType: 'WRONG_ANSWER',
              reportTypeLabel: 'Sai đáp án',
              description: 'Dap an hien tai khong dung',
              status: 'RESOLVED',
              statusLabel: 'Đã xử lý',
              resolutionNote: 'Da sua dap an',
              resolvedBy: 71,
              resolvedByUsername: 'User #71',
              resolvedAt: ISO_NOW,
              createdAt: ISO_NOW,
            },
          ]
        : [
            {
              id: 901,
              questionId: 501,
              questionPreview: 'Cau hoi can duoc xu ly bao cao',
              attemptId: 1001,
              examId: 41,
              examTitle: 'De thi thong bao bao cao',
              reporterId: 7001,
              reporterUsername: 'User #7001',
              reportType: 'WRONG_ANSWER',
              reportTypeLabel: 'Sai đáp án',
              description: 'Dap an hien tai khong dung',
              status: 'REPORTED',
              statusLabel: 'Mới',
              resolutionNote: null,
              resolvedBy: null,
              resolvedByUsername: null,
              resolvedAt: null,
              createdAt: ISO_NOW,
            },
            {
              id: 902,
              questionId: 501,
              questionPreview: 'Cau hoi can duoc xu ly bao cao',
              attemptId: 1002,
              examId: 41,
              examTitle: 'De thi thong bao bao cao',
              reporterId: 7002,
              reporterUsername: 'User #7002',
              reportType: 'WRONG_ANSWER',
              reportTypeLabel: 'Sai đáp án',
              description: 'Dap an hien tai khong dung',
              status: 'REPORTED',
              statusLabel: 'Mới',
              resolutionNote: null,
              resolvedBy: null,
              resolvedByUsername: null,
              resolvedAt: null,
              createdAt: ISO_NOW,
            },
          ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reports),
      });
    });

    await page.route('**/api/v1/exam/admin/reports/questions/501/history', async (route: Route) => {
      const history = isResolved
        ? [
            {
              id: 701,
              action: 'RESOLVED',
              actionLabel: 'Đã xử lý',
              previousStatus: 'REPORTED',
              newStatus: 'RESOLVED',
              note: 'Da sua dap an',
              processedBy: 71,
              processedAt: ISO_NOW,
            },
          ]
        : [];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(history),
      });
    });

    await page.route('**/api/v1/exam/admin/reports/questions/501/resolve', async (route: Route) => {
      resolveCallCount += 1;
      capturedPayload = route.request().postDataJSON() as ResolveReportPayload;
      isResolved = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '',
      });
    });

    await page.goto('/contributor/reports');

    await expect(page.getByRole('heading', { name: 'Trung tâm báo cáo câu hỏi' })).toBeVisible();
    await expect(page.getByText('Q#501 • De thi thong bao bao cao')).toBeVisible();

    await page.getByLabel('Trạng thái mới').selectOption('RESOLVED');
    await page.getByPlaceholder('Mô tả cách xử lý hoặc lý do từ chối báo cáo').fill('Da sua dap an');
    await page.getByRole('button', { name: 'Cập nhật xử lý' }).click();

    await expect(page.getByText('Đã cập nhật trạng thái xử lý báo cáo.')).toBeVisible();
    await expect(page.getByText('Câu hỏi này đã xử lý xong.')).toBeVisible();
    await expect(
      page.getByText('Khi chọn "Đã xử lý", hệ thống sẽ gửi web push tới các user đã báo lỗi')
    ).toBeVisible();

    expect(resolveCallCount).toBe(1);
    expect(capturedPayload).toEqual({
      status: 'RESOLVED',
      resolutionNote: 'Da sua dap an',
      unhideQuestion: false,
    });
  });
});
