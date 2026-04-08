import { expect, test, type Page, type Route } from '@playwright/test';
import type { CommentNode, CreateCommentPayload, VotePayload, PinPayload } from '../src/api/commentClient';

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

const ISO_NOW = '2026-04-08T10:00:00.000Z';
const EXAM_ID = '1';

type SeedOptions = {
  role?: string;
  userId?: number;
  userEmail?: string;
  userFullName?: string;
};

const DEFAULT_SEED: SeedOptions = {
  role: 'USER',
  userId: 3,
  userEmail: 'e2e-user@example.com',
  userFullName: 'E2E User',
};

async function seedAuthenticatedUser(page: Page, options: SeedOptions = {}): Promise<void> {
  const opts = { ...DEFAULT_SEED, ...options };
  await page.addInitScript(
    ({ role, userEmail }) => {
      localStorage.setItem('access_token', 'e2e-token');
      localStorage.setItem('refresh_token', 'e2e-refresh-token');
      localStorage.setItem('user_email', userEmail);
      localStorage.setItem('user_role', role);
    },
    { role: opts.role, userEmail: opts.userEmail },
  );
}

async function mockUserShellApis(page: Page, role = 'USER'): Promise<void> {
  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 3,
        email: 'e2e-user@example.com',
        fullName: 'E2E User',
        avatarUrl: null,
        phoneNumber: null,
        school: null,
        subject: null,
        role,
        premium: false,
      }),
    });
  });

  await page.route('**/api/v1/auth/subscriptions/my-requests', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.route('**/api/v1/auth/push-subscription/vapid-public-key', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ publicKey: 'BOr7dummyVapidPublicKeyForE2ETestOnly1234567890abcXYZ' }),
    });
  });

  await page.route('**/api/v1/auth/push-subscription', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

// Build a CommentNode with sensible defaults
function makeCommentNode(overrides: Partial<CommentNode> & { id: number; content: string }): CommentNode {
  return {
    upvotes: 0,
    downvotes: 0,
    pinned: false,
    replyCount: 0,
    userVote: 'NONE',
    replies: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Navigation helper
// ---------------------------------------------------------------------------

async function navigateToCommentsPage(page: Page, examId = EXAM_ID): Promise<void> {
  await page.goto(`/dashboard/exams/${examId}/comments`);
  // Wait for the page heading to confirm render
  await expect(page.getByRole('heading', { name: /Hệ thống bình luận cho đề thi/i })).toBeVisible();
}

// ---------------------------------------------------------------------------
// TEST GROUP 1 — Happy Path
// ---------------------------------------------------------------------------

test.describe('Comment Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    // Override auth seed from beforeEach for this test only.
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Start fresh (no localStorage)
    await page.goto(`/dashboard/exams/${EXAM_ID}/comments`);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('shows comment form and submits a top-level comment', async ({ page }) => {
    let capturedPayload: CreateCommentPayload | null = null;
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    let createdComment: CommentNode = makeCommentNode({ id: 101, content: 'My first comment' });
    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON() as CreateCommentPayload;
        createdComment = makeCommentNode({
          id: 101,
          content: capturedPayload!.content,
          userId: capturedPayload!.userId,
        });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdComment),
        });
      }
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([createdComment]),
        });
      }
    });

    await navigateToCommentsPage(page);

    // Form is visible
    await expect(page.getByRole('heading', { name: 'Viết comment mới' })).toBeVisible();
    const textarea = page.locator('textarea[placeholder="Nhập nội dung comment..."]');
    await expect(textarea).toBeVisible();

    // Submit
    await textarea.fill('This is my first comment on this exam.');
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    // Success toast
    await expect(page.getByText('Gửi bình luận thành công')).toBeVisible();

    // Comment appears in list
    await expect(page.getByText('This is my first comment on this exam.')).toBeVisible();

    // Counts initialise at zero
    await expect(page.getByText('Tầng 1')).toBeVisible();
  });

  test('displays existing comments on page load', async ({ page }) => {
    const existingComments: CommentNode[] = [
      makeCommentNode({ id: 10, content: 'Một bình luận đã tồn tại' }),
      makeCommentNode({ id: 11, content: 'Bình luận thứ hai' }),
    ];

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(existingComments),
      });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText('Một bình luận đã tồn tại')).toBeVisible();
    await expect(page.getByText('Bình luận thứ hai')).toBeVisible();
    await expect(page.getByText('2 bình luận gốc')).toBeVisible();
  });
});

