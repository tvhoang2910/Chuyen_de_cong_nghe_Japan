import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      title: 'Yeu cau Premium da duoc duyet',
      message: 'Goi Premium 30 da duoc duyet',
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

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalledTimes(1);
      expect(fetchUserNotifications).toHaveBeenCalledWith(0, 20);
    });

    expect(screen.getByText('Yeu cau Premium da duoc duyet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Danh dau da doc' }));

    await waitFor(() => {
      expect(markUserNotificationRead).toHaveBeenCalledWith(101);
    });

    expect(screen.queryByRole('button', { name: 'Danh dau da doc' })).not.toBeInTheDocument();
    expect(screen.getByText('0 chua doc')).toBeInTheDocument();
  });

  it('toggles email preference and calls update API', async () => {
    updateNotificationPreferences.mockResolvedValue({
      emailEnabled: false,
      webPushEnabled: true,
    });

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalledTimes(1);
    });

    const toggleButtons = screen.getAllByRole('button', { name: 'Dang bat - Bam de tat' });
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(updateNotificationPreferences).toHaveBeenCalledWith({ emailEnabled: false });
    });

    expect(subscribe).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Da tat nhan thong bao email.');
  });

  it('marks all notifications as read and refreshes list', async () => {
    const unreadItems: NotificationItem[] = [
      {
        id: 201,
        type: 'SUBSCRIPTION_REVIEWED',
        title: 'Yeu cau Premium da duoc duyet',
        message: 'Ban vua duoc duyet Premium',
        actionUrl: '/dashboard/subscription-payments',
        read: false,
        createdAt: '2026-04-11T10:00:00Z',
        readAt: null,
      },
      {
        id: 202,
        type: 'SUBSCRIPTION_EXPIRY_REMINDER',
        title: 'Goi Premium sap het han',
        message: 'Goi Premium 30 se het han vao 2026-04-14T00:00:00Z',
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

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('2 chua doc')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Danh dau tat ca da doc' }));

    await waitFor(() => {
      expect(markAllUserNotificationsRead).toHaveBeenCalledTimes(1);
      expect(fetchUserNotifications).toHaveBeenCalledTimes(2);
    });

    expect(toastSuccess).toHaveBeenCalledWith('Da danh dau 2 thong bao la da doc.');
    expect(screen.getByText('0 chua doc')).toBeInTheDocument();
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

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Tai khoan dang bat Web Push, nhung trinh duyet chua dang ky push subscription.')).toBeInTheDocument();
    });

    const turnOnButtons = screen.getAllByRole('button', { name: 'Dang tat - Bam de bat' });
    fireEvent.click(turnOnButtons[0]);

    await waitFor(() => {
      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(updateNotificationPreferences).toHaveBeenCalledWith({ webPushEnabled: true });
    });
  });
});
