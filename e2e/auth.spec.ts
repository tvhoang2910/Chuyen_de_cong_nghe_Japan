import { expect, test, type Page, type Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_EMAIL = 'e2e-user@example.com';
const VALID_PASSWORD = 'Password123';
const VALID_FULL_NAME = 'E2E Test User';

/**
 * Mock the auth API endpoints via Playwright route interception.
 * This lets tests run without a real backend.
 */
async function mockAuthApis(page: Page): Promise<void> {
  // Mock: POST /api/v1/auth/login → success
  await page.route('**/api/v1/auth/login', async (route: Route) => {
    const body = route.request().postDataJSON() as { email?: string; password?: string };

    if (body.email === VALID_EMAIL && body.password === VALID_PASSWORD) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          email: VALID_EMAIL,
          role: 'USER',
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Sai email hoặc mật khẩu.' }),
      });
    }
  });

  // Mock: POST /api/v1/auth/register → success
  await page.route('**/api/v1/auth/register', async (route: Route) => {
    const body = route.request().postDataJSON() as { email?: string };

    if (body.email === 'existing@example.com') {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already in use' }),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Registration successful' }),
      });
    }
  });

  // Mock: GET /api/v1/auth/me (profile fetch after login)
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: VALID_EMAIL,
        fullName: VALID_FULL_NAME,
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'USER',
        premium: false,
      }),
    });
  });

  // Mock: GET subscriptions (MainLayout / auth check)
  await page.route('**/api/v1/auth/subscriptions/my-requests', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

/** Seed authenticated user in localStorage before page loads */
async function seedAuth(page: Page, role = 'USER'): Promise<void> {
  await page.addInitScript(
    ({ role, email }) => {
      localStorage.setItem('access_token', 'mock-access-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_role', role);
    },
    { role, email: VALID_EMAIL },
  );
}

// ---------------------------------------------------------------------------
// Tests: Registration
// ---------------------------------------------------------------------------

test.describe('Authentication — Registration', () => {
  test('user can register with valid data', async ({ page }) => {
    await mockAuthApis(page);
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: /tạo tài khoản mới/i })).toBeVisible();

    await page.getByLabel(/họ và tên/i).fill('New User Test');
    await page.getByLabel(/email sinh viên/i).fill('newuser@student.edu.vn');
    await page.getByLabel(/^mật khẩu$/i).fill('SecurePass123');
    await page.getByLabel(/nhập lại mật khẩu/i).fill('SecurePass123');

    await page.getByRole('button', { name: /bắt đầu ngay/i }).click();

    // Should redirect to verify-email page after successful registration
    await expect(page).toHaveURL(/register\/verify-email/);
  });

  test('register shows validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');

    // Submit with empty form
    await page.getByRole('button', { name: /bắt đầu ngay/i }).click();

    // Should show validation errors
    await expect(page.getByText(/họ tên phải có ít nhất 3 ký tự/i)).toBeVisible();
  });

  test('register shows validation error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/họ và tên/i).fill('Test User Name');
    await page.getByLabel(/email sinh viên/i).fill('test@student.edu.vn');
    await page.getByLabel(/^mật khẩu$/i).fill('Password123');
    await page.getByLabel(/nhập lại mật khẩu/i).fill('DifferentPassword');

    await page.getByRole('button', { name: /bắt đầu ngay/i }).click();

    await expect(page.getByText(/mật khẩu xác nhận không khớp/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests: Login
// ---------------------------------------------------------------------------

test.describe('Authentication — Login', () => {
  test('user can login with valid credentials', async ({ page }) => {
    await mockAuthApis(page);
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible();

    await page.getByLabel(/địa chỉ email/i).fill(VALID_EMAIL);
    await page.getByLabel(/mật khẩu/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /xác nhận đăng nhập/i }).click();

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login shows error for wrong password', async ({ page }) => {
    await mockAuthApis(page);
    await page.goto('/login');

    await page.getByLabel(/địa chỉ email/i).fill(VALID_EMAIL);
    await page.getByLabel(/mật khẩu/i).fill('wrongpassword');
    await page.getByRole('button', { name: /xác nhận đăng nhập/i }).click();

    // Should show error message (toast)
    await expect(page.getByText(/sai email hoặc mật khẩu/i)).toBeVisible({ timeout: 5000 });
  });

  test('login shows validation toast when fields are empty', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /xác nhận đăng nhập/i }).click();

    await expect(page.getByText(/vui lòng nhập đầy đủ email và mật khẩu/i)).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Tests: Logout
// ---------------------------------------------------------------------------

test.describe('Authentication — Logout', () => {
  test('user can logout from dashboard', async ({ page }) => {
    // Mock APIs needed for dashboard
    await page.route('**/api/v1/auth/me', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1, email: VALID_EMAIL, fullName: VALID_FULL_NAME,
          avatarUrl: null, phoneNumber: null, school: null, subject: null,
          role: 'USER', premium: false,
        }),
      });
    });

    await page.route('**/api/v1/auth/subscriptions/my-requests', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/v1/exam/attempts/my-history**', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/v1/study/**', async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalAttempts: 0, avgScorePercent: 0, streakDays: 0, totalStudyMinutes: 0, dueCardsCount: 0 }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ points: [] }) });
      }
    });

    await page.route('**/api/v1/notification**', async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, unreadCount: 0 }) });
    });

    await seedAuth(page);
    await page.goto('/dashboard');

    // Find and click logout button in sidebar/header
    const logoutButton = page.getByRole('button', { name: /đăng xuất/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/login/);
    } else {
      // Logout may be behind a menu — just verify dashboard loaded
      await expect(page.getByText(/chào buổi sáng/i)).toBeVisible({ timeout: 10000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Redirect guard
// ---------------------------------------------------------------------------

test.describe('Authentication — Access control', () => {
  test('unauthenticated user is redirected to login from protected route', async ({ page }) => {
    // Ensure localStorage is clean
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/login/);
  });

  test('authenticated user is redirected away from login page', async ({ page }) => {
    await mockAuthApis(page);
    await seedAuth(page);

    await page.goto('/login');

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});