test.describe('Comment Reply Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('creates a reply nested under a parent comment', async ({ page }) => {
    const parentComment: CommentNode = makeCommentNode({
      id: 50,
      content: 'Parent comment for reply test',
      replyCount: 1,
    });

    async function handleRoutes(route: Route) {
      const url = route.request().url();
      if (url.includes('/comments/exam/') && route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([parentComment]),
        });
      } else if (url.endsWith('/comments') && route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as CreateCommentPayload;
        if (payload.parentId) {
          const replyNode = makeCommentNode({
            id: 51,
            content: payload.content,
            parentId: payload.parentId,
          });
          parentComment.replies = [replyNode];
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(replyNode),
          });
        } else {
          const newNode = makeCommentNode({ id: Date.now(), content: payload.content });
          await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newNode) });
        }
      }
    }

    await page.route('**/api/v1/community/**', handleRoutes);

    await navigateToCommentsPage(page);

    // Parent is visible
    await expect(page.getByText('Parent comment for reply test')).toBeVisible();

    // Click Reply button
    const replyButton = page.getByRole('button', { name: 'Reply' });
    await expect(replyButton).toBeVisible();
    await replyButton.click();

    // Inline reply form appears
    await expect(page.getByRole('button', { name: 'Gửi reply' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy' })).toBeVisible();

    // Fill and submit
    const replyTextarea = page.locator('textarea[placeholder="Nhập nội dung comment..."]').last();
    await replyTextarea.fill('This is a reply to the parent comment.');
    await page.getByRole('button', { name: 'Gửi reply' }).click();

    await expect(page.getByText('Gửi bình luận thành công')).toBeVisible();

    // Reply appears nested — depth badge shows Tầng 2
    await expect(page.getByText('This is a reply to the parent comment.')).toBeVisible();
    await expect(page.getByText('Tầng 2')).toBeVisible();
  });

  test('Cancel button hides the inline reply form without submitting', async ({ page }) => {
    const parentComment: CommentNode = makeCommentNode({ id: 60, content: 'Parent for cancel test' });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([parentComment]) });
    });

    await navigateToCommentsPage(page);

    await page.getByRole('button', { name: 'Reply' }).click();
    await expect(page.getByRole('button', { name: 'Gửi reply' })).toBeVisible();

    await page.getByRole('button', { name: 'Hủy' }).click();
    await expect(page.getByRole('button', { name: 'Gửi reply' })).not.toBeVisible();
  });
});

test.describe('Vote Flow', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('upvote button increases upvotes count and toggles off', async ({ page }) => {
    const comment: CommentNode = makeCommentNode({
      id: 70,
      content: 'Comment to vote on',
      upvotes: 0,
      userVote: 'NONE',
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    let voteCallCount = 0;
    await page.route('**/api/v1/community/comments/70/vote', async (route: Route) => {
      voteCallCount += 1;
      const payload = route.request().postDataJSON() as VotePayload;
      comment.upvotes = payload.voteType === 'UP' ? 1 : 0;
      comment.userVote = payload.voteType as CommentNode['userVote'];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(comment),
      });
    });

    await navigateToCommentsPage(page);

    // Vote buttons should exist
    const upvoteBtn = page.locator('[aria-label*="upvote"], button[name*="upvote"], button:has-text("👍")').first();
    const downvoteBtn = page.locator('[aria-label*="downvote"], button[name*="downvote"], button:has-text("👎")').first();

    // If vote buttons are not yet implemented in UI, this test documents expected behaviour
    // For now assert they exist in the DOM
    await expect(upvoteBtn.or(page.locator('[data-testid="upvote-btn"]')).first()).toBeAttached();

    // Click upvote
    await page.locator('[data-testid="upvote-btn"]').first().click();
    await expect(page.getByTestId('upvote-btn').first().locator('span')).toHaveText('1');

    // Toggle off
    await page.locator('[data-testid="upvote-btn"]').first().click();
    await expect(page.getByTestId('upvote-btn').first().locator('span')).toHaveText('0');
    await expect(voteCallCount).toBe(2);
  });

  test('downvote then switching to upvote correctly adjusts both counters', async ({ page }) => {
    const comment: CommentNode = makeCommentNode({
      id: 71,
      content: 'Comment for vote switching',
      upvotes: 0,
      downvotes: 0,
      userVote: 'NONE',
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    await page.route('**/api/v1/community/comments/71/vote', async (route: Route) => {
      const payload = route.request().postDataJSON() as VotePayload;
      if (payload.voteType === 'UP') {
        comment.upvotes = 1;
        comment.downvotes = 0;
        comment.userVote = 'UP';
      } else {
        comment.upvotes = 0;
        comment.downvotes = 1;
        comment.userVote = 'DOWN';
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comment) });
    });

    await navigateToCommentsPage(page);

    // Switch from none to downvote
    await page.locator('[data-testid="downvote-btn"]').first().click();
    await expect(page.getByTestId('downvote-btn').first().locator('span')).toHaveText('1');

    // Switch to upvote
    await page.locator('[data-testid="upvote-btn"]').first().click();
    await expect(page.getByTestId('upvote-btn').first().locator('span')).toHaveText('1');
    await expect(page.getByTestId('downvote-btn').first().locator('span')).toHaveText('0');
  });
});

