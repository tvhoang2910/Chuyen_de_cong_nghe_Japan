import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { buildSystemTestContext } from './helpers/system-config';
import { assertServiceReachable } from './helpers/service-health';

type LoginResponse = {
  accessToken?: string;
};

type UserProfileResponse = {
  id: number;
  avatarUrl?: string | null;
};

type PremiumPlanSummary = {
  id: number;
};

type SubscriptionRequestItem = {
  id: number;
  status?: string;
  type?: string;
  billImageUrl?: string | null;
};

type DemoUser = {
  id: number;
  email: string;
  password: string;
  token: string;
};

const ctx = buildSystemTestContext();
const PNG_1PX_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9k5x0AAAAASUVORK5CYII=';

const authJsonHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
});

const decodeUserIdFromToken = (token: string): number | null => {
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

const loginAndGetToken = async (
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> => {
  const loginRes = await request.post(`${ctx.authBaseUrl}/login`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    data: { email, password },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  const loginText = await loginRes.text();
  const loginBody = loginText ? (JSON.parse(loginText) as LoginResponse) : null;
  if (loginRes.status() !== 200 || !loginBody?.accessToken) {
    throw new Error(`Login failed for ${email}. status=${loginRes.status()} body=${loginText}`);
  }

  return loginBody.accessToken;
};

const provisionDemoUser = async (request: APIRequestContext): Promise<DemoUser> => {
  const suffix = Date.now();
  const email = `demo.e2e.${suffix}@exam-bank.local`;
  const password = `Demo@${suffix}Aa`;
  const adminToken = await loginAndGetToken(request, ctx.adminLoginEmail, ctx.adminLoginPassword);

  const createUserRes = await request.post(`${ctx.authBaseUrl}/admin/users`, {
    headers: authJsonHeaders(adminToken),
    data: {
      email,
      fullName: 'Demo E2E User',
      password,
      role: 'USER',
    },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  if (createUserRes.status() !== 201) {
    const responseBody = await createUserRes.text();
    throw new Error(`Failed to provision demo user. status=${createUserRes.status()} body=${responseBody}`);
  }

  const token = await loginAndGetToken(request, email, password);
  const userId = decodeUserIdFromToken(token);
  if (!userId) {
    throw new Error('Unable to resolve userId from demo user access token');
  }

  return {
    id: userId,
    email,
    password,
    token,
  };
};

const uploadAvatarAndAssertProxyUrl = async (request: APIRequestContext, user: DemoUser): Promise<void> => {
  const uploadRes = await request.post(`${ctx.authBaseUrl}/me/avatar`, {
    headers: authHeaders(user.token),
    multipart: {
      file: {
        name: 'avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.from(PNG_1PX_BASE64, 'base64'),
      },
    },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  const uploadText = await uploadRes.text();
  const uploadBody = uploadText ? (JSON.parse(uploadText) as UserProfileResponse) : null;
  if (uploadRes.status() !== 200) {
    throw new Error(`Avatar upload failed. status=${uploadRes.status()} body=${uploadText}`);
  }

  const avatarUrl = uploadBody?.avatarUrl ?? '';
  expect(avatarUrl).toContain(`/api/v1/auth/users/${user.id}/avatar`);
  expect(avatarUrl).not.toContain('minio:9000');
};

const ensurePremiumPlansAvailable = async (
  request: APIRequestContext,
  userToken: string,
): Promise<PremiumPlanSummary[]> => {
  const loadPlans = async (): Promise<{ status: number; text: string; plans: PremiumPlanSummary[] }> => {
    const response = await request.get(`${ctx.authBaseUrl}/subscriptions/plans`, {
      headers: authHeaders(userToken),
      failOnStatusCode: false,
      timeout: 20_000,
    });

    const responseText = await response.text();
    const responsePlans = responseText ? (JSON.parse(responseText) as PremiumPlanSummary[]) : [];
    return {
      status: response.status(),
      text: responseText,
      plans: Array.isArray(responsePlans) ? responsePlans : [],
    };
  };

  const initial = await loadPlans();
  if (initial.status !== 200) {
    throw new Error(`Cannot load premium plans. status=${initial.status} body=${initial.text}`);
  }
  if (initial.plans.length > 0) {
    return initial.plans;
  }

  const adminToken = await loginAndGetToken(request, ctx.adminLoginEmail, ctx.adminLoginPassword);
  const seedName = `E2E Premium Plan ${Date.now()}`;
  const createPlanRes = await request.post(`${ctx.authBaseUrl}/subscriptions/plans`, {
    headers: authJsonHeaders(adminToken),
    data: {
      name: seedName,
      price: 99000,
      durationDays: 30,
      lifetime: false,
      description: 'Auto-seeded by Playwright system test',
      active: true,
    },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  if (createPlanRes.status() !== 201) {
    const createText = await createPlanRes.text();
    throw new Error(
      `Cannot seed premium plan for E2E. status=${createPlanRes.status()} body=${createText}`,
    );
  }

  const afterSeed = await loadPlans();
  if (afterSeed.status !== 200 || afterSeed.plans.length === 0) {
    throw new Error(
      `Premium plans are still unavailable after auto-seed. status=${afterSeed.status} body=${afterSeed.text}`,
    );
  }

  return afterSeed.plans;
};

const ensureBillExistsForUser = async (request: APIRequestContext, user: DemoUser): Promise<number> => {
  const plans = await ensurePremiumPlansAvailable(request, user.token);

  const myRequestsBeforeRes = await request.get(`${ctx.authBaseUrl}/subscriptions/my-requests`, {
    headers: authHeaders(user.token),
    failOnStatusCode: false,
    timeout: 20_000,
  });
  const myRequestsBeforeText = await myRequestsBeforeRes.text();
  const myRequestsBefore = myRequestsBeforeText
    ? (JSON.parse(myRequestsBeforeText) as SubscriptionRequestItem[])
    : [];

  if (myRequestsBeforeRes.status() !== 200) {
    throw new Error(`Cannot load existing subscription requests. status=${myRequestsBeforeRes.status()} body=${myRequestsBeforeText}`);
  }

  const existingWithBill = myRequestsBefore.find((item) => Boolean(item.billImageUrl));
  if (existingWithBill) {
    return existingWithBill.id;
  }

  const createRequestRes = await request.post(`${ctx.authBaseUrl}/subscriptions/purchase-requests`, {
    headers: authHeaders(user.token),
    multipart: {
      planId: String(plans[0].id),
      paymentMethod: 'bank_transfer',
      transactionRef: `E2E-${Date.now()}`,
      bill: {
        name: 'bill.png',
        mimeType: 'image/png',
        buffer: Buffer.from(PNG_1PX_BASE64, 'base64'),
      },
    },
    failOnStatusCode: false,
    timeout: 20_000,
  });

  const createRequestText = await createRequestRes.text();
  if (createRequestRes.status() !== 201) {
    throw new Error(`Cannot create subscription purchase request. status=${createRequestRes.status()} body=${createRequestText}`);
  }

  const myRequestsAfterRes = await request.get(`${ctx.authBaseUrl}/subscriptions/my-requests`, {
    headers: authHeaders(user.token),
    failOnStatusCode: false,
    timeout: 20_000,
  });
  const myRequestsAfterText = await myRequestsAfterRes.text();
  const myRequestsAfter = myRequestsAfterText
    ? (JSON.parse(myRequestsAfterText) as SubscriptionRequestItem[])
    : [];

  if (myRequestsAfterRes.status() !== 200) {
    throw new Error(`Cannot reload subscription requests after creation. status=${myRequestsAfterRes.status()} body=${myRequestsAfterText}`);
  }

  const latestWithBill = myRequestsAfter.find((item) => Boolean(item.billImageUrl));
  if (!latestWithBill) {
    throw new Error('No subscription request with billImageUrl found after creating purchase request');
  }

  return latestWithBill.id;
};

const reviewSubscriptionAndAssertUserNotification = async (
  request: APIRequestContext,
  user: DemoUser,
  subscriptionRequestId: number,
): Promise<void> => {
  const adminToken = await loginAndGetToken(request, ctx.adminLoginEmail, ctx.adminLoginPassword);

  const reviewRes = await request.patch(
    `${ctx.authBaseUrl}/subscriptions/purchase-requests/${subscriptionRequestId}/review`,
    {
      headers: authJsonHeaders(adminToken),
      data: {
        approved: true,
        reviewNote: 'E2E auto-approval before demo',
      },
      failOnStatusCode: false,
      timeout: 20_000,
    },
  );

  if (reviewRes.status() !== 200) {
    const reviewText = await reviewRes.text();
    throw new Error(
      `Cannot review subscription request id=${subscriptionRequestId}. status=${reviewRes.status()} body=${reviewText}`,
    );
  }

  const notificationsRes = await request.get(`${ctx.authBaseUrl}/notifications?page=0&size=20`, {
    headers: authHeaders(user.token),
    failOnStatusCode: false,
    timeout: 20_000,
  });

  const notificationsText = await notificationsRes.text();
  if (notificationsRes.status() !== 200) {
    throw new Error(
      `Cannot fetch user notifications after review. status=${notificationsRes.status()} body=${notificationsText}`,
    );
  }

  const notificationsBody = notificationsText
    ? (JSON.parse(notificationsText) as { content?: Array<{ type?: string }> })
    : null;
  const hasReviewedNotification = Boolean(
    notificationsBody?.content?.some((item) => item.type === 'SUBSCRIPTION_REVIEWED'),
  );
  expect(hasReviewedNotification).toBeTruthy();
};

const attachRuntimeCollectors = (
  page: Page,
  buffers: {
    mixedContentWarnings: string[];
    minioRequests: string[];
    failedMinioRequests: string[];
    gamificationStatuses: number[];
  },
): void => {
  page.on('console', (message) => {
    const text = message.text();
    if (/mixed content|minio:9000/i.test(text)) {
      buffers.mixedContentWarnings.push(text);
    }
  });

  page.on('request', (request) => {
    const url = request.url();
    if (/minio:9000/i.test(url)) {
      buffers.minioRequests.push(url);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (/minio:9000/i.test(url)) {
      buffers.failedMinioRequests.push(
        `${url} :: ${request.failure()?.errorText ?? 'unknown request failure'}`,
      );
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/v1/study/gamification/me/overview')) {
      buffers.gamificationStatuses.push(response.status());
    }
  });
};

test.describe.serial('Deploy end-user smoke flow (real UI + real APIs)', () => {
  test.beforeAll(async ({ request }) => {
    await assertServiceReachable(request, 'auth_service', ctx.authBaseUrl);
    await assertServiceReachable(request, 'exam_service', ctx.examBaseUrl);
    await assertServiceReachable(request, 'study_service', ctx.studyBaseUrl);
    await assertServiceReachable(request, 'community_service', ctx.communityBaseUrl);
  });

  test('end-user login, avatar rendering, bill preview, notification endpoints, and gamification health', async ({ request, page }) => {
    const user = await provisionDemoUser(request);
    await uploadAvatarAndAssertProxyUrl(request, user);
    const subscriptionRequestId = await ensureBillExistsForUser(request, user);
    await reviewSubscriptionAndAssertUserNotification(request, user, subscriptionRequestId);

    const preferenceRes = await request.get(`${ctx.authBaseUrl}/notifications/preferences`, {
      headers: authHeaders(user.token),
      failOnStatusCode: false,
      timeout: 20_000,
    });
    expect(preferenceRes.status()).toBe(200);

    const notificationsRes = await request.get(`${ctx.authBaseUrl}/notifications?page=0&size=5`, {
      headers: authHeaders(user.token),
      failOnStatusCode: false,
      timeout: 20_000,
    });
    expect(notificationsRes.status()).toBe(200);

    const runtimeBuffers = {
      mixedContentWarnings: [] as string[],
      minioRequests: [] as string[],
      failedMinioRequests: [] as string[],
      gamificationStatuses: [] as number[],
    };
    attachRuntimeCollectors(page, runtimeBuffers);

    await page.goto(`${ctx.webBaseUrl}/login`, { waitUntil: 'domcontentloaded' });

    const meResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/auth/me') &&
        response.request().method() === 'GET',
      { timeout: 20_000 },
    );

    await page.getByPlaceholder('name@university.edu').fill(user.email);
    await page.getByPlaceholder('••••••••').fill(user.password);
    await page.getByRole('button', { name: 'Xác nhận đăng nhập' }).click();

    const meResponse = await meResponsePromise;
    expect(meResponse.status()).toBe(200);

    const meBody = (await meResponse.json()) as UserProfileResponse;
    expect(meBody.avatarUrl ?? '').toContain(`/api/v1/auth/users/${user.id}/avatar`);
    expect(meBody.avatarUrl ?? '').not.toContain('minio:9000');

    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${ctx.webBaseUrl}/dashboard/subscription-payments`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { name: 'Lịch sử yêu cầu của bạn' })).toBeVisible();

    const billButton = page.getByRole('button', { name: 'Xem bill đã tải lên' }).first();
    await expect(billButton).toBeVisible({ timeout: 20_000 });

    const billResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/auth/subscriptions/purchase-requests/${subscriptionRequestId}/bill`) &&
        response.request().method() === 'GET',
      { timeout: 20_000 },
    );

    await billButton.click();

    const billResponse = await billResponsePromise;
    expect(billResponse.status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Bill chuyển khoản' })).toBeVisible();

    const billImage = page.locator(`img[alt="Bill ${subscriptionRequestId}"]`).first();
    await expect(billImage).toBeVisible();

    const billImageSrc = await billImage.getAttribute('src');
    expect(Boolean(billImageSrc?.startsWith('blob:'))).toBeTruthy();
    expect(page.url()).toContain('/dashboard/subscription-payments');
    expect(page.url()).not.toContain('minio:9000');

    await page.goto(`${ctx.webBaseUrl}/dashboard`, { waitUntil: 'networkidle' });

    const gamificationOverviewRes = await request.get(`${ctx.studyBaseUrl}/gamification/me/overview`, {
      headers: authHeaders(user.token),
      failOnStatusCode: false,
      timeout: 20_000,
    });
    expect(gamificationOverviewRes.status()).toBe(200);

    expect(runtimeBuffers.minioRequests, 'Found direct browser requests to internal MinIO URLs').toHaveLength(0);
    expect(runtimeBuffers.failedMinioRequests, 'Found failed browser requests to internal MinIO URLs').toHaveLength(0);
    expect(runtimeBuffers.mixedContentWarnings, 'Found mixed-content warnings related to MinIO/internal URLs').toHaveLength(0);
    expect(runtimeBuffers.gamificationStatuses.filter((status) => status === 502), 'Detected 502 responses for gamification overview').toHaveLength(0);
  });
});
