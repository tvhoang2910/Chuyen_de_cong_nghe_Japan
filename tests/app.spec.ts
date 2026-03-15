import { test, expect } from '@playwright/test';

test('has title and landing page content', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('Tối ưu trí nhớ');
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');

  const loginButton = page.locator('a[href="/login"]').first();
  await loginButton.click();

  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.locator('h2')).toContainText('Chào mừng trở lại');
});

test('oauth2 success callback redirects admin to admin users page immediately', async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
  });

  await page.goto('/oauth2/success?token=gg-access-token&refreshToken=gg-refresh-token&email=admin@example.com&role=ADMIN');

  await expect(page).toHaveURL(/.*\/admin\/users/);
  await expect(page.locator('h1')).toContainText('Quản lý Users');
});

test('shows validation errors on empty login submit', async ({ page }) => {
  await page.goto('/login');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Email không hợp lệ')).toBeVisible();
});

test('shows lockout message when backend returns 429', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Too many failed login attempts. Please try again later.' }),
    });
  });

  await page.goto('/login');
  await page.fill('input#email-input', 'john@example.com');
  await page.fill('input#password-input', 'wrongpassword');
  await page.click('button[type="submit"]');

  await expect(page.locator('p:has-text("Too many failed login attempts")')).toBeVisible();
});

test('redirects to dashboard after successful login and back to login after logout', async ({ page }) => {
  let meCallCount = 0;

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        email: 'john@example.com',
      }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    meCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'john@example.com',
        fullName: 'John Doe',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Logged out successfully' }),
    });
  });

  await page.goto('/login');
  await page.fill('input#email-input', 'john@example.com');
  await page.fill('input#password-input', 'correct-password');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect.poll(() => meCallCount).toBe(1);

  await page.click('#sidebar-logout-button');
  await expect(page).toHaveURL(/.*\/login/);
});

test('can update display name and password from dashboard', async ({ page }) => {
  const updatePayloads: Array<Record<string, string>> = [];

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        email: 'john@example.com',
      }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      const payload = (await route.request().postDataJSON()) as Record<string, string>;
      updatePayloads.push(payload);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'john@example.com',
          fullName: payload.fullName ?? 'John Doe',
          role: 'USER',
          premium: false,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'john@example.com',
        fullName: 'John Doe',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.goto('/login');
  await page.fill('input#email-input', 'john@example.com');
  await page.fill('input#password-input', 'correct-password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/);

  await page.click('#profile-settings-trigger');
  await expect(page.locator('h2:has-text("Cập nhật thông tin cá nhân")')).toBeVisible();

  await page.fill('input#display-name-input', 'John Wick');
  await page.click('button:has-text("Lưu hồ sơ")');
  await expect(page.locator('h1')).toContainText('John Wick');

  await page.click('#profile-settings-trigger');

  await page.fill('input#current-password-input', 'old-password-123');
  await page.fill('input#new-password-input', 'new-password-123');
  await page.fill('input#confirm-password-input', 'new-password-123');
  await page.click('button:has-text("Cập nhật mật khẩu")');

  await expect.poll(() => updatePayloads.length).toBe(2);
  await expect(page).toHaveURL(/.*\/login/);
  expect(updatePayloads[0]).toEqual({
    fullName: 'John Wick',
    avatarUrl: null,
    phoneNumber: null,
    school: null,
    subject: null,
  });
  expect(updatePayloads[1]).toEqual({
    currentPassword: 'old-password-123',
    newPassword: 'new-password-123',
  });
});

test('admin can view users list and create user', async ({ page }) => {
  const createdPayloads: Array<Record<string, string>> = [];
  let listCallCount = 0;

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });

  await page.route('**/api/v1/auth/admin/users**', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = (await route.request().postDataJSON()) as Record<string, string>;
      createdPayloads.push(payload);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 77,
          email: payload.email,
          fullName: payload.fullName,
          avatarUrl: null,
          phoneNumber: null,
          school: null,
          subject: null,
          role: payload.role,
          status: true,
          statusCode: 1,
          statusReason: null,
          statusChangedBy: null,
          createdAt: '2026-03-15T10:00:00Z',
        }),
      });
      return;
    }

    listCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 1,
            email: 'teacher.one@example.com',
            fullName: 'Teacher One',
            avatarUrl: null,
            phoneNumber: null,
            school: null,
            subject: null,
            role: 'CONTRIBUTOR',
            status: true,
            statusCode: 1,
            statusReason: null,
            statusChangedBy: null,
            createdAt: '2026-03-10T10:00:00Z',
          },
        ],
        totalPages: 1,
        totalElements: 1,
        number: 0,
        size: 10,
      }),
    });
  });

  await page.goto('/admin/users');
  await expect(page.locator('h1')).toContainText('Quản lý Users');
  await expect(page.locator('text=teacher.one@example.com')).toBeVisible();

  await page.fill('#admin-search-input', 'teacher.one');
  await page.selectOption('#admin-role-filter', 'CONTRIBUTOR');
  await page.click('#admin-search-submit');

  await page.fill('#admin-create-fullname', 'Teacher Two');
  await page.fill('#admin-create-email', 'teacher.two@example.com');
  await page.fill('#admin-create-password', 'strong-pass-123');
  await page.selectOption('#admin-create-role', 'CONTRIBUTOR');
  await page.click('#admin-create-submit');

  await expect.poll(() => listCallCount).toBeGreaterThan(1);
  await expect.poll(() => createdPayloads.length).toBe(1);
  expect(createdPayloads[0]).toEqual({
    fullName: 'Teacher Two',
    email: 'teacher.two@example.com',
    password: 'strong-pass-123',
    role: 'CONTRIBUTOR',
  });
});

