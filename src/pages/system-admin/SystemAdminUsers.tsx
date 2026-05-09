import React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import {
  RoleBadge,
  UserStatusBadge,
} from "../../components/system-admin/SystemAdminBadges";
import SystemAdminDialog from "../../components/system-admin/SystemAdminDialog";
import { roleOptions, type SystemAdminRole } from "../../mock/systemAdminMock";
import {
  fetchSystemAdminUser,
  fetchSystemAdminUsers,
  lockSystemAdminUser,
  unlockSystemAdminUser,
  updateSystemAdminUserRole,
  type SystemAdminUser,
  type SystemAdminUserStatus,
} from "../../api/systemAdminClient";

const PAGE_SIZE = 8;

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("vi-VN");
};

const resolveAvatarUrl = (user: SystemAdminUser) => {
  return (
    user.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0f172a&color=fff`
  );
};

const SystemAdminUsers: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"ALL" | SystemAdminRole>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | SystemAdminUserStatus
  >("ALL");
  const [page, setPage] = React.useState(0);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const [usersPage, setUsersPage] = React.useState({
    content: [] as SystemAdminUser[],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: PAGE_SIZE,
    first: true,
    last: true,
  });

  const [selectedUser, setSelectedUser] =
    React.useState<SystemAdminUser | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [roleDialogUser, setRoleDialogUser] =
    React.useState<SystemAdminUser | null>(null);
  const [roleDraft, setRoleDraft] = React.useState<SystemAdminRole>("USER");
  const [confirmUser, setConfirmUser] = React.useState<SystemAdminUser | null>(
    null,
  );

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSystemAdminUsers({
          page,
          size: PAGE_SIZE,
          search: searchKeyword,
          role: roleFilter === "ALL" ? "" : roleFilter,
          status: statusFilter === "ALL" ? "" : statusFilter,
        });

        if (mounted) {
          setUsersPage(response);
        }
      } catch (error) {
        console.error("Failed to load system-admin users", error);
        toast.error("Không tải được danh sách người dùng.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [page, roleFilter, statusFilter, searchKeyword, refreshTick]);

  const totalPages = Math.max(1, usersPage.totalPages || 0);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const visiblePages = React.useMemo(() => {
    const windowSize = 5;
    const start = Math.max(0, Math.min(page - 2, totalPages - windowSize));

    return Array.from(
      { length: Math.min(windowSize, totalPages) },
      (_, index) => start + index,
    );
  }, [page, totalPages]);

  const currentStart = usersPage.totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const currentEnd = Math.min(usersPage.totalElements, (page + 1) * PAGE_SIZE);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearchKeyword(searchInput);
  };

  const openRoleDialog = (user: SystemAdminUser) => {
    setRoleDialogUser(user);
    setRoleDraft(user.role);
  };

  const saveRoleChange = async () => {
    if (!roleDialogUser) {
      return;
    }

    try {
      await updateSystemAdminUserRole(roleDialogUser.id, { role: roleDraft });
      toast.success("Đã cập nhật vai trò người dùng.");
      setRoleDialogUser(null);
      setRefreshTick((value) => value + 1);
    } catch (error) {
      console.error("Failed to update user role", error);
      toast.error("Không cập nhật được vai trò.");
    }
  };

  const toggleUserStatus = async () => {
    if (!confirmUser) {
      return;
    }

    try {
      if (confirmUser.status === "ACTIVE") {
        await lockSystemAdminUser(confirmUser.id);
      } else {
        await unlockSystemAdminUser(confirmUser.id);
      }

      toast.success(
        confirmUser.status === "ACTIVE"
          ? "Đã khóa tài khoản."
          : "Đã mở khóa tài khoản.",
      );
      setConfirmUser(null);
      setRefreshTick((value) => value + 1);
    } catch (error) {
      console.error("Failed to toggle user status", error);
      toast.error("Không cập nhật được trạng thái tài khoản.");
    }
  };

  const openUserDetails = async (user: SystemAdminUser) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const freshUser = await fetchSystemAdminUser(user.id);
      setSelectedUser(freshUser);
    } catch (error) {
      console.error("Failed to load user details", error);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            System Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Quản lý người dùng & phân quyền
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản trị tài khoản toàn hệ thống với thao tác khóa, mở khóa và đổi
            vai trò.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 xl:flex-row xl:items-center"
          >
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo họ tên hoặc email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as "ALL" | SystemAdminRole);
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">Tất cả vai trò</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as "ALL" | SystemAdminUserStatus,
                  );
                  setPage(0);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
              </select>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Ảnh đại diện</th>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Ngày tạo</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Đang tải danh sách người dùng...
                    </td>
                  </tr>
                ) : usersPage.content.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  usersPage.content.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <td className="p-3">
                        <img
                          src={resolveAvatarUrl(user)}
                          alt={user.fullName}
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                        />
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {user.fullName}
                      </td>
                      <td className="p-3 text-slate-600">{user.email}</td>
                      <td className="p-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="p-3">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="p-3 text-slate-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void openUserDetails(user)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => openRoleDialog(user)}
                            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-400"
                          >
                            Đổi vai trò
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmUser(user)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
                              user.status === "ACTIVE"
                                ? "bg-rose-600 hover:bg-rose-500"
                                : "bg-emerald-600 hover:bg-emerald-500"
                            }`}
                          >
                            {user.status === "ACTIVE"
                              ? "Khóa tài khoản"
                              : "Mở khóa tài khoản"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">
                {currentStart}
              </span>
              -
              <span className="font-semibold text-slate-900">{currentEnd}</span>{" "}
              /{" "}
              <span className="font-semibold text-slate-900">
                {usersPage.totalElements}
              </span>{" "}
              người dùng
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
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
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  }`}
                >
                  {pageNumber + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={page + 1 >= totalPages || isLoading}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages - 1))
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <SystemAdminDialog
        title="Chi tiết người dùng"
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser ? (
          <div className="space-y-3 text-sm text-slate-700">
            {detailLoading ? (
              <p className="text-slate-500">Đang tải chi tiết người dùng...</p>
            ) : null}
            <div className="flex items-center gap-3">
              <img
                src={resolveAvatarUrl(selectedUser)}
                alt={selectedUser.fullName}
                className="h-14 w-14 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <p className="font-bold text-slate-900">
                  {selectedUser.fullName}
                </p>
                <p className="text-slate-500">{selectedUser.email}</p>
              </div>
            </div>
            <InfoRow
              label="Vai trò"
              value={<RoleBadge role={selectedUser.role} />}
            />
            <InfoRow
              label="Trạng thái"
              value={<UserStatusBadge status={selectedUser.status} />}
            />
            <InfoRow label="Phòng ban" value={selectedUser.department} />
            <InfoRow label="Số điện thoại" value={selectedUser.phoneNumber} />
            <InfoRow label="School" value={selectedUser.school ?? "-"} />
            <InfoRow label="Subject" value={selectedUser.subject ?? "-"} />
            <InfoRow
              label="Ngày tạo"
              value={formatDate(selectedUser.createdAt)}
            />
          </div>
        ) : null}
      </SystemAdminDialog>

      <SystemAdminDialog
        title="Đổi vai trò người dùng"
        isOpen={roleDialogUser !== null}
        onClose={() => setRoleDialogUser(null)}
      >
        {roleDialogUser ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Chọn vai trò mới cho{" "}
              <span className="font-semibold text-slate-900">
                {roleDialogUser.fullName}
              </span>
              .
            </p>
            <select
              value={roleDraft}
              onChange={(event) =>
                setRoleDraft(event.target.value as SystemAdminRole)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoleDialogUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void saveRoleChange()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Lưu vai trò
              </button>
            </div>
          </div>
        ) : null}
      </SystemAdminDialog>

      <SystemAdminDialog
        title={
          confirmUser?.status === "ACTIVE"
            ? "Xác nhận khóa tài khoản"
            : "Xác nhận mở khóa tài khoản"
        }
        isOpen={confirmUser !== null}
        onClose={() => setConfirmUser(null)}
      >
        {confirmUser ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn
              {confirmUser.status === "ACTIVE" ? " khóa " : " mở khóa "}
              tài khoản{" "}
              <span className="font-semibold text-slate-900">
                {confirmUser.fullName}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void toggleUserStatus()}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  confirmUser.status === "ACTIVE"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {confirmUser.status === "ACTIVE"
                  ? "Khóa tài khoản"
                  : "Mở khóa tài khoản"}
              </button>
            </div>
          </div>
        ) : null}
      </SystemAdminDialog>
    </AdminLayout>
  );
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
};

export default SystemAdminUsers;
