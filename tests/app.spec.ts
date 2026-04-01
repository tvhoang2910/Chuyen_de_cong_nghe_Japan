import { test, expect } from '@playwright/test';

const TEST_CURRENT_PASSWORD = ['old', '-', 'password', '-', '123'].join('');
const TEST_NEW_PASSWORD = ['new', '-', 'password', '-', '123'].join('');
const TEST_ADMIN_CREATE_PASSWORD = ['strong', '-', 'pass', '-', '123'].join('');

const seedAdminSession = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'admin-access-token');
    localStorage.setItem('user_role', 'ADMIN');
  });
};

const seedContributorSession = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'contributor-access-token');
    localStorage.setItem('user_role', 'CONTRIBUTOR');
  });
};

const seedUserSession = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'user-access-token');
    localStorage.setItem('user_role', 'USER');
  });
};

test('has title and landing page content', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText('Chinh phục');
});

test('can navigate to login page', async ({ page }) => {
  await page.goto('/');

  const loginButton = page.locator('a[href="/login"]').first();
  await loginButton.click();

  await expect(page).toHaveURL(/.*\/login/);
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
});

test('register redirects to verify-email and can submit OTP verification', async ({ page }) => {
  await page.route('**/api/v1/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 88,
        email: 'new.user@example.com',
        fullName: 'New User',
        role: 'USER',
      }),
    });
  });

  await page.route('**/api/v1/auth/register/verify-email', async (route) => {
    const payload = (await route.request().postDataJSON()) as { email: string; otp: string };
    await route.fulfill({
      status: payload.otp === '123456' ? 200 : 400,
      contentType: 'application/json',
      body: JSON.stringify({
        message: payload.otp === '123456' ? 'Email verified successfully' : 'OTP is invalid or expired',
      }),
    });
  });

  await page.goto('/register');
  await page.fill('input#register-fullname', 'New User');
  await page.fill('input#register-email', 'new.user@example.com');
  await page.fill('input#register-password', 'strong-password-123');
  await page.fill('input#register-confirm-password', 'strong-password-123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*\/register\/verify-email\?email=new.user%40example.com/);

  await page.fill('input#register-verify-otp', '123456');
  await page.click('button:has-text("Xác thực email")');

  await expect(page).toHaveURL(/.*\/login/);
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
  await expect(page.locator('h1')).toContainText('Quản lý Thành viên');
});

test('shows validation errors on empty login submit', async ({ page }) => {
  await page.goto('/login');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Vui lòng nhập đầy đủ email và mật khẩu.')).toBeVisible();
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

  await expect(page.locator('text=Too many failed login attempts. Please try again later.')).toBeVisible();
});

test('shows backend message when start attempt is rejected', async ({ page }) => {
  await seedAdminSession(page);
  await page.evaluate(() => {
    localStorage.setItem('user_role', 'USER');
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: 'user@example.com',
        fullName: 'Exam User',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/exam/attempts', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Cannot update questions because attempts already exist. You can still update exam metadata (title, duration, passing score, max attempts, tags, status). Create a new exam version to change questions.',
      }),
    });
  });

  await page.route('**/api/v1/exam/exams/public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/dashboard/exams/3/attempt');

  await expect(page).toHaveURL(/.*\/dashboard\/exams/);
  await expect(page.locator('text=Cannot update questions because attempts already exist. You can still update exam metadata (title, duration, passing score, max attempts, tags, status). Create a new exam version to change questions.')).toBeVisible();
});

test('attempt page is rendered in focus mode without dashboard navbar', async ({ page }) => {
  await seedUserSession(page);

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 22,
        email: 'focus.user@example.com',
        fullName: 'Focus User',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/exam/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        attemptId: 900,
        examId: 3,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        durationMinutes: 30,
        maxAttempts: 3,
      }),
    });
  });

  await page.route('**/api/v1/exam/exams/public/3/attempt-view', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        title: 'Đề tập trung',
        description: 'Không có navbar',
        durationMinutes: 30,
        passingScore: 5,
        maxAttempts: 3,
        totalQuestions: 1,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        tags: [],
        questions: [
          {
            id: 301,
            content: '2 + 2 = ?',
            explanation: '',
            scoreWeight: 1,
            options: [
              { id: 1, content: '3' },
              { id: 2, content: '4' },
            ],
          },
        ],
      }),
    });
  });

  await page.goto('/dashboard/exams/3/attempt');

  await expect(page.locator('h1')).toContainText('Đề tập trung');
  await expect(page.locator('#sidebar-logout-button')).toHaveCount(0);
  await expect(page.locator('text=Thời gian còn lại:')).toBeVisible();
});