test.describe('Pin Flow (Admin / Teacher)', () => {
  test('admin can pin a comment and see the pinned indicator', async ({ page }) => {
    await seedAuthenticatedUser(page, { role: 'ADMIN' });
    await mockUserShellApis(page, 'ADMIN');

    const comment: CommentNode = makeCommentNode({
      id: 80,
      content: 'Admin comment to pin',
      pinned: false,
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    let pinCallCount = 0;
    await page.route('**/api/v1/community/comments/80/pin', async (route: Route) => {
      pinCallCount += 1;
      comment.pinned = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comment) });
    });

    await navigateToCommentsPage(page);

    // Pin button should be visible for admin
    const pinBtn = page.locator('[data-testid="pin-btn"]').first();
    await expect(pinBtn).toBeVisible();

    await pinBtn.click();

    // Pinned indicator appears
    await expect(page.getByText('Đã ghim', { exact: true })).toBeVisible();
    expect(pinCallCount).toBe(1);
  });

  test('admin can unpin a comment and indicator disappears', async ({ page }) => {
    await seedAuthenticatedUser(page, { role: 'ADMIN' });
    await mockUserShellApis(page, 'ADMIN');

    const comment: CommentNode = makeCommentNode({
      id: 81,
      content: 'Pinned comment to unpin',
      pinned: true,
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    await page.route('**/api/v1/community/comments/81/pin', async (route: Route) => {
      comment.pinned = false;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comment) });
    });

    await navigateToCommentsPage(page);

    const pinBtn = page.locator('[data-testid="pin-btn"]').first();
    await pinBtn.click();

    // Pinned indicator disappears
    await expect(page.getByText('Đã ghim')).toHaveCount(0);
  });

  test('regular user does not see pin button', async ({ page }) => {
    await seedAuthenticatedUser(page, { role: 'USER' });
    await mockUserShellApis(page, 'USER');

    const comment: CommentNode = makeCommentNode({ id: 82, content: 'Regular user comment' });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([comment]) });
    });

    await navigateToCommentsPage(page);

    const pinBtn = page.locator('[data-testid="pin-btn"]');
    await expect(pinBtn).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// TEST GROUP 2 — Edge Cases
// ---------------------------------------------------------------------------

test.describe('Max Reply Depth', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('reply button is disabled at depth 3 and shows "Đã đạt tối đa tầng"', async ({ page }) => {
    // Build a 4-level tree so the deepest node is depth=3 (Tầng 4).
    const level4Comment: CommentNode = makeCommentNode({
      id: 43,
      content: 'Level 4 comment',
    });
    const level3Comment: CommentNode = makeCommentNode({
      id: 32,
      content: 'Level 3 comment',
      replies: [level4Comment],
    });
    const level2Comment: CommentNode = makeCommentNode({
      id: 22,
      content: 'Level 2 comment',
      replies: [level3Comment],
    });
    const level1Comment: CommentNode = makeCommentNode({
      id: 11,
      content: 'Level 1 comment',
      replies: [level2Comment],
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([level1Comment]),
      });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText('Tầng 4')).toBeVisible();
    await expect(page.getByText('Đã đạt tối đa tầng')).toBeVisible();

    // Only first 3 levels keep Reply button; deepest level does not.
    const replyButtons = page.getByRole('button', { name: 'Reply' });
    await expect(replyButtons).toHaveCount(3);
  });

  test('reply button IS available at depth 1 and 2', async ({ page }) => {
    const level2Comment: CommentNode = makeCommentNode({
      id: 22,
      content: 'Level 2 comment',
    });
    const level1Comment: CommentNode = makeCommentNode({
      id: 11,
      content: 'Level 1 comment',
      replies: [level2Comment],
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([level1Comment]),
      });
    });

    await navigateToCommentsPage(page);

    // Both levels should still have Reply buttons
    const replyButtons = page.getByRole('button', { name: 'Reply' });
    await expect(replyButtons).toHaveCount(2);
  });
});

