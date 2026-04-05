import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { 
  LayoutDashboard, 
  Bell, 
  Search, 
  Menu, 
  X,
  UserRound,
  KeyRound,
  LogOut,
  BookOpen,
  Zap,
  Star,
  Crown,
  Flame,
  Banknote,
  ClipboardCheck,
  Gem,
  Flag
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient, { 
  fetchMySubscriptionRequests,
  fetchSubscriptionReviewQueue,
  SUBSCRIPTION_REVIEW_UPDATED_EVENT,
  clearAuthSession, 
  fetchCurrentUserProfile, 
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  type UserProfile 
} from '../api/axiosClient';

interface MainLayoutProps {
  children: React.ReactNode;
}

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  onClick: () => void;
};

type DismissedNotificationEntry = {
  id: string;
  dismissedAt: number;
};

const DISMISSED_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeDismissedEntries = (parsed: unknown, now: number): DismissedNotificationEntry[] => {
  if (!Array.isArray(parsed)) {
    return [];
  }

  const deduplicated = new Map<string, DismissedNotificationEntry>();
  for (const item of parsed) {
    if (typeof item === 'string') {
      deduplicated.set(item, { id: item, dismissedAt: now });
      continue;
    }

    if (
      item &&
      typeof item === 'object' &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { dismissedAt?: unknown }).dismissedAt === 'number'
    ) {
      const entry = item as DismissedNotificationEntry;
      if (entry.dismissedAt > now - DISMISSED_NOTIFICATION_TTL_MS) {
        deduplicated.set(entry.id, entry);
      }
    }
  }

  return Array.from(deduplicated.values());
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(Date.now());
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const dismissedIdsStorageKey = useMemo(() => {
    const role = user?.role ?? 'GUEST';
    const email = user?.email ?? 'anonymous';
    return `main-dismissed-notification-ids:${role}:${email}`;
  }, [user?.email, user?.role]);

  const persistDismissedEntries = useCallback((entries: DismissedNotificationEntry[]) => {
    localStorage.setItem(dismissedIdsStorageKey, JSON.stringify(entries));
  }, [dismissedIdsStorageKey]);

  const readDismissedEntries = useCallback(() => {
    const now = Date.now();
    try {
      const raw = localStorage.getItem(dismissedIdsStorageKey);
      if (!raw) {
        return [] as DismissedNotificationEntry[];
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeDismissedEntries(parsed, now);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        persistDismissedEntries(normalized);
      }
      return normalized;
    } catch {
      localStorage.removeItem(dismissedIdsStorageKey);
      return [] as DismissedNotificationEntry[];
    }
  }, [dismissedIdsStorageKey, persistDismissedEntries]);

  const readDismissedIds = useCallback(() => {
    return new Set(readDismissedEntries().map((entry) => entry.id));
  }, [readDismissedEntries]);

  const dismissNotification = (id: string) => {
    setNotificationItems((current) => {
      const next = current.filter((item) => item.id !== id);
      if (user?.role === 'CONTRIBUTOR') {
        setPendingReviewCount(next.filter((item) => item.id.startsWith('review-item-')).length);
      }
      return next;
    });
    const dismissedEntries = readDismissedEntries().filter((entry) => entry.id !== id);
    dismissedEntries.push({ id, dismissedAt: Date.now() });
    persistDismissedEntries(dismissedEntries);
  };

  const [displayNameInput, setDisplayNameInput] = useState('');
  const [profileForm, setProfileForm] = useState({
    phoneNumber: '',
    school: '',
    subject: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        setUser(profile);
        setDisplayNameInput(profile.fullName);
        setProfileForm({
          phoneNumber: profile.phoneNumber ?? '',
          school: profile.school ?? '',
          subject: profile.subject ?? '',
        });
      } catch {
        toast.error('Không thể tải thông tin cá nhân.');
      }
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        if (user?.role === 'CONTRIBUTOR') {
          const queue = await fetchSubscriptionReviewQueue(0, 5, 'PENDING_REVIEW');
          const items: NotificationItem[] = queue.content.map((row) => ({
            id: `review-item-${row.id}`,
            title: `Request #${row.id} cần bạn duyệt`,
            description: `${row.userFullName} • ${row.planName} • ${Number(row.purchasedPrice).toLocaleString('vi-VN')}đ`,
            timeLabel: new Date(row.createdAt).toLocaleString('vi-VN'),
            onClick: () => navigate('/contributor/subscription-reviews'),
          }));

          const dismissedIds = readDismissedIds();
          const visibleItems = items.filter((item) => !dismissedIds.has(item.id));

          if (isMounted) {
            setPendingReviewCount(visibleItems.filter((item) => item.id.startsWith('review-item-')).length);
            setNotificationItems(visibleItems);
          }
          return;
        }

        const myRequests = await fetchMySubscriptionRequests();
        const recent = myRequests.slice(0, 5);
        const items: NotificationItem[] = recent.map((row) => ({
          id: `my-request-${row.id}`,
          title: `Yêu cầu ${row.planName} đã ${row.status === 'APPROVED' ? 'được duyệt' : row.status === 'REJECTED' ? 'bị từ chối' : 'đang chờ duyệt'}`,
          description: `Mã GD: ${row.transactionRef || '-'} • Số tiền ${Number(row.purchasedPrice).toLocaleString('vi-VN')}đ`,
          timeLabel: new Date(row.createdAt).toLocaleString('vi-VN'),
          onClick: () => navigate('/dashboard/subscription-payments'),
        }));

        const dismissedIds = readDismissedIds();
        const visibleItems = items.filter((item) => !dismissedIds.has(item.id));

        if (isMounted) {
          setPendingReviewCount(0);
          setNotificationItems(visibleItems);
        }
      } catch {
        if (isMounted) {
          setPendingReviewCount(0);
          setNotificationItems([
            {
              id: 'fallback-main',
              title: 'Không tải được thông báo',
              description: 'Vui lòng thử lại sau hoặc mở trang thanh toán để kiểm tra.',
              timeLabel: 'Hệ thống',
              onClick: () => navigate(user?.role === 'CONTRIBUTOR' ? '/contributor/subscription-reviews' : '/dashboard/subscription-payments'),
            },
          ]);
        }
      }
    };

    const handleRefresh = () => {
      void loadNotifications();
    };

    void loadNotifications();
    const intervalId = globalThis.setInterval(handleRefresh, 30000);
    globalThis.addEventListener(SUBSCRIPTION_REVIEW_UPDATED_EVENT, handleRefresh);

    return () => {
      isMounted = false;
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener(SUBSCRIPTION_REVIEW_UPDATED_EVENT, handleRefresh);
    };
  }, [navigate, readDismissedIds, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    globalThis.addEventListener('mousedown', handleClickOutside);
    return () => {
      globalThis.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const bellBadgeCount = useMemo(() => {
    if (user?.role === 'CONTRIBUTOR') {
      return pendingReviewCount;
    }
    return notificationItems.length;
  }, [notificationItems.length, pendingReviewCount, user?.role]);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/logout');
      toast.success('Đã đăng xuất');
    } catch { /* ignore */ }
    clearAuthSession();
    navigate('/login');
  };

  const navItems = user?.role === 'CONTRIBUTOR' ? [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/contributor' },
    { label: 'Tạo gói Premium', icon: Gem, path: '/contributor/premium-plans' },
    { label: 'Duyệt thanh toán', icon: ClipboardCheck, path: '/contributor/subscription-reviews' },
    { label: 'Báo cáo câu hỏi', icon: Flag, path: '/contributor/reports' },
    { label: 'Đề thi của tôi', icon: BookOpen, path: '/contributor/exams' },
    { label: 'Thống kê', icon: Zap, path: '/contributor/analytics' },
  ] : [
    { label: 'Tổng quan', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Nâng cấp Premium', icon: Banknote, path: '/dashboard/subscription-payments' },
    { label: 'Kho đề công khai', icon: BookOpen, path: '/dashboard/exams' },
    { label: 'Học tập (SM-2)', icon: Zap, path: '/dashboard/spaced-repetition' },
    { label: 'Cộng đồng', icon: Star, path: '/dashboard/community' },
  ];

  const avatarUrl = user?.avatarUrl?.trim();
  let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=2563eb&color=fff`;
  if (avatarUrl) {
    const separator = avatarUrl.includes('?') ? '&' : '?';
    avatar = `${avatarUrl}${separator}v=${avatarCacheBuster}`;
  }

  const handleUpdateProfile = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (displayNameInput.trim().length < 3) {
      toast.error('Tên phải có ít nhất 3 ký tự.');
      return;
    }
    try {
      setIsSavingProfile(true);
      const updated = await updateCurrentUserProfile({
        fullName: displayNameInput.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || null,
        school: profileForm.school.trim() || null,
        subject: profileForm.subject.trim() || null,
      });
      setUser(updated);
      setIsProfileModalOpen(false);
      toast.success('Đã cập nhật hồ sơ.');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Lỗi cập nhật hồ sơ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const updated = await uploadCurrentUserAvatar(file);
      setUser(updated);
      setAvatarCacheBuster(Date.now());
      toast.success('Đã cập nhật avatar.');
    } catch {
      toast.error('Lỗi upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdatePassword = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      setIsSavingPassword(true);
      await updateCurrentUserProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.');
      handleLogout();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Lỗi đổi mật khẩu.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Đóng sidebar"
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">ExamBank</span>
          </Link>
          <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">Hoạt động</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
          
          <div className="mt-auto pt-6">
             <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                   <Crown className="w-5 h-5 text-amber-500" />
                   <span className="font-bold text-blue-900 text-sm">Nâng cấp Premium</span>
                </div>
                <p className="text-[11px] text-blue-700/70 mb-3">Mở khóa phân tích AI và không giới hạn câu hỏi.</p>
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-blue-500/20">
                   Khám phá ngay
                </button>
             </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors group"
          >
            <div className="flex items-center gap-3 truncate">
              <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200" />
              <div className="text-left truncate">
                 <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
          </button>
          <button
            id="sidebar-logout-button"
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm đề thi, môn học..."
                className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-sm w-64 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100/50">
                <Flame className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">12 Days</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100/50">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-700">850 Pts</span>
              </div>
            </div>
            <div ref={notificationRef} className="relative">
              <button
                id="main-review-bell"
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative p-2 text-slate-400 hover:text-slate-600"
                title="Mở danh sách thông báo"
              >
                <Bell className="w-5 h-5" />
                {bellBadgeCount > 0 && (
                  <span
                    id="main-review-bell-badge"
                    className="absolute -top-1 -right-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                  >
                    {bellBadgeCount > 99 ? '99+' : bellBadgeCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-11 z-50 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">Thông báo</p>
                    <p className="text-xs text-slate-500">Nhấn từng thông báo để mở trang liên quan.</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500">Hiện chưa có thông báo mới.</p>
                    ) : (
                      notificationItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            dismissNotification(item.id);
                            setIsNotificationOpen(false);
                            item.onClick();
                          }}
                          className="w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.timeLabel}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
            <button 
              id="profile-settings-trigger"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3"
            >
              <img src={avatar} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Profile Modal - Shared between Main and Admin Layout */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng hồ sơ"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsProfileModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Cập nhật thông tin cá nhân</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">Thông tin cá nhân</h3>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <div className="relative group">
                      <img src={avatar} className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt="Avatar" />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <span className="text-xs font-bold uppercase tracking-wider">Thay đổi</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                      </label>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="main-layout-fullname" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và tên</label>
                      <input 
                        id="display-name-input"
                        type="text" 
                        value={displayNameInput} 
                        onChange={e => setDisplayNameInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="main-layout-phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                      <input 
                        id="main-layout-phone"
                        type="text" 
                        value={profileForm.phoneNumber} 
                        onChange={e => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="main-layout-school" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trường học</label>
                      <input
                        id="main-layout-school"
                        type="text"
                        value={profileForm.school}
                        onChange={e => setProfileForm(prev => ({ ...prev, school: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="main-layout-subject" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Môn phụ trách</label>
                      <input
                        id="main-layout-subject"
                        type="text"
                        value={profileForm.subject}
                        onChange={e => setProfileForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isSavingProfile}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </button>
                </form>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-800">Đổi mật khẩu</h3>
                  </div>
                  
                  <div className="space-y-3 pt-[104px]">
                    <input 
                      id="current-password-input"
                      type="password" 
                      placeholder="Mật khẩu hiện tại"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                    <input 
                      id="new-password-input"
                      type="password" 
                      placeholder="Mật khẩu mới"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                    <input 
                      id="confirm-password-input"
                      type="password" 
                      placeholder="Xác nhận mật khẩu mới"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                  </div>

                  <button 
                    disabled={isSavingPassword}
                    className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>

                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 mt-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors border border-transparent hover:border-rose-100"
                  >
                    Đăng xuất
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