test('public exam page shows metadata only before start', async ({ page }) => {
  await seedUserSession(page);

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 31,
        email: 'public.user@example.com',
        fullName: 'Public User',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/exam/exams/public', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 3,
          title: 'Đề thi mẫu Toán cơ bản',
          description: 'Mẫu import JSON cho hệ thống exam bank',
          durationMinutes: 45,
          passingScore: 5,
          maxAttempts: 3,
          tags: [
            { id: 1, name: 'toán' },
            { id: 2, name: 'trắc nghiệm' },
          ],
          totalQuestions: 2,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.route('**/api/v1/exam/exams/public/3', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        title: 'Đề thi mẫu Toán cơ bản',
        description: 'Mẫu import JSON cho hệ thống exam bank',
        durationMinutes: 45,
        passingScore: 5,
        maxAttempts: 3,
        tags: [
          { id: 1, name: 'toán' },
          { id: 2, name: 'trắc nghiệm' },
        ],
        totalQuestions: 2,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/v1/exam/users/me/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          attemptId: 1001,
          examId: 3,
          examTitle: 'Đề thi mẫu Toán cơ bản',
          status: 'SUBMITTED',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          scoreRaw: 1,
          scoreMax: 2,
          scorePercent: 50,
          passed: false,
        },
      ]),
    });
  });

  await page.goto('/dashboard/exams');

  await page.getByRole('link', { name: 'Xem đề' }).click();

  await expect(page).toHaveURL(/.*\/dashboard\/exams\/3/);
  await expect(page.locator('h1')).toContainText('Đề thi mẫu Toán cơ bản');
  await expect(page.locator('text=Số lần đã nộp đề này')).toBeVisible();
  await expect(page.locator('text=Nội dung câu hỏi sẽ chỉ hiển thị sau khi bấm Bắt đầu làm bài.')).toBeVisible();
  await expect(page.locator('text=Câu 1: 2 + 2 = ?')).toHaveCount(0);
});

test('attempt answer sync uses batch endpoint with latest selection', async ({ page }) => {
  await seedUserSession(page);

  const batchPayloads: Array<{ answers: Array<{ questionId: number; selectedOptionIds: number[] }> }> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 23,
        email: 'sync.user@example.com',
        fullName: 'Sync User',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/exam/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        attemptId: 901,
        examId: 3,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        durationMinutes: 30,
        maxAttempts: 3,
      }),
    });
  });

  await page.route('**/api/v1/exam/exams/public/3/attempt-view', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        title: 'Đề kiểm tra đồng bộ',
        description: 'Kiểm tra batch save',
        durationMinutes: 30,
        passingScore: 5,
        maxAttempts: 3,
        totalQuestions: 1,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        tags: [],
        questions: [
          {
            id: 401,
            content: '1 + 1 = ?',
            explanation: '',
            scoreWeight: 1,
            options: [
              { id: 1, content: '1' },
              { id: 2, content: '2' },
            ],
          },
        ],
      }),
    });
  });

  await page.route(/\/api\/v1\/exam\/attempts\/\d+\/answers\/batch$/, async (route) => {
    const payload = (await route.request().postDataJSON()) as {
      answers: Array<{ questionId: number; selectedOptionIds: number[] }>;
    };
    batchPayloads.push(payload);
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/dashboard/exams/3/attempt');

  await page.getByRole('button', { name: '1. 1' }).click();
  await page.getByRole('button', { name: '2. 2' }).click();

  await expect.poll(() => batchPayloads.length, { timeout: 4000 }).toBe(1);
  expect(batchPayloads[0].answers).toHaveLength(1);
  expect(batchPayloads[0].answers[0]).toMatchObject({
    questionId: 401,
    selectedOptionIds: [2],
  });
});

