import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import NotificationSettings from '../pages/NotificationSettings';

const {
  fetchNotificationPreferences,
  fetchUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  updateNotificationPreferences,
  subscribe,
  unsubscribe,
  isSupported,
  getBrowserPushState,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  fetchNotificationPreferences: vi.fn(),
  fetchUserNotifications: vi.fn(),
  markAllUserNotificationsRead: vi.fn(),
  markUserNotificationRead: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  isSupported: vi.fn(),
  getBrowserPushState: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  fetchNotificationPreferences,
  fetchUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  updateNotificationPreferences,
}));

vi.mock('../hooks/usePushNotification', () => ({
  usePushNotification: () => ({
    subscribe,
    unsubscribe,
    isSupported,
    getBrowserPushState,
  }),
}));

vi.mock('../components/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: toastSuccess,
    error: toastError,
  },
}));

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
};

const buildPage = (
  content: NotificationItem[],
  unreadCount: number,
  overrides: Partial<{
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  }> = {},
) => ({
  content,
  number: overrides.number ?? 0,
  size: overrides.size ?? 20,
  totalElements: overrides.totalElements ?? content.length,
  totalPages: overrides.totalPages ?? 1,
  first: overrides.first ?? true,
  last: overrides.last ?? true,
  unreadCount,
});

const renderPage = () => {
  return render(
    <MemoryRouter>
      <NotificationSettings />
    </MemoryRouter>,
  );
};

describe('NotificationSettings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupported.mockReturnValue(true);
    subscribe.mockResolvedValue(true);
    unsubscribe.mockResolvedValue(true);
    getBrowserPushState.mockResolvedValue({
      supported: true,
      permission: 'granted',
      subscribed: true,
    });
    fetchNotificationPreferences.mockResolvedValue({
      emailEnabled: true,
      webPushEnabled: true,
    });
    fetchUserNotifications.mockResolvedValue(buildPage([], 0));
    markAllUserNotificationsRead.mockResolvedValue(0);
    updateNotificationPreferences.mockResolvedValue({
      emailEnabled: true,
      webPushEnabled: true,
    });
  });

  it('loads notifications and marks one item as read', async () => {
    const unreadItem: NotificationItem = {
      id: 101,
      type: 'SUBSCRIPTION_REVIEWED',
      title: 'Yêu cầu Premium đã được duyệt',
      message: 'Gói Premium 30 đã được duyệt',
      actionUrl: '/dashboard/subscription-payments',
      read: false,
      createdAt: '2026-04-11T10:00:00Z',
      readAt: null,
    };

    fetchUserNotifications.mockResolvedValue(buildPage([unreadItem], 1));
    markUserNotificationRead.mockResolvedValue({
      ...unreadItem,
      read: true,
      readAt: '2026-04-11T10:01:00Z',
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalledTimes(1);
      expect(fetchUserNotifications).toHaveBeenCalledWith(0, 20);
    });

    expect(screen.getByText('Yêu cầu Premium đã được duyệt')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }));

    await waitFor(() => {
      expect(markUserNotificationRead).toHaveBeenCalledWith(101);
    });

    await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument();
    expect(screen.getByText('0 chưa đọc')).toBeInTheDocument();
    });
  });

  it('toggles email preference and calls update API', async () => {
    updateNotificationPreferences.mockResolvedValue({
      emailEnabled: false,
      webPushEnabled: true,
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalledTimes(1);
    });

    const toggleButtons = screen.getAllByRole('button', { name: 'Đang bật - Bấm để tắt' });
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(updateNotificationPreferences).toHaveBeenCalledWith({ emailEnabled: false });
    });

    expect(subscribe).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Đã tắt nhận thông báo email.');
  });

  it('marks all notifications as read and refreshes list', async () => {
    const unreadItems: NotificationItem[] = [
      {
        id: 201,
        type: 'SUBSCRIPTION_REVIEWED',
        title: 'Yêu cầu Premium đã được duyệt',
        message: 'Bạn vừa được duyệt Premium',
        actionUrl: '/dashboard/subscription-payments',
        read: false,
        createdAt: '2026-04-11T10:00:00Z',
        readAt: null,
      },
      {
        id: 202,
        type: 'SUBSCRIPTION_EXPIRY_REMINDER',
        title: 'Gói Premium sắp hết hạn',
        message: 'Gói Premium 30 sẽ hết hạn vào 2026-04-14T00:00:00Z',
        actionUrl: '/dashboard/subscription-payments',
        read: false,
        createdAt: '2026-04-11T09:00:00Z',
        readAt: null,
      },
    ];

    const readItems: NotificationItem[] = unreadItems.map((item) => ({
      ...item,
      read: true,
      readAt: '2026-04-11T10:05:00Z',
    }));

    fetchUserNotifications
      .mockResolvedValueOnce(buildPage(unreadItems, 2))
      .mockResolvedValueOnce(buildPage(readItems, 0));
    markAllUserNotificationsRead.mockResolvedValue(2);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('2 chưa đọc')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }));

    await waitFor(() => {
      expect(markAllUserNotificationsRead).toHaveBeenCalledTimes(1);
      expect(fetchUserNotifications).toHaveBeenCalledTimes(2);
    });

    expect(toastSuccess).toHaveBeenCalledWith('Đã đánh dấu 2 thông báo là đã đọc.');
    expect(screen.getByText('0 chưa đọc')).toBeInTheDocument();
  });

  it('marks an unread notification when opening related page', async () => {
    const unreadItem: NotificationItem = {
      id: 301,
      type: 'SUBSCRIPTION_REVIEWED',
      title: 'Yêu cầu Premium đã được duyệt',
      message: 'Gói Premium 30 đã được duyệt',
      actionUrl: '/dashboard/subscription-payments',
      read: false,
      createdAt: '2026-04-11T10:00:00Z',
      readAt: null,
    };

    fetchUserNotifications.mockResolvedValue(buildPage([unreadItem], 1));
    markUserNotificationRead.mockResolvedValue({
      ...unreadItem,
      read: true,
      readAt: '2026-04-11T10:01:00Z',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Yêu cầu Premium đã được duyệt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mở trang liên quan' }));

    await waitFor(() => {
      expect(markUserNotificationRead).toHaveBeenCalledWith(301);
    });

    expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument();
    expect(screen.getByText('0 chưa đọc')).toBeInTheDocument();
  });

  it('shows web push as off when browser has no subscription even if preference is enabled', async () => {
    fetchNotificationPreferences.mockResolvedValue({
      emailEnabled: true,
      webPushEnabled: true,
    });
    getBrowserPushState.mockResolvedValue({
      supported: true,
      permission: 'granted',
      subscribed: false,
    });
    updateNotificationPreferences.mockResolvedValue({
      emailEnabled: true,
      webPushEnabled: true,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Tài khoản đang bật Web Push, nhưng trình duyệt chưa đăng ký push subscription.')).toBeInTheDocument();
    });

    const turnOnButtons = screen.getAllByRole('button', { name: 'Đang tắt - Bấm để bật' });
    fireEvent.click(turnOnButtons[0]);

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(updateNotificationPreferences).toHaveBeenCalledWith({ webPushEnabled: true });
    });
  });
});
