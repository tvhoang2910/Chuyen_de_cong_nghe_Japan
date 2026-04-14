import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Mail, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import {
  fetchNotificationPreferences,
  fetchUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
  updateNotificationPreferences,
  type NotificationPreference,
  type UserNotificationItem,
} from '../api/axiosClient';
import { usePushNotification, type BrowserPushState } from '../hooks/usePushNotification';

const PAGE_SIZE = 20;

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString('vi-VN');
};

const DEFAULT_BROWSER_PUSH_STATE: BrowserPushState = {
  supported: false,
  permission: 'unsupported',
  subscribed: false,
};

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingWebPush, setIsSavingWebPush] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [browserPushState, setBrowserPushState] = useState<BrowserPushState>(DEFAULT_BROWSER_PUSH_STATE);

  const { subscribe, unsubscribe, isSupported, getBrowserPushState } = usePushNotification();

  const refreshPreferences = useCallback(async () => {
    const response = await fetchNotificationPreferences();
    setPreferences(response);
  }, []);

  const loadNotifications = useCallback(async (page: number, append: boolean) => {
    const response = await fetchUserNotifications(page, PAGE_SIZE);
    setUnreadCount(response.unreadCount);
    setCurrentPage(response.number);
    setIsLastPage(response.last);
    setNotifications((previous) => {
      if (!append) {
        return response.content;
      }
      const merged = [...previous];
      const existing = new Set(previous.map((item) => item.id));
      for (const item of response.content) {
        if (!existing.has(item.id)) {
          merged.push(item);
        }
      }
      return merged;
    });
  }, []);

  const refreshBrowserPushState = useCallback(async () => {
    const nextState = await getBrowserPushState();
    setBrowserPushState(nextState);
  }, [getBrowserPushState]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshPreferences(), loadNotifications(0, false), refreshBrowserPushState()]);
    } catch {
      toast.error('Không thể tải cài đặt thông báo.');
    } finally {
      setIsLoading(false);
    }
  }, [loadNotifications, refreshBrowserPushState, refreshPreferences]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const handleToggleEmail = async () => {
    if (!preferences) return;
    const nextValue = !preferences.emailEnabled;

    setIsSavingEmail(true);
    try {
      const updated = await updateNotificationPreferences({ emailEnabled: nextValue });
      setPreferences(updated);
      toast.success(nextValue ? 'Đã bật nhận thông báo email.' : 'Đã tắt nhận thông báo email.');
    } catch {
      toast.error('Cập nhật cài đặt email thất bại.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleToggleWebPush = async () => {
    if (!preferences) return;

    const nextValue = !isWebPushEffectivelyEnabled;
    setIsSavingWebPush(true);

    try {
      if (nextValue) {
        if (!isSupported()) {
          toast.error('Trình duyệt không hỗ trợ Web Push.');
          return;
        }

        const subscribed = await subscribe({ requestPermissionIfNeeded: true, forceRefreshExisting: true });
        if (!subscribed) {
          toast.error('Không thể bật Web Push. Hãy cấp quyền thông báo trên trình duyệt.');
          await refreshBrowserPushState();
          return;
        }

        const updated = await updateNotificationPreferences({ webPushEnabled: true });
        setPreferences(updated);
        toast.success('Đã bật nhận thông báo Web Push.');
      } else {
        const unsubscribed = await unsubscribe();
        if (!unsubscribed) {
          toast.error('Không thể tắt đăng ký Web Push trên trình duyệt.');
          return;
        }

        const updated = await updateNotificationPreferences({ webPushEnabled: false });
        setPreferences(updated);
        toast.success('Đã tắt nhận thông báo Web Push.');
      }

      await refreshBrowserPushState();
    } catch {
      toast.error('Cập nhật cài đặt Web Push thất bại.');
    } finally {
      setIsSavingWebPush(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLastPage || isLoading) return;
    try {
      await loadNotifications(currentPage + 1, true);
    } catch {
      toast.error('Không thể tải thêm thông báo.');
    }
  };

  const markNotificationAsRead = useCallback(async (notificationId: number, showErrorToast: boolean) => {
    try {
      const updated = await markUserNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => (item.id === notificationId ? updated : item)));
      setUnreadCount((current) => Math.max(0, current - 1));
      return true;
    } catch {
      if (showErrorToast) {
        toast.error('Đánh dấu đã đọc thất bại.');
      }
      return false;
    }
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationAsRead(notificationId, true);
  };

  const handleOpenRelatedPage = async (item: UserNotificationItem) => {
    if (!item.actionUrl) {
      return;
    }

    if (!item.read) {
      await markNotificationAsRead(item.id, false);
    }

    if (/^https?:\/\//i.test(item.actionUrl)) {
      globalThis.location.assign(item.actionUrl);
      return;
    }

    navigate(item.actionUrl);
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const changed = await markAllUserNotificationsRead();
      if (changed > 0) {
        await loadNotifications(0, false);
      }
      toast.success(changed > 0 ? `Đã đánh dấu ${changed} thông báo là đã đọc.` : 'Tất cả thông báo đã được đọc.');
    } catch {
      toast.error('Không thể đánh dấu đã đọc tất cả thông báo.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const unreadBadgeLabel = useMemo(() => {
    if (unreadCount > 99) return '99+';
    return String(unreadCount);
  }, [unreadCount]);

  const isWebPushEffectivelyEnabled = useMemo(() => {
    return Boolean(
      preferences?.webPushEnabled &&
        browserPushState.supported &&
        browserPushState.permission === 'granted' &&
        browserPushState.subscribed,
    );
  }, [browserPushState.permission, browserPushState.subscribed, browserPushState.supported, preferences?.webPushEnabled]);

  const webPushStatusMessage = useMemo(() => {
    if (!browserPushState.supported) {
      return 'Trình duyệt hiện tại không hỗ trợ Web Push.';
    }

    if (browserPushState.permission === 'denied') {
      return 'Trình duyệt đang chặn quyền Notification. Hãy cho phép thông báo trong cài đặt trình duyệt.';
    }

    if (preferences?.webPushEnabled && !browserPushState.subscribed) {
      return 'Tài khoản đang bật Web Push, nhưng trình duyệt chưa đăng ký push subscription.';
    }

    if (!preferences?.webPushEnabled && browserPushState.subscribed) {
      return 'Trình duyệt đã đăng ký push, nhưng hệ thống đang tắt gửi Web Push cho tài khoản.';
    }

    if (isWebPushEffectivelyEnabled) {
      return 'Web Push đang hoạt động trên trình duyệt này.';
    }

    return 'Web Push đang tắt. Bấm để bật và nhận thông báo realtime.';
  }, [browserPushState.permission, browserPushState.subscribed, browserPushState.supported, isWebPushEffectivelyEnabled, preferences?.webPushEnabled]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-800 p-8 text-white shadow-xl shadow-slate-900/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Cài đặt thông báo</h1>
              <p className="mt-2 text-sm text-cyan-100/90">
                Quản lý tập trung thông báo Email, Web Push và lịch sử thông báo hệ thống.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCcw className="h-4 w-4" /> Làm mới
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Mail className="h-5 w-5 text-cyan-600" />
              <h2 className="text-lg font-bold">Nhận thông báo email</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Bao gồm kết quả duyệt/hủy Premium và nhắc nhở sắp hết hạn gói.
            </p>
            <button
              type="button"
              onClick={handleToggleEmail}
              disabled={!preferences || isSavingEmail || isLoading}
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition ${
                preferences?.emailEnabled
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isSavingEmail
                ? 'Đang cập nhật...'
                : preferences?.emailEnabled
                  ? 'Đang bật - Bấm để tắt'
                  : 'Đang tắt - Bấm để bật'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <BellRing className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Nhận thông báo Web Push</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Các thông báo realtime trên trình duyệt. Bạn cần cấp quyền Notification để sử dụng.
            </p>
            <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {webPushStatusMessage}
            </p>
            <button
              type="button"
              onClick={handleToggleWebPush}
              disabled={!preferences || isSavingWebPush || isLoading}
              className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition ${
                isWebPushEffectivelyEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isSavingWebPush
                ? 'Đang cập nhật...'
                : isWebPushEffectivelyEnabled
                  ? 'Đang bật - Bấm để tắt'
                  : 'Đang tắt - Bấm để bật'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Bell className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold">Trung tâm thông báo</h2>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {unreadBadgeLabel} chưa đọc
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMarkingAllRead ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Đang tải thông báo...</p>
          ) : notifications.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${item.read ? 'border-slate-200 bg-white' : 'border-cyan-200 bg-cyan-50/60'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAsRead(item.id)}
                        className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  {item.actionUrl && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => void handleOpenRelatedPage(item)}
                        className="text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline"
                      >
                        Mở trang liên quan
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!isLastPage && (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  className="w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Tải thêm thông báo
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default NotificationSettings;