test('dashboard shows persisted attempt history', async ({ page }) => {
  await seedUserSession(page);

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 7,
        email: 'history.user@example.com',
        fullName: 'History User',
        role: 'USER',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/exam/users/me/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          attemptId: 555,
          examId: 3,
          examTitle: 'Đề thi mẫu Toán cơ bản',
          status: 'SUBMITTED',
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          scoreRaw: 2,
          scoreMax: 2,
          scorePercent: 100,
          passed: true,
        },
      ]),
    });
  });

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Đề thi mẫu Toán cơ bản' })).toBeVisible();
  await expect(page.locator('text=Điểm: 2/2')).toBeVisible();
});

test('redirects to dashboard after successful login and back to login after logout', async ({ page }) => {
  let meCallCount = 0;

  await page.route('**/api/v1/exam/users/me/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

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
  let currentFullName = 'John Doe';

  await page.route('**/api/v1/exam/users/me/attempts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

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
      if (payload.fullName) {
        currentFullName = payload.fullName;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'john@example.com',
          fullName: currentFullName,
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
        fullName: currentFullName,
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

  await page.click('#profile-settings-trigger');
  await expect(page.locator('input#display-name-input')).toHaveValue('John Wick');

  await page.fill('input#current-password-input', TEST_CURRENT_PASSWORD);
  await page.fill('input#new-password-input', TEST_NEW_PASSWORD);
  await page.fill('input#confirm-password-input', TEST_NEW_PASSWORD);
  await page.click('button:has-text("Cập nhật mật khẩu")');

  await expect.poll(() => updatePayloads.length).toBe(2);
  await expect(page).toHaveURL(/.*\/login/);
  expect(updatePayloads[0]).toEqual({
    fullName: 'John Wick',
    phoneNumber: null,
    school: null,
    subject: null,
  });
  expect(updatePayloads[1]).toEqual({
    currentPassword: TEST_CURRENT_PASSWORD,
    newPassword: TEST_NEW_PASSWORD,
  });
});

test('admin can view users list and create user', async ({ page }) => {
  const createdPayloads: Array<Record<string, string>> = [];
  let listCallCount = 0;

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
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

  await seedAdminSession(page);
  await page.goto('/admin/users');
  await expect(page.locator('h1')).toContainText('Quản lý Thành viên');
  await expect(page.locator('text=teacher.one@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Bộ lọc' }).click();
  await page.getByPlaceholder('Tìm kiếm thông minh: Tên, Email, Số điện thoại hoặc Trường học...').fill('teacher.one');
  await page.getByRole('button', { name: 'Giáo viên' }).first().click();
  await page.getByRole('button', { name: 'Truy vấn' }).click();

  await page.fill('input[name="fullName"]', 'Teacher Two');
  await page.fill('input[name="email"]', 'teacher.two@example.com');
  await page.fill('input[name="password"]', TEST_ADMIN_CREATE_PASSWORD);
  await page.fill('#admin-create-confirm-password', TEST_ADMIN_CREATE_PASSWORD);
  await page.selectOption('select[name="role"]', 'CONTRIBUTOR');
  await page.getByRole('button', { name: 'Xác nhận tạo mới' }).click();

  await expect.poll(() => listCallCount).toBeGreaterThan(1);
  await expect.poll(() => createdPayloads.length).toBe(1);
  expect(createdPayloads[0]).toEqual({
    fullName: 'Teacher Two',
    email: 'teacher.two@example.com',
    password: TEST_ADMIN_CREATE_PASSWORD,
    role: 'CONTRIBUTOR',
  });
});

test('admin can change role and lock/unlock user', async ({ page }) => {
  const rolePayloads: Array<Record<string, string>> = [];
  const statusPayloads: Array<Record<string, string | number | boolean>> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
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

  await seedAdminSession(page);
  await page.goto('/admin/users');
  await expect(page.locator('text=teacher.one@example.com')).toBeVisible();

  await page.selectOption('select[aria-label="role-1"]', 'ADMIN');
  await expect.poll(() => rolePayloads.length).toBe(1);
  expect(rolePayloads[0]).toEqual({ role: 'ADMIN' });
  await expect(page.locator('select[aria-label="role-1"]')).toHaveValue('ADMIN');

  const statusReasonInput = page.locator('tbody tr').first().locator('input[placeholder*="Lý do"]');
  const statusActionButton = page.locator('tbody tr').first().getByRole('button', { name: /Khóa tài khoản|Mở khóa ngay/ });

  await statusReasonInput.fill('Vi phạm quy chế thi');
  await statusActionButton.click();
  await expect.poll(() => statusPayloads.length).toBe(1);
  expect(statusPayloads[0]).toEqual({ status: 0, reason: 'Vi phạm quy chế thi' });
  await expect(page.locator('tbody tr').first().getByRole('button', { name: 'Mở khóa ngay' })).toBeVisible();

  await statusReasonInput.fill('Đã xử lý xong khiếu nại');
  await page.locator('tbody tr').first().getByRole('button', { name: 'Mở khóa ngay' }).click();
  await expect.poll(() => statusPayloads.length).toBe(2);
  expect(statusPayloads[1]).toEqual({ status: 1, reason: 'Đã xử lý xong khiếu nại' });
  await expect(page.locator('tbody tr').first().getByRole('button', { name: 'Khóa tài khoản' })).toBeVisible();
});

test('admin can import users by json payload', async ({ page }) => {
  const importPayloads: Array<Record<string, unknown>> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
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

  await seedAdminSession(page);
  await page.goto('/admin/users');
  const importTextarea = page.locator('textarea').first();
  await importTextarea.fill(JSON.stringify([
    {
      email: 'new.teacher@example.com',
      fullName: 'New Teacher',
      password: TEST_ADMIN_CREATE_PASSWORD,
      role: 'CONTRIBUTOR',
    },
    {
      email: 'exists@example.com',
      fullName: 'Exists Teacher',
      password: TEST_ADMIN_CREATE_PASSWORD,
      role: 'USER',
    },
  ]));
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Xác nhận Import JSON' }).click();

  await expect.poll(() => importPayloads.length).toBe(1);
  await expect(page.locator('text=Tổng: 2')).toBeVisible();
  await expect(page.locator('text=Thành công')).toBeVisible();
  await expect(page.getByText('Bỏ qua', { exact: true })).toBeVisible();
  await expect(page.locator('text=Thất bại')).toBeVisible();
});

test('admin can generate sample json for import', async ({ page }) => {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
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

  await seedAdminSession(page);
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Tạo JSON mẫu' }).click();

  const importText = await page.inputValue('textarea');
  expect(importText).toContain('teacher.one@example.com');
  expect(importText).toContain('CONTRIBUTOR');
});

test('admin can create premium plan', async ({ page }) => {
  const createPayloads: Array<Record<string, unknown>> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans/manage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          name: 'Starter',
          price: 49000,
          durationDays: 30,
          lifetime: false,
          description: 'Starter plan',
          active: true,
        },
      ]),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
    createPayloads.push(payload);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 2,
        name: payload.name,
        price: payload.price,
        durationDays: payload.durationDays,
        lifetime: payload.lifetime,
        description: payload.description,
        active: payload.active,
      }),
    });
  });

  await seedAdminSession(page);
  await page.goto('/admin/premium-plans');
  await expect(page.getByRole('heading', { name: 'Quản trị gói Premium' })).toBeVisible();

  await page.fill('#premium-plan-name', 'Enterprise Max');
  await page.fill('#premium-plan-price', '199000');
  await page.fill('#premium-plan-duration', '60');
  await page.fill('#premium-plan-description', 'Enterprise plan for schools');
  await page.check('#premium-plan-active');
  await page.click('#premium-plan-submit');

  await expect.poll(() => createPayloads.length).toBe(1);
  expect(createPayloads[0]).toEqual({
    name: 'Enterprise Max',
    price: 199000,
    durationDays: 60,
    lifetime: false,
    description: 'Enterprise plan for schools',
    active: true,
  });
});

