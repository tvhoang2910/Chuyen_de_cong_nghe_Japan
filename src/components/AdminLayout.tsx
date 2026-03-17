import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X,
  UserRound,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient, { 
  clearAuthSession, 
  fetchCurrentUserProfile, 
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  type UserProfile 
} from '../api/axiosClient';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(Date.now());
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
      } catch (error) {
        console.error('Failed to load admin profile:', error);
        toast.error('Không thể tải thông tin admin.');
      }
    };
    void loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/logout');
      toast.success('Đã đăng xuất');
    } catch {
      // Ignore
    }
    clearAuthSession();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Quản lý Users', icon: Users, path: '/admin/users' },
    { label: 'Cài đặt hệ thống', icon: Settings, path: '/admin/settings' },
  ];

  const avatar = user?.avatarUrl?.trim()
    ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}v=${avatarCacheBuster}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=0f172a&color=fff`;

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
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Admin Console</span>
          </div>
          <button className="lg:hidden p-2 hover:bg-slate-800 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-600/20' 
                    : 'hover:bg-slate-800 hover:text-white border border-transparent'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm nhanh..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full border border-slate-200 hover:border-cyan-300 transition-colors bg-white group"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-cyan-700 transition-colors">{user?.fullName}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{user?.role}</p>
              </div>
              <img src={avatar} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" alt="Admin" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Thiết lập tài khoản Admin</h2>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound className="w-5 h-5 text-cyan-600" />
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
                          <div className="w-5 h-5 border-2 border-cyan-600 border-t-transparent animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và tên</label>
                      <input 
                        type="text" 
                        value={displayNameInput} 
                        onChange={e => setDisplayNameInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                      <input 
                        type="text" 
                        value={profileForm.phoneNumber} 
                        onChange={e => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trường học</label>
                      <input
                        type="text"
                        value={profileForm.school}
                        onChange={e => setProfileForm(prev => ({ ...prev, school: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Môn phụ trách</label>
                      <input
                        type="text"
                        value={profileForm.subject}
                        onChange={e => setProfileForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isSavingProfile}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </form>

                {/* Password Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-5 h-5 text-rose-500" />
                    <h3 className="font-bold text-slate-800">Đổi mật khẩu</h3>
                  </div>
                  
                  <div className="space-y-3 pt-[104px]">
                    <input 
                      type="password" 
                      placeholder="Mật khẩu hiện tại"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Mật khẩu mới"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                    />
                    <input 
                      type="password" 
                      placeholder="Xác nhận mật khẩu mới"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-600/20 transition-all outline-none"
                    />
                  </div>

                  <button 
                    disabled={isSavingPassword}
                    className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
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

export default AdminLayout;
