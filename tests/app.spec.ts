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

  await page.click('button:has-text("John Doe")');
  await expect(page).toHaveURL(/.*\/login/);
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
