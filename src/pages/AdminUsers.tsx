import axios, { type AxiosError } from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  UserPlus,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAdminUser,
  fetchAdminUsers,
  importAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUserItem,
  type AppRole,
  type ImportAdminUsersResponse,
} from '../api/axiosClient';
import AdminLayout from '../components/AdminLayout';
import CreateUserForm from '../components/admin/CreateUserForm';
import ImportUserSection from '../components/admin/ImportUserSection';
import UserTable from '../components/admin/UserTable';

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
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [spotlightUserId, setSpotlightUserId] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'CONTRIBUTOR' as AppRole,
  });

  const stats = useMemo(() => {
    return {
      total: totalElements,
      active: users.filter(u => u.status).length,
      contributors: users.filter(u => u.role === 'CONTRIBUTOR').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      blocked: users.filter(u => !u.status).length,
    };
  }, [totalElements, users]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 0) {
      return [] as number[];
    }

    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, page - half);
    const end = Math.min(totalPages - 1, start + maxVisible - 1);
    start = Math.max(0, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchAdminUsers({
        page,
        size: pageSize,
        search: searchKeyword,
        role: roleFilter,
      });
      setUsers(Array.isArray(response.content) ? response.content : []);
      setTotalPages(Number.isFinite(response.totalPages) ? response.totalPages : 0);
      setTotalElements(Number.isFinite(response.totalElements) ? response.totalElements : 0);
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
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      toast.error('Vui lòng nhập đủ thông tin hợp lệ để tạo user.');
      return;
    }

    try {
      setIsCreating(true);
      const created = await createAdminUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
      });
      toast.success('Tạo user thành công. Email kích hoạt đã được gửi.');
      setCreateForm({ fullName: '', email: '', role: 'CONTRIBUTOR' });
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

  const handleDeleteUser = (user: AdminUserItem) => {
    toast(`API xóa user #${user.id} chưa được backend hỗ trợ. Tạm thời hãy khóa tài khoản.`);
  };

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(adminImportSampleUsers, null, 2));
      toast.success('Đã copy JSON mẫu.');
    } catch {
      toast.error('Không thể copy JSON mẫu, vui lòng copy thủ công.');
    }
  };

  const currentStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const currentEnd = totalElements === 0 ? 0 : Math.min((page + 1) * pageSize, totalElements);

  const tabs: Array<{ id: 'ALL' | AppRole; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'USER', label: 'Học sinh' },
    { id: 'CONTRIBUTOR', label: 'Giáo viên' },
    { id: 'ADMIN', label: 'Quản trị' },
  ];

  return (
    <AdminLayout>
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-5 pb-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Quản lý người dùng</h1>
              <p className="mt-1 text-sm text-slate-600">
                Bảng dữ liệu được tối ưu cho kiểm duyệt nhanh, căn cột chuẩn và thao tác theo từng dòng.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/*
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                <FileUp className="h-4 w-4" />
                Import JSON
              </button>
              */}
              <button
                type="button"
                onClick={() => setIsCreateFormOpen(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100"
              >
                <UserPlus className="h-4 w-4" />
                {isCreateFormOpen ? 'Ẩn form tạo user' : 'Tạo user mới'}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Tổng" value={stats.total} />
            <StatCard label="Đang hoạt động" value={stats.active} tone="emerald" />
            <StatCard label="Giáo viên" value={stats.contributors} tone="cyan" />
            <StatCard label="Quản trị" value={stats.admins} tone="rose" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại, trường học..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Áp dụng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchKeyword('');
                  setActiveTab('ALL');
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Xóa lọc
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isFilterOpen
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                <Filter className="h-4 w-4" />
                {isFilterOpen ? 'Ẩn bộ lọc nhanh' : 'Hiện bộ lọc nhanh'}
              </button>
            </div>
          </form>

          {isFilterOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              {['@gmail.com', '@edu.vn', 'Đã khóa', 'Quản trị', 'Giáo viên'].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => {
                    setSearchInput(quick);
                    setSearchKeyword(quick);
                    setPage(0);
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {quick}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <UserTable
          users={users}
          isLoading={isLoading}
          actionLoadingUserId={actionLoadingUserId}
          spotlightUserId={spotlightUserId}
          statusReasonByUserId={statusReasonByUserId}
          setStatusReasonByUserId={setStatusReasonByUserId}
          onToggleStatus={handleToggleUserStatus}
          onChangeRole={handleChangeUserRole}
          onDelete={handleDeleteUser}
        />

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
              Hiển thị <span className="font-semibold text-slate-900">{currentStart}</span>-<span className="font-semibold text-slate-900">{currentEnd}</span> / <span className="font-semibold text-slate-900">{totalElements}</span> người dùng
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(prev => prev - 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                    page === pageNumber
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={page + 1 >= totalPages || isLoading}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isCreateFormOpen && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <CreateUserForm
              createForm={createForm}
              setCreateForm={setCreateForm}
              isCreating={isCreating}
              onCreate={handleCreateUser}
            />
          </section>
        )}
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 md:p-8">
          <button
            type="button"
            aria-label="Đóng modal import"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsImportModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Import người dùng từ JSON</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Khu vực này được đặt trong modal để bảng người dùng luôn chiếm 100% chiều rộng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ImportUserSection
              importJsonInput={importJsonInput}
              setImportJsonInput={setImportJsonInput}
              skipExistingOnImport={skipExistingOnImport}
              setSkipExistingOnImport={setSkipExistingOnImport}
              isImporting={isImporting}
              onImport={handleImport}
              onGenerateSample={() => setImportJsonInput(JSON.stringify(adminImportSampleUsers, null, 2))}
              onCopySample={() => {
                void handleCopySample();
              }}
              lastImportResult={lastImportResult}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  tone?: 'slate' | 'emerald' | 'cyan' | 'rose';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, tone = 'slate' }) => {
  const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
    </div>
  );
};

export default AdminUsers;