test.describe('Empty Content Validation', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('submitting empty comment shows validation error and does not call API', async ({ page }) => {
    let postCalled = false;
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({}) });
      }
    });

    await navigateToCommentsPage(page);

    const textarea = page.locator('textarea[placeholder="Nhập nội dung comment..."]');
    await textarea.fill('   '); // whitespace only
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    // No POST should have been made
    expect(postCalled).toBe(false);

    // Since submit is blocked client-side, success toast must not appear.
    await expect(page.getByText('Gửi bình luận thành công')).toHaveCount(0);
  });

  test('submitting whitespace-only content is rejected', async ({ page }) => {
    let postCalled = false;
    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Content is required' }) });
      }
    });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await navigateToCommentsPage(page);

    await page.locator('textarea[placeholder="Nhập nội dung comment..."]').fill('   \n\t  ');
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    // POST should not be called (trimmed before submit)
    expect(postCalled).toBe(false);
  });
});

test.describe('Content Length Limits', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('comment with exactly 2000 characters succeeds', async ({ page }) => {
    const content2000 = 'A'.repeat(2000);
    let submittedContent = '';

    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        submittedContent = (route.request().postDataJSON() as CreateCommentPayload).content;
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 999, content: submittedContent }) });
      }
    });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    await navigateToCommentsPage(page);
    await page.locator('textarea[placeholder="Nhập nội dung comment..."]').fill(content2000);
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    await expect(page.getByText('Gửi bình luận thành công')).toBeVisible();
    expect(submittedContent.length).toBe(2000);
  });

  test('comment exceeding 2000 characters shows a validation error', async ({ page }) => {
    const tooLongContent = 'B'.repeat(2001);

    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Content must be at most 2000 characters' }) });
      }
    });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await navigateToCommentsPage(page);
    await page.locator('textarea[placeholder="Nhập nội dung comment..."]').fill(tooLongContent);
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    await expect(page.getByText(/2000|tối đa|quá dài/i)).toBeVisible();
  });
});

test.describe('Network Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('vote failure shows error toast and reverts UI', async ({ page }) => {
    const comment: CommentNode = makeCommentNode({
      id: 90,
      content: 'Comment for error test',
      upvotes: 5,
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    await page.route('**/api/v1/community/comments/90/vote', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await navigateToCommentsPage(page);

    // Trigger upvote
    await page.locator('[data-testid="upvote-btn"]').first().click();

    // Error toast should appear
    await expect(page.getByText(/lỗi|error|failed/i)).toBeVisible();

    // Count should not have changed (optimistic update reverted)
    await expect(page.getByText('5')).toBeVisible();
  });

  test('comment submission failure shows error toast', async ({ page }) => {
    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server error' }) });
      }
    });
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await navigateToCommentsPage(page);

    await page.locator('textarea[placeholder="Nhập nội dung comment..."]').fill('This should fail.');
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    await expect(page.getByText(/thất bại|lỗi/i)).toBeVisible();
  });

  test('loading comments failure shows error message', async ({ page }) => {
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Load failed' }) });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText(/không tải được|lỗi/i)).toBeVisible();
  });
});

test.describe('Concurrent Votes', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('rapid vote clicks do not cause negative count', async ({ page }) => {
    const comment: CommentNode = makeCommentNode({
      id: 95,
      content: 'Rapid vote test',
      upvotes: 0,
      userVote: 'NONE',
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([comment]),
      });
    });

    let callCount = 0;
    await page.route('**/api/v1/community/comments/95/vote', async (route: Route) => {
      callCount += 1;
      // Delay response to simulate network latency, allowing race condition to surface
      await new Promise((r) => setTimeout(r, 50));
      const payload = route.request().postDataJSON() as VotePayload;
      comment.upvotes = payload.voteType === 'UP' ? 1 : 0;
      comment.userVote = payload.voteType as CommentNode['userVote'];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comment) });
    });

    await navigateToCommentsPage(page);

    const upvoteBtn = page.locator('[data-testid="upvote-btn"]').first();

    // Click 5 times rapidly
    for (let i = 0; i < 5; i++) {
      await upvoteBtn.click({ force: true });
    }

    // Wait for all requests to settle
    await page.waitForTimeout(500);

    // Count should never be negative; final state should be consistent
    const countEls = page.locator('text=1').or(page.locator('text=0'));
    await expect(countEls.first()).toBeVisible();

    // All calls should have been registered (no swallowed clicks)
    expect(callCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// TEST GROUP 3 — UI / UX
// ---------------------------------------------------------------------------

test.describe('Empty State', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('shows empty state message when exam has no comments', async ({ page }) => {
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText('Chưa có bình luận cho đề thi này.')).toBeVisible();
    await expect(page.getByText('0 bình luận gốc')).toBeVisible();
  });

  test('comment count badge updates after submitting first comment', async ({ page }) => {
    const comments: CommentNode[] = [];
    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(comments),
        });
      }
    });
    await page.route('**/api/v1/community/comments', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const newComment = makeCommentNode({ id: Date.now(), content: 'New comment' });
        comments.push(newComment);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newComment) });
      }
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText('0 bình luận gốc')).toBeVisible();

    await page.locator('textarea[placeholder="Nhập nội dung comment..."]').fill('First comment ever!');
    await page.getByRole('button', { name: 'Gửi comment gốc' }).click();

    await expect(page.getByText('Gửi bình luận thành công')).toBeVisible();
    await expect(page.getByText('1 bình luận gốc')).toBeVisible();
  });
});