test('admin can change role and lock/unlock user', async ({ page }) => {
  const rolePayloads: Array<Record<string, string>> = [];
  const statusPayloads: Array<Record<string, string | number | boolean>> = [];

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });

  await page.route('**/api/v1/auth/admin/users?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 1,
            email: 'teacher.one@example.com',
            fullName: 'Teacher One',
            avatarUrl: null,
            phoneNumber: null,
            school: null,
            subject: null,
            role: 'CONTRIBUTOR',
            status: true,
            statusCode: 1,
            statusReason: null,
            statusChangedBy: null,
            createdAt: '2026-03-10T10:00:00Z',
          },
        ],
        totalPages: 1,
        totalElements: 1,
        number: 0,
        size: 10,
      }),
    });
  });

  await page.route('**/api/v1/auth/admin/users/1/role', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, string>;
    rolePayloads.push(payload);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'teacher.one@example.com',
        fullName: 'Teacher One',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: payload.role,
        status: true,
        statusCode: 1,
        statusReason: null,
        statusChangedBy: null,
        createdAt: '2026-03-10T10:00:00Z',
      }),
    });
  });

  await page.route('**/api/v1/auth/admin/users/1/status', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, string | number | boolean>;
    statusPayloads.push(payload);
    const isBanned = payload.status === 0;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'teacher.one@example.com',
        fullName: 'Teacher One',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role: 'ADMIN',
        status: !isBanned,
        statusCode: isBanned ? 0 : 1,
        statusReason: payload.reason,
        statusChangedBy: 'admin@example.com',
        createdAt: '2026-03-10T10:00:00Z',
      }),
    });
  });

  await page.goto('/admin/users');
  await expect(page.locator('text=teacher.one@example.com')).toBeVisible();

  await page.selectOption('select[aria-label="role-1"]', 'ADMIN');
  await expect.poll(() => rolePayloads.length).toBe(1);
  expect(rolePayloads[0]).toEqual({ role: 'ADMIN' });
  await expect(page.locator('select[aria-label="role-1"]')).toHaveValue('ADMIN');

  await page.fill('#status-reason-1', 'Vi phạm quy chế thi');
  await page.click('button:has-text("Khóa")');
  await expect.poll(() => statusPayloads.length).toBe(1);
  expect(statusPayloads[0]).toEqual({ status: 0, reason: 'Vi phạm quy chế thi' });
  await expect(page.locator('text=BANNED (0)')).toBeVisible();

  await page.fill('#status-reason-1', 'Đã xử lý xong khiếu nại');
  await page.click('button:has-text("Mở khóa")');
  await expect.poll(() => statusPayloads.length).toBe(2);
  expect(statusPayloads[1]).toEqual({ status: 1, reason: 'Đã xử lý xong khiếu nại' });
  await expect(page.locator('text=ACTIVE (1)')).toBeVisible();
});

test('admin can import users by json payload', async ({ page }) => {
  const importPayloads: Array<Record<string, unknown>> = [];

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });

  await page.route('**/api/v1/auth/admin/users?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
      }),
    });
  });

  await page.route('**/api/v1/auth/admin/users/import-json', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
    importPayloads.push(payload);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        total: 2,
        created: 1,
        skipped: 1,
        failed: 0,
        errors: [
          { index: 1, email: 'exists@example.com', reason: 'Email already exists (skipped)' },
        ],
      }),
    });
  });

  await page.goto('/admin/users');
  await page.fill('#admin-import-json-input', JSON.stringify([
    {
      email: 'new.teacher@example.com',
      fullName: 'New Teacher',
      password: 'strong-pass-123',
      role: 'CONTRIBUTOR',
    },
    {
      email: 'exists@example.com',
      fullName: 'Exists Teacher',
      password: 'strong-pass-123',
      role: 'USER',
    },
  ]));
  await page.check('#admin-import-skip-existing');
  await page.click('#admin-import-submit');

  await expect.poll(() => importPayloads.length).toBe(1);
  await expect(page.locator('text=Tổng: 2 | Tạo mới: 1 | Bỏ qua: 1 | Lỗi: 0')).toBeVisible();
});

test('admin can generate sample json for import', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });

  await page.route('**/api/v1/auth/admin/users?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
      }),
    });
  });

  await page.goto('/admin/users');
  await page.click('#admin-import-generate-sample');

  const importText = await page.inputValue('#admin-import-json-input');
  expect(importText).toContain('teacher.one@example.com');
  expect(importText).toContain('CONTRIBUTOR');
});

test('forgot-password flow navigates to OTP and reset password pages', async ({ page }) => {
  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'OTP has been sent if email exists' }),
    });
  });

  await page.route('**/api/v1/auth/forgot-password/verify-otp', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resetToken: 'reset-token-123',
        message: 'OTP verified successfully',
      }),
    });
  });

  await page.route('**/api/v1/auth/reset-password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Password reset successfully' }),
    });
  });

  await page.goto('/forgot-password');
  await page.fill('input#forgot-email-input', 'john@example.com');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*\/forgot-password\/verify\?email=/);

  await page.fill('input#otp-input', '123456');
  await page.click('button#verify-otp-submit');
  await expect(page).toHaveURL(/.*\/reset-password\?token=/);

  await page.fill('input#new-password-input', 'new-password-123');
  await page.fill('input#confirm-password-input', 'new-password-123');
  await page.click('button#reset-password-submit');

  await expect(page).toHaveURL(/.*\/login/);
});
