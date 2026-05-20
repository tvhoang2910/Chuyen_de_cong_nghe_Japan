import { expect, test, type Page, type Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123';
const ADMIN_FULL_NAME = 'Admin User';

const MOCK_USERS_PAGE = {
  content: [
    {
      id: 1,
      email: 'user1@example.com',
      fullName: 'User One',
      role: 'USER',
      status: true,
      statusCode: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      email: 'user2@example.com',
      fullName: 'User Two',
      role: 'USER',
      status: true,
      statusCode: 1,
      createdAt: '2026-01-02T00:00:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 2,
  number: 0,
  size: 20,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedAdminAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock-admin-token');
    localStorage.setItem('refresh_token', 'mock-admin-refresh');
    localStorage.setItem('user_email', 'admin@example.com');
    localStorage.setItem('user_role', 'ADMIN');
  });
}

async function mockAdminApis(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 100,
        email: ADMIN_EMAIL,
        fullName: ADMIN_FULL_NAME,
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'ADMIN',
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

  await page.route('**/api/v1/auth/admin/users**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS_PAGE),
    });
  });
}

async function mockLoginApi(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login', async (route: Route) => {
    const body = route.request().postDataJSON() as { email?: string; password?: string };

    if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-admin-token',
          refreshToken: 'mock-admin-refresh',
          email: ADMIN_EMAIL,
          role: 'ADMIN',
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Admin Flow', () => {
  test('admin can login', async ({ page }) => {
    await mockLoginApi(page);
    await mockAdminApis(page);

    await page.goto('/login');

    await page.getByLabel(/địa chỉ email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/mật khẩu/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /xác nhận đăng nhập/i }).click();

    // Admin should be redirected to /admin/users
    await expect(page).toHaveURL(/admin\/users/, { timeout: 10000 });
  });

  test('admin sees admin users page', async ({ page }) => {
    await seedAdminAuth(page);
    await mockAdminApis(page);

    await page.goto('/admin/users');

    // Should show users management page
    await expect(page.getByText('User One')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('User Two')).toBeVisible();
  });

  test('admin can view users list', async ({ page }) => {
    await seedAdminAuth(page);
    await mockAdminApis(page);

    await page.goto('/admin/users');

    await expect(page.getByText('user1@example.com')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('user2@example.com')).toBeVisible();
  });

  test('admin can navigate to admin dashboard', async ({ page }) => {
    await seedAdminAuth(page);
    await mockAdminApis(page);

    // AdminDashboard uses SSE hooks — stub them
    await page.route('**/api/v1/exam/events**', async (route: Route) => {
      await route.abort();
    });

    await page.route('**/api/v1/auth/presence**', async (route: Route) => {
      await route.abort();
    });

    await page.goto('/admin/dashboard');

    // The admin dashboard renders stat cards and charts with static data
    await expect(page.getByText(/dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('non-admin is redirected away from admin routes', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-user-token');
      localStorage.setItem('user_role', 'USER');
    });

    await page.goto('/admin/users');

    // Should be redirected away from admin page
    await expect(page).not.toHaveURL(/admin\/users/, { timeout: 5000 });
  });

  test('unauthenticated user is redirected to login from admin route', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/admin/users');

    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