test('admin can create lifetime premium plan without durationDays', async ({ page }) => {
  const createPayloads: Array<Record<string, unknown>> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans/manage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
    createPayloads.push(payload);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 4,
        name: payload.name,
        price: payload.price,
        durationDays: payload.durationDays,
        lifetime: payload.lifetime,
        description: payload.description,
        active: payload.active,
      }),
    });
  });

  await seedAdminSession(page);
  await page.goto('/admin/premium-plans');

  await page.fill('#premium-plan-name', 'Lifetime Ultimate');
  await page.fill('#premium-plan-price', '499000');
  await page.check('#premium-plan-lifetime');
  await expect(page.locator('#premium-plan-duration')).toBeDisabled();
  await expect(page.locator('#premium-plan-duration')).toHaveValue('');
  await page.click('#premium-plan-submit');

  await expect.poll(() => createPayloads.length).toBe(1);
  expect(createPayloads[0]).toEqual({
    name: 'Lifetime Ultimate',
    price: 499000,
    lifetime: true,
    active: true,
  });
});

test('contributor can create premium plan', async ({ page }) => {
  const createPayloads: Array<Record<string, unknown>> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 78,
        email: 'contributor@example.com',
        fullName: 'Contributor User',
        role: 'CONTRIBUTOR',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans/manage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/plans', async (route) => {
    const payload = (await route.request().postDataJSON()) as Record<string, unknown>;
    createPayloads.push(payload);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        name: payload.name,
        price: payload.price,
        durationDays: payload.durationDays,
        lifetime: payload.lifetime,
        description: payload.description,
        active: payload.active,
      }),
    });
  });

  await seedContributorSession(page);
  await page.goto('/contributor/premium-plans');
  await expect(page.getByRole('heading', { name: 'Quản trị gói Premium' })).toBeVisible();

  await page.fill('#premium-plan-name', 'Contributor Special');
  await page.fill('#premium-plan-price', '79000');
  await page.fill('#premium-plan-duration', '45');
  await page.uncheck('#premium-plan-active');
  await page.click('#premium-plan-submit');

  await expect.poll(() => createPayloads.length).toBe(1);
  expect(createPayloads[0]).toEqual({
    name: 'Contributor Special',
    price: 79000,
    durationDays: 45,
    lifetime: false,
    active: false,
  });
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

  await page.fill('input#new-password-input', TEST_NEW_PASSWORD);
  await page.fill('input#confirm-password-input', TEST_NEW_PASSWORD);
  await page.click('button#reset-password-submit');

  await expect(page).toHaveURL(/.*\/login/);
});

