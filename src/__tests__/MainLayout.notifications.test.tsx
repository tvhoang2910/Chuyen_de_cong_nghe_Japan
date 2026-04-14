import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

const {
  axiosPost,
  fetchUserNotifications,
  markUserNotificationRead,
  fetchSubscriptionReviewQueue,
  clearAuthSession,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  fetchGamificationOverview,
} = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  fetchUserNotifications: vi.fn(),
  markUserNotificationRead: vi.fn(),
  fetchSubscriptionReviewQueue: vi.fn(),
  clearAuthSession: vi.fn(),
  fetchCurrentUserProfile: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
  uploadCurrentUserAvatar: vi.fn(),
  fetchGamificationOverview: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  default: {
    post: axiosPost,
  },
  fetchUserNotifications,
  markUserNotificationRead,
  fetchSubscriptionReviewQueue,
  SUBSCRIPTION_REVIEW_UPDATED_EVENT: 'subscription-review-updated',
  clearAuthSession,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
}));

vi.mock('../api/studyClient', () => ({
  fetchGamificationOverview,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MainLayout notification bell regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    fetchCurrentUserProfile.mockResolvedValue({
      id: 88,
      email: 'user@example.com',
      fullName: 'User Example',
      avatarUrl: null,
      phoneNumber: null,
      school: null,
      subject: null,
      role: 'USER',
      premium: true,
    });

    fetchGamificationOverview.mockResolvedValue({
      streakDays: 1,
      longestStreak: 3,
      dailyStudyMinutes: 20,
      dailyTargetMinutes: 15,
      todayQualified: true,
      justQualifiedToday: false,
      points: 120,
      newlyUnlockedAchievements: [],
      recentUnlockedAchievements: [],
    });

    fetchUserNotifications.mockResolvedValue({
      content: [
        {
          id: 2,
          type: 'SUBSCRIPTION_REVIEWED',
          title: 'Yeu cau Premium da duoc duyet',
          message: 'Goi Ultimate da duoc duyet',
          actionUrl: '/dashboard/subscription-payments',
          read: false,
          createdAt: '2026-04-14T10:40:08.421635Z',
          readAt: null,
        },
      ],
      number: 0,
      size: 5,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      unreadCount: 1,
    });

    markUserNotificationRead.mockResolvedValue({});
    fetchSubscriptionReviewQueue.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 5,
      first: true,
      last: true,
    });
    updateCurrentUserProfile.mockResolvedValue({});
    uploadCurrentUserAvatar.mockResolvedValue({});

    localStorage.setItem(
      'main-dismissed-notification-ids:USER:user@example.com',
      JSON.stringify([{ id: 'user-notification-2', dismissedAt: Date.now() }]),
    );
  });

  it('shows new server notification in bell even when old dismissed id exists', async () => {
    const { container } = render(
      <MemoryRouter>
        <MainLayout>
          <div>dashboard content</div>
        </MainLayout>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchCurrentUserProfile).toHaveBeenCalledTimes(1);
      expect(fetchUserNotifications).toHaveBeenCalledWith(0, 5);
    });

    await waitFor(() => {
      const badge = container.querySelector('#main-review-bell-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1');
    });

    const bell = container.querySelector('#main-review-bell') as HTMLButtonElement;
    fireEvent.click(bell);

    await waitFor(() => {
      expect(screen.getByText('Yeu cau Premium da duoc duyet')).toBeInTheDocument();
    });
  });
});
