import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredEnv = ['BACKEND_URL', 'ADMIN_TOKEN', 'USER_TOKEN'] as const;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const isUploadEndpoint = (url: string): boolean =>
  url.includes('/api/v1/exam/uploads') ||
  url.includes('/uploads/initiate') ||
  url.includes('/uploads/') ||
  url.includes('/admin/uploads/');

function hasAllRequiredEnv(): boolean {
  return requiredEnv.every((key) => Boolean(process.env[key]));
}

test('upload extract flow end-to-end', async ({ browser }) => {
  test.setTimeout(240_000);

  if (!hasAllRequiredEnv()) {
    test.skip(true, 'Missing required env: BACKEND_URL, ADMIN_TOKEN, USER_TOKEN');
  }

  const uploadTitle = `E2E Upload Contract Flow ${Date.now()}`;

  const fixturePath = process.env.PDF_FIXTURE_PATH
    ? path.resolve(process.env.PDF_FIXTURE_PATH)
    : path.resolve(currentDir, 'fixtures/sample-3pages.pdf');

  // User context uploads file.
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  const uploadErrors: string[] = [];
  const uploadRequestFailures: string[] = [];
  userPage.on('response', (response) => {
    const url = response.url();
    if (!isUploadEndpoint(url) || response.status() < 400) {
      return;
    }

    uploadErrors.push(`${response.status()} ${url}`);
  });
  userPage.on('requestfailed', (request) => {
    const url = request.url();
    if (!isUploadEndpoint(url)) {
      return;
    }
    const reason = request.failure()?.errorText ?? 'request failed';
    uploadRequestFailures.push(`${reason} ${url}`);
  });

  await userPage.goto('/');
  await userPage.evaluate((token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', 'USER');
  }, process.env.USER_TOKEN as string);
  await userPage.goto('/upload-exam');

  await expect(userPage.getByRole('heading', { name: /Upload đề thi/i })).toBeVisible({ timeout: 30_000 });
  await userPage.locator('#upload-title').fill(uploadTitle);
  const fileInput = userPage.locator('#upload-files');
  await fileInput.setInputFiles(fixturePath);
  await userPage.getByRole('button', { name: /Gửi duyệt/i }).click();

  try {
    await userPage.waitForURL('**/my-uploads', { timeout: 90_000 });
  } catch {
    const errorDetails = uploadErrors.length > 0 ? uploadErrors.join(' | ') : 'no upload HTTP 4xx/5xx captured';
    const failureDetails =
      uploadRequestFailures.length > 0
        ? uploadRequestFailures.join(' | ')
        : 'no upload request-level failures captured';
    throw new Error(
      `Upload did not complete. currentUrl=${userPage.url()} httpErrors=${errorDetails} requestFailures=${failureDetails}`,
    );
  }

  // Reviewer context (CONTRIBUTOR) approves upload.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('/');
  await adminPage.evaluate((token) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', 'CONTRIBUTOR');
  }, process.env.ADMIN_TOKEN as string);
  await adminPage.goto('/contributor/upload-queue');

  const pendingRow = adminPage.locator('tr', { hasText: uploadTitle }).first();
  await expect(pendingRow).toBeVisible({ timeout: 60_000 });
  await pendingRow.click();
  await adminPage.getByTestId('approve-btn').click();

  // User observes extraction completion and opens extracted exam.
  await userPage.goto('/my-uploads');
  const uploadRow = userPage.locator('tr', { hasText: uploadTitle }).first();
  await expect(uploadRow).toBeVisible({ timeout: 60_000 });
  const openExamLink = uploadRow.getByRole('link', { name: 'Mở đề đã trích xuất' });
  await expect(openExamLink).toBeVisible({ timeout: 180_000 });
  await openExamLink.click();

  await expect(userPage).toHaveURL(/\/dashboard\/exams\/\d+/);
  await expect(userPage.locator('text=/Câu hỏi|Question/i').first()).toBeVisible({ timeout: 30000 });

  await adminContext.close();
  await userContext.close();
});