test('admin bell count updates and reviewed request disappears from pending queue', async ({ page }) => {
  const pendingSubscription = {
    id: 999,
    userId: 31,
    userEmail: 'user.one@example.com',
    userFullName: 'User One',
    planId: 5,
    planName: 'Premium Plus',
    purchasedPrice: 99000,
    status: 'PENDING_REVIEW',
    billImageUrl: 'https://example.com/bill-999.png',
    paymentMethod: 'bank_transfer',
    transactionRef: 'FT260319999',
    promoCode: null,
    trial: false,
    startDate: '2026-03-19T09:00:00Z',
    endDate: '2026-04-18T09:00:00Z',
    createdAt: '2026-03-19T09:00:00Z',
  };

  let pendingRows = [pendingSubscription];
  let approvedRows: Array<typeof pendingSubscription> = [];

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/review-queue**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const status = requestUrl.searchParams.get('status') || 'PENDING_REVIEW';
    const rows = status === 'APPROVED' ? approvedRows : pendingRows;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: rows,
        number: 0,
        size: Number(requestUrl.searchParams.get('size') || 10),
        totalElements: rows.length,
        totalPages: rows.length > 0 ? 1 : 0,
        first: true,
        last: true,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/purchase-requests/*/approvals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/purchase-requests/*/review', async (route) => {
    pendingRows = [];
    approvedRows = [{ ...pendingSubscription, status: 'APPROVED' }];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(approvedRows[0]),
    });
  });

  await seedAdminSession(page);
  await page.goto('/admin/subscription-reviews');

  await expect(page.locator('#admin-review-bell-badge')).toHaveText('1');
  await page.locator('#admin-review-bell').click();
  await expect(page.getByText('Thông báo', { exact: true })).toBeVisible();
  await expect(page.locator('text=Request #999 đang chờ duyệt')).toBeVisible();
  await expect(page.locator('text=Nhấn vào từng thông báo để mở chi tiết.')).toBeVisible();
  await expect(page.locator('text=#999 - User One')).toBeVisible();

  await page.getByRole('button', { name: 'Approve' }).click();

  await expect(page.locator('text=Không có request cho trạng thái đã chọn.')).toBeVisible();
  await expect(page.locator('#admin-review-bell-badge')).toHaveCount(0);

  await page.selectOption('select', 'APPROVED');
  await expect(page.locator('text=#999 - User One')).toBeVisible();
});
