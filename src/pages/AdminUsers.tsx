import React, { useCallback, useEffect, useState, useMemo } from 'react';
import axios, { type AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Users, ShieldCheck, User as UserIcon, CheckCircle2, UserPlus, FileUp, Sparkles, Filter, List, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAdminUsers,
  createAdminUser,
  importAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUserItem,
  type AppRole,
  type ImportAdminUsersResponse,
} from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import UserTable from '../components/admin/UserTable';
import UserFilters from '../components/admin/UserFilters';
import CreateUserForm from '../components/admin/CreateUserForm';
import ImportUserSection from '../components/admin/ImportUserSection';

const pageSize = 10;
const SAMPLE_IMPORT_PASSWORD = ['User', '@', '123', '456'].join('');

const adminImportSampleUsers = [
  {
    email: 'teacher.one@example.com',
    fullName: 'Teacher One',
    password: SAMPLE_IMPORT_PASSWORD,
    role: 'CONTRIBUTOR' as AppRole,
  },
  {
    email: 'teacher.two@example.com',
    fullName: 'Teacher Two',
    password: SAMPLE_IMPORT_PASSWORD,
    role: 'USER' as AppRole,
  },
];

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<number | null>(null);
  const [statusReasonByUserId, setStatusReasonByUserId] = useState<Record<number, string>>({});
  const [importJsonInput, setImportJsonInput] = useState('');
  const [skipExistingOnImport, setSkipExistingOnImport] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ImportAdminUsersResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | AppRole>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [spotlightUserId, setSpotlightUserId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CONTRIBUTOR' as AppRole,
  });

  const stats = useMemo(() => {
    return {
      total: totalElements,
      active: users.filter(u => u.status).length,
      contributors: users.filter(u => u.role === 'CONTRIBUTOR').length,
      blocked: users.filter(u => !u.status).length,
    };
  }, [totalElements, users]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchAdminUsers({
        page,
        size: pageSize,
        search: searchKeyword,
        role: roleFilter,
      });
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập trang Admin.');
      } else {
        toast.error('Không thể tải danh sách users.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, searchKeyword, roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setRoleFilter(activeTab === 'ALL' ? '' : activeTab);
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    if (spotlightUserId == null) return;
    const timer = setTimeout(() => setSpotlightUserId(null), 3000);
    return () => clearTimeout(timer);
  }, [spotlightUserId]);

  const handleSearchSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setPage(0);
    setSearchKeyword(searchInput.trim());
  };

  const resolveErrorMessage = (error: unknown, fallbackMessage: string): string => {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  };

  const handleCreateUser = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || createForm.password.length < 8) {
      toast.error('Vui lòng nhập đủ thông tin hợp lệ để tạo user.');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsCreating(true);
      const created = await createAdminUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      toast.success('Tạo user thành công.');
      setCreateForm({ fullName: '', email: '', password: '', confirmPassword: '', role: 'CONTRIBUTOR' });
      setPage(0);
      void loadUsers();
      setSpotlightUserId(created.id);
    } catch (error) {
      toast.error(resolveErrorMessage(error, 'Không thể tạo user mới.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const reason = (statusReasonByUserId[user.id] ?? '').trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do trước khi thao tác.');
      return;
    }

    try {
      setActionLoadingUserId(user.id);
      const updated = await updateAdminUserStatus(user.id, { status: user.status ? 0 : 1, reason });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setSpotlightUserId(updated.id);
      setStatusReasonByUserId(prev => ({ ...prev, [user.id]: '' }));
      toast.success(updated.status ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
    } catch (error) {
      toast.error(resolveErrorMessage(error, 'Lỗi cập nhật trạng thái.'));
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const handleChangeUserRole = async (userId: number, role: AppRole) => {
    try {
      setActionLoadingUserId(userId);
      const updated = await updateAdminUserRole(userId, { role });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setSpotlightUserId(updated.id);
      toast.success('Đã cập nhật quyền tài khoản.');
    } catch (error) {
      toast.error(resolveErrorMessage(error, 'Lỗi cập nhật role.'));
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJsonInput);
      const usersToImport = Array.isArray(parsed) ? parsed : parsed.users;
      if (!Array.isArray(usersToImport)) throw new Error('Dữ liệu không hợp lệ');

      setIsImporting(true);
      const response = await importAdminUsers({
        users: usersToImport,
        skipExisting: skipExistingOnImport,
      });
      setLastImportResult(response);
      void loadUsers();
      toast.success('Đã hoàn tất import.');
    } catch (error) {
      toast.error(resolveErrorMessage(error, 'Lỗi import dữ liệu.'));
    } finally {
      setIsImporting(false);
    }
  };

  const tabs: Array<{ id: 'ALL' | AppRole; label: string; icon: typeof Users; color: string; bg: string }> = [
    { id: 'ALL', label: 'Tất cả', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'USER', label: 'Học sinh', icon: UserIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'CONTRIBUTOR', label: 'Giáo viên', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'ADMIN', label: 'Quản trị', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 pb-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[40px] bg-slate-950 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-indigo-500/20 blur-[100px] rounded-full" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-cyan-400 text-xs font-black uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Hệ thống quản trị Premium</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                Quản lý <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Thành viên</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                Nền tảng quản trị thông minh giúp bạn kiểm soát toàn diện hệ sinh thái người dùng, giáo viên và cộng tác viên.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 w-full lg:w-auto"
            >
              <QuickStat label="Tổng thành viên" value={totalElements} icon={<Users className="w-5 h-5" />} />
              <QuickStat label="Hoạt động" value={stats.active} icon={<CheckCircle2 className="w-5 h-5" />} color="text-emerald-400" />
            </motion.div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 backdrop-blur-xl p-4 rounded-[32px] border border-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shrink-0
                  ${activeTab === tab.id ? tab.color : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="premiumTab"
                    className={`absolute inset-0 ${tab.bg} rounded-xl shadow-sm border border-current/5`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                <button 
                  className={`p-2 rounded-lg transition-all bg-white shadow-sm text-indigo-600`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  className={`p-2 rounded-lg transition-all text-slate-400 hover:text-slate-600`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
             </div>
             <div className="h-8 w-px bg-slate-200 mx-1" />
             <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${isFilterOpen ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-900 shadow-sm'}`}
             >
                <Filter className="w-4 h-4" /> 
                <span>Bộ lọc</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <UserFilters
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                    onSearch={handleSearchSubmit}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className="relative"
            >
              <UserTable
                users={users}
                isLoading={isLoading}
                actionLoadingUserId={actionLoadingUserId}
                spotlightUserId={spotlightUserId}
                statusReasonByUserId={statusReasonByUserId}
                setStatusReasonByUserId={setStatusReasonByUserId}
                onToggleStatus={handleToggleUserStatus}
                onChangeRole={handleChangeUserRole}
              />

              {/* Enhanced Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-4">
                <p className="text-sm text-slate-500 font-bold">
                  Đang hiển thị <span className="text-slate-950">{(page * pageSize) + 1}</span> - <span className="text-slate-950">{Math.min((page + 1) * pageSize, totalElements)}</span> trong <span className="text-slate-950">{totalElements}</span>
                </p>
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <button
                    disabled={page === 0 || isLoading}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2.5 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-600 active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === pageNum ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-950'}`}
                      >
                        {pageNum + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={page + 1 >= totalPages || isLoading}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2.5 hover:bg-slate-50 disabled:opacity-30 rounded-xl transition-all text-slate-600 active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <aside className="xl:col-span-4 space-y-8 sticky top-8">
            <PremiumSidebarCard 
              title="Khởi tạo" 
              subtitle="Tạo tài khoản mới"
              icon={<UserPlus className="w-5 h-5 text-indigo-600" />}
              gradient="from-indigo-600/10 to-cyan-600/10"
            >
              <CreateUserForm
                createForm={createForm}
                setCreateForm={setCreateForm}
                isCreating={isCreating}
                onCreate={handleCreateUser}
              />
            </PremiumSidebarCard>

            <PremiumSidebarCard 
              title="Nhập dữ liệu" 
              subtitle="Import từ JSON"
              icon={<FileUp className="w-5 h-5 text-emerald-600" />}
              gradient="from-emerald-600/10 to-teal-600/10"
            >
              <ImportUserSection
                importJsonInput={importJsonInput}
                setImportJsonInput={setImportJsonInput}
                skipExistingOnImport={skipExistingOnImport}
                setSkipExistingOnImport={setSkipExistingOnImport}
                isImporting={isImporting}
                onImport={handleImport}
                onGenerateSample={() => setImportJsonInput(JSON.stringify(adminImportSampleUsers, null, 2))}
                onCopySample={() => {
                   navigator.clipboard.writeText(JSON.stringify(adminImportSampleUsers, null, 2));
                   toast.success('Đã copy mẫu.');
                }}
                lastImportResult={lastImportResult}
              />
            </PremiumSidebarCard>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
};

interface QuickStatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}

interface PremiumSidebarCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, icon, color = "text-indigo-400" }) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] min-w-[180px] group hover:bg-white/10 transition-all cursor-default">
    <div className={`w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-black mt-1 leading-none">{value}</h3>
  </div>
);

const PremiumSidebarCard: React.FC<PremiumSidebarCardProps> = ({ title, subtitle, icon, children, gradient }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className={`bg-white rounded-[40px] p-8 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} blur-3xl rounded-full -mt-10 -mr-10 opacity-50 group-hover:opacity-100 transition-opacity`} />
    
    <div className="relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-950 leading-none">{title}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  </motion.div>
);

export default AdminUsers;