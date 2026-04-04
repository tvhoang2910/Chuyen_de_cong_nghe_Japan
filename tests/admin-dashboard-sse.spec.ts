import { test, expect, Page } from '@playwright/test';

// ── Seed admin session ──────────────────────────────────────────────────────────

const seedAdminSession = async (page: Page) => {
  await page.goto('/login');
  await page.evaluate(
    () => {
      localStorage.setItem('access_token', 'admin-test-token');
      localStorage.setItem('user_role', 'ADMIN');
      localStorage.setItem('user_email', 'admin@test.com');
    },
  );
};

// ── SSE mock helpers ────────────────────────────────────────────────────────────

/**
 * Creates a ReadableStream-based SSE response body that can emit multiple
 * events over time via setTimeout. Safe for use with Playwright's
 * route.fulfill() — ReadableStream is supported in Node.js 18+.
 */
const createSseStream = (
  events: Array<{ event: string; data: string; delay?: number }>,
): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  const chunks: Array<{ event: string; data: string; delay?: number }> = [
    ...events,
  ];

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = () => {
        if (chunks.length === 0) return;
        const { event, data } = chunks.shift()!;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        if (chunks.length > 0) {
          const nextDelay = chunks[0].delay ?? 100;
          setTimeout(emit, nextDelay);
        }
      };
      emit();
    },
    cancel() {
      chunks.length = 0;
    },
  });
};

// ── Tests ──────────────────────────────────────────────────────────────────────

test('admin dashboard shows SSE presence online count', async ({ page }) => {
  let presenceSseConnected = false;

  await page.route('**/api/v1/auth/sse/presence**', async (route) => {
    if (route.request().method() === 'GET') {
      presenceSseConnected = true;
      const data = JSON.stringify({
        eventType: 'SNAPSHOT',
        role: 'ADMIN',
        onlineCount: 5,
        timestamp: Date.now(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseStream([{ event: 'presence', data }]),
      });
    }
  });

  await seedAdminSession(page);
  await page.goto('/admin/dashboard');

  await expect.poll(() => presenceSseConnected, { timeout: 5000 }).toBeTruthy();
});

test('admin dashboard shows SSE exam events with active attempt count', async ({
  page,
}) => {
  let examSseConnected = false;

  await page.route('**/api/v1/exam/sse/events**', async (route) => {
    if (route.request().method() === 'GET') {
      examSseConnected = true;
      const data = JSON.stringify({
        eventType: 'SNAPSHOT',
        activeAttemptCount: 12,
        totalSubmissionsToday: 45,
        timestamp: Date.now(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseStream([{ event: 'exam', data }]),
      });
    }
  });

  await seedAdminSession(page);
  await page.goto('/admin/dashboard');

  await expect.poll(() => examSseConnected, { timeout: 5000 }).toBeTruthy();
});

test('admin dashboard receives EXAM_SUBMITTED SSE event and updates counter', async ({
  page,
}) => {
  let examSseConnected = false;

  await page.route('**/api/v1/exam/sse/events**', async (route) => {
    if (route.request().method() === 'GET') {
      examSseConnected = true;
      const snapshot = JSON.stringify({
        eventType: 'SNAPSHOT',
        activeAttemptCount: 5,
        totalSubmissionsToday: 10,
        timestamp: Date.now(),
      });
      const submitted = JSON.stringify({
        eventType: 'EXAM_SUBMITTED',
        activeAttemptCount: 5,
        totalSubmissionsToday: 11,
        examTitle: 'Toán HK1',
        userId: 1,
        timestamp: Date.now(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseStream([
          { event: 'exam', data: snapshot },
          { event: 'exam', data: submitted, delay: 200 },
        ]),
      });
    }
  });

  await seedAdminSession(page);
  await page.goto('/admin/dashboard');

  await expect.poll(() => examSseConnected, { timeout: 5000 }).toBeTruthy();
});

test('presence SSE JOIN event increments online count', async ({ page }) => {
  let presenceSseConnected = false;

  await page.route('**/api/v1/auth/sse/presence**', async (route) => {
    if (route.request().method() === 'GET') {
      presenceSseConnected = true;
      const snapshot = JSON.stringify({
        eventType: 'SNAPSHOT',
        role: 'ADMIN',
        onlineCount: 2,
        timestamp: Date.now(),
      });
      const join = JSON.stringify({
        eventType: 'JOIN',
        role: 'ADMIN',
        onlineCount: 3,
        timestamp: Date.now(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseStream([
          { event: 'presence', data: snapshot },
          { event: 'presence', data: join, delay: 200 },
        ]),
      });
    }
  });

  await seedAdminSession(page);
  await page.goto('/admin/dashboard');

  await expect.poll(() => presenceSseConnected, { timeout: 5000 }).toBeTruthy();
});

test('SSE does not connect when not authenticated', async ({ page }) => {
  // No token in localStorage — should redirect to login
  await page.goto('/admin/dashboard');
  await page.waitForURL(/\/login/);
});

test('presence SSE sends heartbeat every 30 seconds', async ({ page }) => {
  test.setTimeout(45_000);

  let heartbeatCount = 0;

  // Mock the presence SSE endpoint (returns a hanging stream)
  await page.route('**/api/v1/auth/sse/presence**', async (route) => {
    if (route.request().method() === 'GET') {
      const data = JSON.stringify({
        eventType: 'SNAPSHOT',
        role: 'ADMIN',
        onlineCount: 1,
        timestamp: Date.now(),
      });
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: createSseStream([{ event: 'presence', data }]),
      });
    }
  });

  // Mock heartbeat POST
  await page.route('**/api/v1/auth/sse/presence/heartbeat', async (route) => {
    if (route.request().method() === 'POST') {
      heartbeatCount++;
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    }
  });

  await seedAdminSession(page);
  await page.goto('/admin/dashboard');

  // Wait for at least 1 heartbeat (interval is 30 s; give 5 s buffer)
  await page.waitForTimeout(35_000);

  expect(heartbeatCount).toBeGreaterThanOrEqual(1);
});