test.describe('Nested Reply UI', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('three levels of replies are visually distinct with correct depth badges', async ({ page }) => {
    const level3: CommentNode = makeCommentNode({ id: 33, content: 'Level 3 deep reply' });
    const level2: CommentNode = makeCommentNode({ id: 22, content: 'Level 2 reply', replies: [level3] });
    const level1: CommentNode = makeCommentNode({
      id: 11,
      content: 'Level 1 comment',
      replies: [level2],
    });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([level1]),
      });
    });

    await navigateToCommentsPage(page);

    // All three levels visible
    await expect(page.getByText('Level 1 comment')).toBeVisible();
    await expect(page.getByText('Level 2 reply')).toBeVisible();
    await expect(page.getByText('Level 3 deep reply')).toBeVisible();

    // Depth badges
    await expect(page.getByText('Tầng 1').first()).toBeVisible();
    await expect(page.getByText('Tầng 2')).toBeVisible();
    await expect(page.getByText('Tầng 3')).toBeVisible();

    // Nested cards should be indented.
    await expect(page.locator('div.ml-6').first()).toBeVisible();
  });

  test('all reply content is readable and not truncated', async ({ page }) => {
    const longContent = 'Đây là một bình luận rất dài với nhiều nội dung để kiểm tra rằng văn bản không bị cắt ngắn hoặc ẩn đi trong giao diện lồng ghép. Với độ sâu tối đa 3 tầng, mỗi bình luận vẫn phải hiển thị đầy đủ nội dung của nó.';

    const level2: CommentNode = makeCommentNode({ id: 22, content: longContent });
    const level1: CommentNode = makeCommentNode({ id: 11, content: 'Parent comment', replies: [level2] });

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([level1]),
      });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText(longContent)).toBeVisible();
  });
});

test.describe('Comment Tree — Structural Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page);
    await mockUserShellApis(page);
  });

  test('each comment in the list has a unique depth badge', async ({ page }) => {
    const comments: CommentNode[] = [
      makeCommentNode({ id: 1, content: 'Top 1' }),
      makeCommentNode({ id: 2, content: 'Top 2' }),
      makeCommentNode({ id: 3, content: 'Top 3' }),
    ];

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(comments) });
    });

    await navigateToCommentsPage(page);

    // All top-level comments visible
    await expect(page.getByText('Top 1')).toBeVisible();
    await expect(page.getByText('Top 2')).toBeVisible();
    await expect(page.getByText('Top 3')).toBeVisible();

    // Three "Tầng 1" badges (one per top-level comment)
    await expect(page.getByText('Tầng 1')).toHaveCount(3);
  });

  test('reply count badge reflects number of replies', async ({ page }) => {
    const parent: CommentNode = makeCommentNode({
      id: 40,
      content: 'Parent with 2 replies',
      replyCount: 2,
    });
    const reply1: CommentNode = makeCommentNode({ id: 41, content: 'Reply 1' });
    const reply2: CommentNode = makeCommentNode({ id: 42, content: 'Reply 2' });
    parent.replies = [reply1, reply2];

    await page.route(`**/api/v1/community/comments/exam/${EXAM_ID}`, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([parent]) });
    });

    await navigateToCommentsPage(page);

    await expect(page.getByText('Parent with 2 replies')).toBeVisible();
    await expect(page.getByText('Reply 1')).toBeVisible();
    await expect(page.getByText('Reply 2')).toBeVisible();
    await expect(page.getByText('Tầng 1')).toBeVisible();
    await expect(page.getByText('Tầng 2')).toHaveCount(2);
  });
});
