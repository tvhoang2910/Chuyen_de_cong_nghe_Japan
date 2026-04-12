import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
      toast.error('Khong the tai cai dat thong bao.');
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
      toast.success(nextValue ? 'Da bat nhan thong bao email.' : 'Da tat nhan thong bao email.');
    } catch {
      toast.error('Cap nhat cai dat email that bai.');
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
          toast.error('Trinh duyet khong ho tro Web Push.');
          return;
        }

        const subscribed = await subscribe();
        if (!subscribed) {
          toast.error('Khong the bat Web Push. Hay cap quyen thong bao tren trinh duyet.');
          await refreshBrowserPushState();
          return;
        }

        const updated = await updateNotificationPreferences({ webPushEnabled: true });
        setPreferences(updated);
        toast.success('Da bat nhan thong bao Web Push.');
      } else {
        const unsubscribed = await unsubscribe();
        if (!unsubscribed) {
          toast.error('Khong the tat dang ky Web Push tren trinh duyet.');
          return;
        }

        const updated = await updateNotificationPreferences({ webPushEnabled: false });
        setPreferences(updated);
        toast.success('Da tat nhan thong bao Web Push.');
      }

      await refreshBrowserPushState();
    } catch {
      toast.error('Cap nhat cai dat Web Push that bai.');
    } finally {
      setIsSavingWebPush(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLastPage || isLoading) return;
    try {
      await loadNotifications(currentPage + 1, true);
    } catch {
      toast.error('Khong the tai them thong bao.');
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const updated = await markUserNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => (item.id === notificationId ? updated : item)));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {
      toast.error('Danh dau da doc that bai.');
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const changed = await markAllUserNotificationsRead();
      if (changed > 0) {
        await loadNotifications(0, false);
      }
      toast.success(changed > 0 ? `Da danh dau ${changed} thong bao la da doc.` : 'Tat ca thong bao da duoc doc.');
    } catch {
      toast.error('Khong the danh dau da doc tat ca thong bao.');
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
      return 'Trinh duyet hien tai khong ho tro Web Push.';
    }

    if (browserPushState.permission === 'denied') {
      return 'Trinh duyet dang chan quyen Notification. Hay cho phep thong bao trong cai dat trinh duyet.';
    }

    if (preferences?.webPushEnabled && !browserPushState.subscribed) {
      return 'Tai khoan dang bat Web Push, nhung trinh duyet chua dang ky push subscription.';
    }

    if (!preferences?.webPushEnabled && browserPushState.subscribed) {
      return 'Trinh duyet da dang ky push, nhung he thong dang tat gui Web Push cho tai khoan.';
    }

    if (isWebPushEffectivelyEnabled) {
      return 'Web Push dang hoat dong tren trinh duyet nay.';
    }

    return 'Web Push dang tat. Bam de bat va nhan thong bao realtime.';
  }, [browserPushState.permission, browserPushState.subscribed, browserPushState.supported, isWebPushEffectivelyEnabled, preferences?.webPushEnabled]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-800 p-8 text-white shadow-xl shadow-slate-900/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Cai dat thong bao</h1>
              <p className="mt-2 text-sm text-cyan-100/90">
                Quan ly tap trung thong bao Email, Web Push va lich su thong bao he thong.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCcw className="h-4 w-4" /> Lam moi
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Mail className="h-5 w-5 text-cyan-600" />
              <h2 className="text-lg font-bold">Nhan thong bao email</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Bao gom ket qua duyet/huy Premium va nhac nho sap het han goi.
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
                ? 'Dang cap nhat...'
                : preferences?.emailEnabled
                  ? 'Dang bat - Bam de tat'
                  : 'Dang tat - Bam de bat'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <BellRing className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Nhan thong bao Web Push</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Cac thong bao realtime tren trinh duyet. Ban can cap quyen Notification de su dung.
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
                ? 'Dang cap nhat...'
                : isWebPushEffectivelyEnabled
                  ? 'Dang bat - Bam de tat'
                  : 'Dang tat - Bam de bat'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Bell className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold">Trung tam thong bao</h2>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                {unreadBadgeLabel} chua doc
              </span>
            </div>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead || unreadCount === 0}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMarkingAllRead ? 'Dang xu ly...' : 'Danh dau tat ca da doc'}
            </button>
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Dang tai thong bao...</p>
          ) : notifications.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chua co thong bao nao.</p>
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
                        Danh dau da doc
                      </button>
                    )}
                  </div>
                  {item.actionUrl && (
                    <div className="mt-3">
                      <a
                        href={item.actionUrl}
                        className="text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline"
                      >
                        Mo trang lien quan
                      </a>
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
                  Tai them thong bao
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
