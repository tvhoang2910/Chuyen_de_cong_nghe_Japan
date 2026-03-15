import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Search as SearchIcon, Bell, Star, Flame, LogOut, ChartLine, Clock, Zap, Crown, UserRound, KeyRound, X } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import toast from 'react-hot-toast';
import axiosClient, { clearAuthSession, fetchCurrentUserProfile, updateCurrentUserProfile, type UserProfile } from '../api/axiosClient';

// Mock Data cho Radar Chart
const radarData = [
  { subject: 'Toán', A: 85, fullMark: 100 },
  { subject: 'Vật lý', A: 70, fullMark: 100 },
  { subject: 'IT', A: 90, fullMark: 100 },
  { subject: 'Tiếng Anh', A: 65, fullMark: 100 },
  { subject: 'Triết học', A: 50, fullMark: 100 },
  { subject: 'Giải phẫu', A: 40, fullMark: 100 },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const fallbackEmail = localStorage.getItem('user_email') || 'sinhvien@example.com';
  const [user, setUser] = useState<UserProfile>({
    id: 0,
    email: fallbackEmail,
    fullName: fallbackEmail,
    role: 'USER',
    premium: false,
  });
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [profileForm, setProfileForm] = useState({
    avatarUrl: '',
    phoneNumber: '',
    school: '',
    subject: '',
  });
  const [isSavingName, setIsSavingName] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const avatar = user.avatarUrl?.trim()
    ? user.avatarUrl
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=2563eb&color=fff`;
  const hasRequestedProfileRef = useRef(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const points = 1250;
  const streak = 15;

  useEffect(() => {
    if (hasRequestedProfileRef.current) {
      return;
    }
    hasRequestedProfileRef.current = true;

    const loadProfile = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        setUser(profile);
        setDisplayNameInput(profile.fullName);
        setProfileForm({
          avatarUrl: profile.avatarUrl ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          school: profile.school ?? '',
          subject: profile.subject ?? '',
        });
        localStorage.setItem('user_email', profile.email);
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Không thể tải thông tin người dùng.');
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      if (width > 0 && height > 0) {
        setChartSize({ width, height });
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/logout');
      toast.success('Đã đăng xuất', { icon: '👋' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    clearAuthSession();
    navigate('/login');
  };

  const extractErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
      return error.response.data.message;
    }
    return fallbackMessage;
  };

  const handleUpdateDisplayName = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = displayNameInput.trim();
    if (nextName.length < 3) {
      toast.error('Tên hiển thị phải có ít nhất 3 ký tự.');
      return;
    }

    try {
      setIsSavingName(true);
      const updatedProfile = await updateCurrentUserProfile({
        fullName: nextName,
        avatarUrl: profileForm.avatarUrl.trim() || null,
        phoneNumber: profileForm.phoneNumber.trim() || null,
        school: profileForm.school.trim() || null,
        subject: profileForm.subject.trim() || null,
      });
      setUser(updatedProfile);
      setDisplayNameInput(updatedProfile.fullName);
      setProfileForm({
        avatarUrl: updatedProfile.avatarUrl ?? '',
        phoneNumber: updatedProfile.phoneNumber ?? '',
        school: updatedProfile.school ?? '',
        subject: updatedProfile.subject ?? '',
      });
      setIsProfileModalOpen(false);
      toast.success('Đã cập nhật hồ sơ cá nhân.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleProfileFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpdatePassword = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
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
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      clearAuthSession();
      setIsProfileModalOpen(false);
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Không thể cập nhật mật khẩu.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">ExamBank</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Học tập</div>
          <button type="button" className="w-full text-left flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <ChartLine className="w-5 h-5" /> Tổng quan
          </button>
          <button type="button" className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">
            <BookOpen className="w-5 h-5" /> Đề thi của tôi
          </button>
          <button type="button" className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">
            <Zap className="w-5 h-5" /> Spaced Repetition
          </button>
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3 mt-6">Khác</div>
          <button type="button" className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">
            <Star className="w-5 h-5" /> Cộng đồng
          </button>
          
          <div className="mt-auto pt-6">
             <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-4 border border-amber-200/50">
                <div className="flex items-center gap-2 mb-2">
                   <Crown className="w-5 h-5 text-amber-600" />
                   <span className="font-bold text-amber-800 text-sm">Nâng cấp Premium</span>
                </div>
                <p className="text-xs text-amber-700/80 mb-3">Mở khóa phân tích AI và ngân hàng câu hỏi không giới hạn.</p>
                <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-amber-500/20">
                   Nâng cấp ngay
                </button>
             </div>
          </div>
        </div>

        {/* User profile bottom */}
        <div className="p-4 border-t border-slate-100">
          <button
            id="sidebar-logout-button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors group"
          >
            <div className="flex items-center gap-3 truncate">
              <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full" />
              <span className="truncate text-sm" title={user.fullName}>{user.fullName}</span>
            </div>
            <LogOut className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm đề thi..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-8">
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100/50">
                <Flame className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-700">{streak} Days</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100/50">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{points} Pts</span>
              </div>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <button
              id="profile-settings-trigger"
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-1 pl-2 hover:border-blue-300 transition-colors"
            >
              <span className="hidden lg:block max-w-28 truncate text-sm font-semibold text-slate-700" title={user.fullName}>{user.fullName}</span>
              <img src={avatar} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" alt="User" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Chào buổi sáng, {user.fullName.split('@')[0]}! 👋</h1>
                <p className="text-slate-500">Sẵn sàng chuẩn bị cho kỳ thi sắp tới chưa?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hero Action Widget */}
              <div className="lg:col-span-2 bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-600/20">
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/50 rounded-lg text-xs font-semibold text-indigo-50 mb-4 backdrop-blur-sm border border-indigo-400/30">
                      <Zap className="w-3.5 h-3.5" /> Thuật toán SM-2
                    </div>
                    <h2 className="text-3xl font-bold mb-3">Bạn có 24 câu hỏi cần ôn tập hôm nay</h2>
                    <p className="text-indigo-100 max-w-sm mb-8">Hoàn thành bài tập Spaced Repetition hôm nay để giữ cho kiến thức ở mức cao nhất trước khi quên lãng.</p>
                  </div>
                  <button className="self-start bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-sm flex items-center gap-2">
                    Bắt đầu ôn tập <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Radar Chart Analytics */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">Năng lực môn học</h3>
                  <button className="text-slate-400 hover:text-blue-600"><ChartLine className="w-4 h-4" /></button>
                </div>
                <div ref={chartContainerRef} className="h-64 w-full min-w-0 mt-2">
                  {chartSize.width > 0 && chartSize.height > 0 ? (
                    <RadarChart
                      width={chartSize.width}
                      height={chartSize.height}
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={radarData}
                    >
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Radar name="Học viên" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
                    </RadarChart>
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Hoạt động gần đây</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  // Skeletons
                  [1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-6"></div>
                      <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                    </div>
                  ))
                ) : (
                  // Real Data
                  [
                    { title: 'Kiến trúc máy tính - MT101', date: 'Hôm nay', score: '8.5/10', color: 'blue' },
                    { title: 'Nhập môn AI - AI102', date: 'Hôm qua', score: '9.0/10', color: 'emerald' },
                    { title: 'Tiếng Anh B1 - Đề 03', date: '3 ngày trước', score: '6.5/10', color: 'amber' },
                  ].map((exam) => (
                    <div key={exam.title} className={`bg-white p-6 rounded-2xl border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all group`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block bg-${exam.color}-50 text-${exam.color}-700`}>
                          {exam.score}
                        </div>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.date}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-6 truncate" title={exam.title}>{exam.title}</h3>
                      <button className="w-full bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                        Xem chi tiết
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              aria-label="close-profile-modal"
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Cập nhật thông tin cá nhân</h2>
                  <p className="text-sm text-slate-500 mt-1">Bạn có thể đổi tên hiển thị và mật khẩu tại đây.</p>
                </div>
                <button
                  aria-label="close-profile-settings"
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <form onSubmit={handleUpdateDisplayName} className="rounded-2xl border border-slate-200 p-6 space-y-4 bg-slate-50/40">
                  <div className="flex items-center gap-2 text-slate-900">
                    <UserRound className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">Đổi tên hiển thị</h3>
                  </div>
                  <p className="text-sm text-slate-500">Cập nhật thông tin hồ sơ hiển thị của bạn.</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="display-name-input">Họ và tên</label>
                    <input
                      id="display-name-input"
                      type="text"
                      value={displayNameInput}
                      onChange={(event) => setDisplayNameInput(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="Nguyen Van A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="profile-avatar-input">Avatar URL</label>
                    <input
                      id="profile-avatar-input"
                      type="url"
                      name="avatarUrl"
                      value={profileForm.avatarUrl}
                      onChange={handleProfileFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="https://example.com/avatar.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="profile-phone-input">Số điện thoại</label>
                    <input
                      id="profile-phone-input"
                      type="text"
                      name="phoneNumber"
                      value={profileForm.phoneNumber}
                      onChange={handleProfileFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="0901234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="profile-school-input">Đơn vị trường</label>
                    <input
                      id="profile-school-input"
                      type="text"
                      name="school"
                      value={profileForm.school}
                      onChange={handleProfileFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="Dai hoc ABC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="profile-subject-input">Bộ môn</label>
                    <input
                      id="profile-subject-input"
                      type="text"
                      name="subject"
                      value={profileForm.subject}
                      onChange={handleProfileFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="Cong nghe thong tin"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
                  >
                    {isSavingName ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </button>
                </form>

                <form onSubmit={handleUpdatePassword} className="rounded-2xl border border-slate-200 p-6 space-y-4 bg-slate-50/40">
                  <div className="flex items-center gap-2 text-slate-900">
                    <KeyRound className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-lg">Đổi mật khẩu</h3>
                  </div>
                  <p className="text-sm text-slate-500">Nhập mật khẩu hiện tại để đặt mật khẩu mới.</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="current-password-input">Mật khẩu hiện tại</label>
                    <input
                      id="current-password-input"
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="new-password-input">Mật khẩu mới</label>
                    <input
                      id="new-password-input"
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="confirm-password-input">Xác nhận mật khẩu mới</label>
                    <input
                      id="confirm-password-input"
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordFieldChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-70"
                  >
                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
