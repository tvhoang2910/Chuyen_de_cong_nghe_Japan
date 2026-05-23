import type { Page, Route } from '@playwright/test';

export type BrowserRole =
  | 'USER'
  | 'CONTRIBUTOR'
  | 'ADMIN'
  | 'AUDIT'
  | 'SYSTEM_ADMIN';

export type BrowserAuthOptions = {
  role?: BrowserRole;
  userId?: number;
  email?: string;
  fullName?: string;
  premium?: boolean;
  accessToken?: string;
  refreshToken?: string;
};

const DEFAULT_AUTH: Required<BrowserAuthOptions> = {
  role: 'USER',
  userId: 1,
  email: 'user@example.com',
  fullName: 'E2E User',
  premium: false,
  accessToken: 'mock.header.signature',
  refreshToken: 'mock-refresh-token',
};

const resolveOptions = (options: BrowserAuthOptions = {}): Required<BrowserAuthOptions> => ({
  ...DEFAULT_AUTH,
  ...options,
});

export async function seedAuthenticatedUser(
  page: Page,
  options: BrowserAuthOptions = {},
): Promise<Required<BrowserAuthOptions>> {
  const resolved = resolveOptions(options);

  await page.addInitScript((payload: Required<BrowserAuthOptions>) => {
    localStorage.setItem('access_token', payload.accessToken);
    localStorage.setItem('refresh_token', payload.refreshToken);
    localStorage.setItem('user_email', payload.email);
    localStorage.setItem('user_role', payload.role);
    localStorage.setItem('user_full_name', payload.fullName);
  }, resolved);

  return resolved;
}

export async function mockUserShellApis(
  page: Page,
  options: BrowserAuthOptions = {},
): Promise<Required<BrowserAuthOptions>> {
  const resolved = resolveOptions(options);

  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: resolved.userId,
        email: resolved.email,
        fullName: resolved.fullName,
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: resolved.role,
        premium: resolved.premium,
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
      body: JSON.stringify({
        publicKey: 'BOr7dummyVapidPublicKeyForE2ETestOnly1234567890abcXYZ',
      }),
    });
  });

  await page.route('**/api/v1/auth/push-subscription', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });

  await page.route('**/api/v1/auth/notifications**', async (route: Route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ updatedCount: 0 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        number: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        unreadCount: 0,
      }),
    });
  });

  await page.route('**/api/v1/notification**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
        unreadCount: 0,
      }),
    });
  });

  return resolved;
}
