import React from 'react';
import { type AdminUserItem, type AppRole } from '../../api/axiosClient';
import {
  BookOpen,
  Lock,
  Mail,
  Pencil,
  Phone,
  School,
  ShieldCheck,
  Trash2,
  Unlock,
  User,
} from 'lucide-react';

interface UserTableProps {
  users: AdminUserItem[];
  isLoading: boolean;
  actionLoadingUserId: number | null;
  statusReasonByUserId: Record<number, string>;
  setStatusReasonByUserId: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onToggleStatus: (user: AdminUserItem) => void;
  onChangeRole: (userId: number, role: AppRole) => void;
  onDelete?: (user: AdminUserItem) => void;
  spotlightUserId?: number | null;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  actionLoadingUserId,
  statusReasonByUserId,
  setStatusReasonByUserId,
  onToggleStatus,
  onChangeRole,
  onDelete,
  spotlightUserId,
}) => {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="w-72 space-y-2">
                <div className="h-3.5 w-44 rounded bg-slate-100" />
                <div className="h-3 w-64 rounded bg-slate-100" />
              </div>
              <div className="ml-auto h-8 w-40 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
          <User className="h-7 w-7 text-slate-300" />
        </div>
        <p className="text-base font-semibold text-slate-900">Không có dữ liệu user phù hợp</p>
        <p className="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1160px] table-fixed text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-[30%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Người dùng</th>
              <th className="w-[20%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin bổ sung</th>
              <th className="w-[14%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Phân quyền</th>
              <th className="w-[24%] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
              <th className="w-[12%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                isSpotlight={spotlightUserId === user.id}
                isActionLoading={actionLoadingUserId === user.id}
                reason={statusReasonByUserId[user.id] ?? ''}
                setReason={(value) => setStatusReasonByUserId((prev) => ({ ...prev, [user.id]: value }))}
                onToggleStatus={() => onToggleStatus(user)}
                onChangeRole={(role) => onChangeRole(user.id, role)}
                onDelete={() => onDelete?.(user)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface UserTableRowProps {
  user: AdminUserItem;
  isActionLoading: boolean;
  isSpotlight: boolean;
  reason: string;
  setReason: (value: string) => void;
  onToggleStatus: () => void;
  onChangeRole: (role: AppRole) => void;
  onDelete: () => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isActionLoading,
  isSpotlight,
  reason,
  setReason,
  onToggleStatus,
  onChangeRole,
  onDelete,
}) => {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = React.useState(false);

  const joinedDate = new Date(user.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <tr className={`align-top transition ${isSpotlight ? 'bg-cyan-50/50' : 'bg-white'} hover:bg-slate-50/70`}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-500">{user.fullName.charAt(0)}</span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold text-slate-900" title={user.fullName}>{user.fullName}</p>
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={user.email}>{user.email}</span>
            </div>
            <p className="text-[11px] text-slate-500">ID #{user.id} · Gia nhập {joinedDate}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-center gap-1.5">
            <School className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title={user.school ?? undefined}>{user.school?.trim() || '-'}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title={user.subject ?? undefined}>{user.subject?.trim() || '-'}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title={user.phoneNumber ?? undefined}>{user.phoneNumber?.trim() || '-'}</span>
          </li>
        </ul>
      </td>

      <td className="px-4 py-3">{getRoleBadge(user.role)}</td>

      <td className="px-4 py-3">
        <div className="space-y-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              user.status
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {user.status ? 'Đang hoạt động' : 'Đã khóa'}
          </span>

          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={user.status ? 'Nhập lý do khóa tài khoản' : 'Nhập lý do mở khóa'}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="line-clamp-2 text-[11px] text-slate-500">{user.statusReason?.trim() || '-'}</p>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <div className="relative" onMouseLeave={() => setIsRoleMenuOpen(false)}>
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen((prev) => !prev)}
              disabled={isActionLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-40"
              title="Sửa phân quyền"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {(['USER', 'CONTRIBUTOR'] as AppRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setIsRoleMenuOpen(false);
                      if (role !== user.role) {
                        onChangeRole(role);
                      }
                    }}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs font-medium transition ${
                      user.role === role
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {toRoleLabel(role)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleStatus}
            disabled={isActionLoading}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-40 ${
              user.status
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400'
            }`}
            title={user.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          >
            {user.status ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isActionLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-40"
            title="Xóa tài khoản"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

function toRoleLabel(role: AppRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Quản trị';
    case 'CONTRIBUTOR':
      return 'Giáo viên';
    case 'AUDIT':
      return 'Kiểm toán';
    case 'SYSTEM_ADMIN':
      return 'Quản trị hệ thống';
    case 'ADMIN':
      return 'Quản trị';
    default:
      return 'Học sinh';
  }
}

function getRoleBadge(role: AppRole) {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Quản trị
        </span>
      );
    case 'CONTRIBUTOR':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Giáo viên
        </span>
      );
    case 'AUDIT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Kiểm toán
        </span>
      );
    case 'SYSTEM_ADMIN':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Quản trị hệ thống
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <User className="h-3.5 w-3.5" />
          Học sinh
        </span>
      );
  }
}

export default UserTable;

