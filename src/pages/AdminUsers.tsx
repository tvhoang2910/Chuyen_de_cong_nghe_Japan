import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

const pageSize = 10;
const sampleImportSecret = "CHANGE_ME";
const adminImportSampleUsers = [
  {
    email: 'teacher.one@example.com',
    fullName: 'Teacher One',
    password: sampleImportSecret,
    role: 'CONTRIBUTOR',
    avatarUrl: 'https://example.com/avatar-1.png',
    phoneNumber: '0901234567',
    school: 'Dai hoc ABC',
    subject: 'Toan',
  },
  {
    email: 'teacher.two@example.com',
    fullName: 'Teacher Two',
    password: sampleImportSecret,
    role: 'USER',
    school: 'Dai hoc XYZ',
    subject: 'Vat ly',
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
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'CONTRIBUTOR' as AppRole,
  });

  const pageLabel = useMemo(() => {
    if (!totalElements) {
      return '0 users';
    }
    const from = page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, totalElements);
    return `${from}-${to} / ${totalElements} users`;
  }, [page, totalElements]);

  const loadUsers = async () => {
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
  };

  useEffect(() => {
    void loadUsers();
  }, [page, searchKeyword, roleFilter]);

  const handleSearchSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearchKeyword(searchInput.trim());
  };

  const handleCreateFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setCreateForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || createForm.password.length < 8) {
      toast.error('Vui lòng nhập đủ thông tin hợp lệ để tạo user.');
      return;
    }

    try {
      setIsCreating(true);
      await createAdminUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      toast.success('Tạo user thành công.');
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'CONTRIBUTOR',
      });
      setPage(0);
      await loadUsers();
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể tạo user mới.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const applyUserUpdate = (updatedUser: AdminUserItem) => {
    setUsers((previous) => previous.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const reason = (statusReasonByUserId[user.id] ?? '').trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do khóa/mở khóa trước khi thao tác.');
      return;
    }

    try {
      setActionLoadingUserId(user.id);
      const payload = { status: user.status ? 0 : 1, reason };
      const updated = await updateAdminUserStatus(user.id, payload);
      applyUserUpdate(updated);
      setStatusReasonByUserId((previous) => ({
        ...previous,
        [user.id]: '',
      }));
      toast.success(updated.status ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể cập nhật trạng thái tài khoản.');
      }
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const handleImportUsersJson = async () => {
    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(importJsonInput);
    } catch {
      toast.error('JSON không hợp lệ.');
      return;
    }

    const users = Array.isArray(parsedPayload)
      ? parsedPayload
      : (parsedPayload as { users?: unknown })?.users;

    if (!Array.isArray(users) || users.length === 0) {
      toast.error('Payload phải là mảng users hoặc object có trường users.');
      return;
    }

    try {
      setIsImporting(true);
      const response = await importAdminUsers({
        users: users as Array<{
          email: string;
          fullName: string;
          password: string;
          role?: AppRole;
          avatarUrl?: string;
          phoneNumber?: string;
          school?: string;
          subject?: string;
        }>,
        skipExisting: skipExistingOnImport,
      });
      setLastImportResult(response);
      await loadUsers();
      toast.success(`Import xong: tao ${response.created}, bo qua ${response.skipped}, loi ${response.failed}.`);
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể import users từ JSON.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateImportSample = () => {
    setImportJsonInput(JSON.stringify(adminImportSampleUsers, null, 2));
    toast.success('Đã tạo JSON mẫu import.');
  };

  const handleCopyImportSample = async () => {
    const sampleText = JSON.stringify(adminImportSampleUsers, null, 2);
    try {
      await navigator.clipboard.writeText(sampleText);
      toast.success('Đã copy JSON mẫu vào clipboard.');
    } catch {
      toast.error('Không thể copy tự động, vui lòng dùng Generate để lấy mẫu.');
    }
  };

  const handleChangeUserRole = async (userId: number, role: AppRole) => {
    try {
      setActionLoadingUserId(userId);
      const updated = await updateAdminUserRole(userId, { role });
      applyUserUpdate(updated);
      toast.success('Đã cập nhật quyền tài khoản.');
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        toast.error(error.response.data.message);
      } else {
        toast.error('Không thể cập nhật role.');
      }
    } finally {
      setActionLoadingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Admin Console</p>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Users</h1>
          </div>
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Về dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Danh sách users</h2>
            <span className="text-sm text-slate-500">{pageLabel}</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              id="admin-search-input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo email hoặc tên"
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            <select
              id="admin-role-filter"
              value={roleFilter}
              onChange={(event) => {
                setPage(0);
                setRoleFilter(event.target.value as AppRole | '');
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            >
              <option value="">Tất cả role</option>
              <option value="USER">USER</option>
              <option value="CONTRIBUTOR">CONTRIBUTOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button
              id="admin-search-submit"
              type="submit"
              className="rounded-xl bg-cyan-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Họ và tên</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Lý do / Người thực hiện</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading && (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={6}>Đang tải dữ liệu...</td>
                  </tr>
                )}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={6}>Không có user phù hợp.</td>
                  </tr>
                )}
                {!isLoading && users.map((user) => {
                  let statusActionLabel = 'Mở khóa';
                  if (actionLoadingUserId === user.id) {
                    statusActionLabel = 'Đang xử lý...';
                  } else if (user.status) {
                    statusActionLabel = 'Khóa';
                  }

                  return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3 text-slate-700">{user.fullName}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`role-${user.id}`}
                        value={user.role}
                        onChange={(event) => void handleChangeUserRole(user.id, event.target.value as AppRole)}
                        disabled={actionLoadingUserId === user.id}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 disabled:opacity-60"
                      >
                        <option value="USER">USER</option>
                        <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.status ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {user.status ? 'ACTIVE' : `BANNED`}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-72">
                      <div className="space-y-1.5">
                        <input
                          id={`status-reason-${user.id}`}
                          type="text"
                          value={statusReasonByUserId[user.id] ?? ''}
                          onChange={(event) => setStatusReasonByUserId((previous) => ({
                            ...previous,
                            [user.id]: event.target.value,
                          }))}
                          placeholder={user.status ? 'Lý do khóa tài khoản' : 'Lý do mở khóa tài khoản'}
                          disabled={actionLoadingUserId === user.id}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 disabled:opacity-60"
                        />
                        <p className="text-[11px] text-slate-500 truncate" title={user.statusReason ?? ''}>
                          {user.statusReason ? `Gần nhất: ${user.statusReason}` : 'Chưa có lịch sử trạng thái.'}
                        </p>
                        {user.statusChangedBy && (
                          <p className="text-[11px] text-slate-500 truncate" title={user.statusChangedBy}>
                            Bởi: {user.statusChangedBy}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleUserStatus(user)}
                        disabled={actionLoadingUserId === user.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${user.status ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        {statusActionLabel}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              id="admin-prev-page"
              type="button"
              disabled={page === 0}
              onClick={() => setPage((previous) => Math.max(previous - 1, 0))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600">Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}</span>
            <button
              id="admin-next-page"
              type="button"
              disabled={totalPages === 0 || page + 1 >= totalPages}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-slate-900">Tạo user mới</h2>
          <p className="mb-4 text-sm text-slate-500">Dùng cho trường hợp Admin tạo sẵn tài khoản cho giáo viên.</p>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label htmlFor="admin-create-fullname" className="mb-1 block text-sm font-medium text-slate-700">Họ và tên</label>
              <input
                id="admin-create-fullname"
                name="fullName"
                value={createForm.fullName}
                onChange={handleCreateFormChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>
            <div>
              <label htmlFor="admin-create-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="admin-create-email"
                name="email"
                value={createForm.email}
                onChange={handleCreateFormChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>
            <div>
              <label htmlFor="admin-create-password" className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                id="admin-create-password"
                name="password"
                type="password"
                value={createForm.password}
                onChange={handleCreateFormChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              />
            </div>
            <div>
              <label htmlFor="admin-create-role" className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select
                id="admin-create-role"
                name="role"
                value={createForm.role}
                onChange={handleCreateFormChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              >
                <option value="USER">USER</option>
                <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button
              id="admin-create-submit"
              type="submit"
              disabled={isCreating}
              className="w-full rounded-xl bg-cyan-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70"
            >
              {isCreating ? 'Đang tạo...' : 'Tạo user'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900">Import users bằng JSON</h3>
            <p className="mt-1 text-xs text-slate-500">Dán JSON array users hoặc object có trường users.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                id="admin-import-generate-sample"
                type="button"
                onClick={handleGenerateImportSample}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Generate sample JSON
              </button>
              <button
                id="admin-import-copy-sample"
                type="button"
                onClick={() => void handleCopyImportSample()}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Copy sample JSON
              </button>
            </div>
            <textarea
              id="admin-import-json-input"
              value={importJsonInput}
              onChange={(event) => setImportJsonInput(event.target.value)}
              rows={8}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              placeholder={'[{"email":"teacher@example.com","fullName":"Teacher","password":"strong-pass-123","role":"CONTRIBUTOR"}]'}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600" htmlFor="admin-import-skip-existing">
              <input
                id="admin-import-skip-existing"
                type="checkbox"
                checked={skipExistingOnImport}
                onChange={(event) => setSkipExistingOnImport(event.target.checked)}
              />
              <span>Bỏ qua user đã tồn tại email</span>
            </label>
            <button
              id="admin-import-submit"
              type="button"
              onClick={() => void handleImportUsersJson()}
              disabled={isImporting}
              className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-70"
            >
              {isImporting ? 'Đang import...' : 'Import JSON'}
            </button>
            {lastImportResult && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p>Tổng: {lastImportResult.total} | Tạo mới: {lastImportResult.created} | Bỏ qua: {lastImportResult.skipped} | Lỗi: {lastImportResult.failed}</p>
                {lastImportResult.errors.length > 0 && (
                  <ul className="mt-2 max-h-28 overflow-auto space-y-1 text-[11px] text-rose-600">
                    {lastImportResult.errors.map((errorItem) => (
                      <li key={`${errorItem.index}-${errorItem.email}`}>#{errorItem.index} {errorItem.email}: {errorItem.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;
