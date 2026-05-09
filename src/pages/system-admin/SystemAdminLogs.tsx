import React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { SeverityBadge } from "../../components/system-admin/SystemAdminBadges";
import {
  fetchSystemAdminLogs,
  type SystemAdminLogAction,
  type SystemAdminLogItem,
  type SystemAdminLogSeverity,
} from "../../api/systemAdminClient";

const PAGE_SIZE = 10;

const actionOptions: Array<{
  value: "ALL" | SystemAdminLogAction | string;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả hành động" },
  { value: "LOGIN", label: "Đăng nhập" },
  { value: "LOGOUT", label: "Đăng xuất" },
  { value: "REFRESH_TOKEN", label: "Làm mới token" },
  { value: "LOCK_USER", label: "Khóa tài khoản" },
  { value: "UNLOCK_USER", label: "Mở khóa tài khoản" },
  { value: "CHANGE_ROLE", label: "Đổi vai trò" },
];

const outcomeOptions = [
  { value: "ALL", label: "Tất cả kết quả" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILURE", label: "Thất bại" },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN");

const SystemAdminLogs: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<"ALL" | string>("ALL");
  const [outcomeFilter, setOutcomeFilter] = React.useState<"ALL" | string>(
    "ALL",
  );
  const [page, setPage] = React.useState(0);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [logsPage, setLogsPage] = React.useState({
    content: [] as SystemAdminLogItem[],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: PAGE_SIZE,
    first: true,
    last: true,
  });

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSystemAdminLogs({
          page,
          size: PAGE_SIZE,
          search: searchKeyword,
          action: actionFilter === "ALL" ? undefined : actionFilter,
          outcome: outcomeFilter === "ALL" ? undefined : outcomeFilter,
        });

        if (mounted) {
          setLogsPage(response);
        }
      } catch (error) {
        console.error("Failed to load system-admin logs", error);
        toast.error("Không tải được nhật ký hệ thống.");
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
  }, [page, searchKeyword, actionFilter, outcomeFilter, refreshTick]);

  const visiblePages = React.useMemo(() => {
    const maxPages = Math.max(logsPage.totalPages, 1);
    const windowSize = 5;
    const start = Math.max(0, Math.min(page - 2, maxPages - windowSize));
    return Array.from(
      { length: Math.min(windowSize, maxPages) },
      (_, index) => start + index,
    );
  }, [page, logsPage.totalPages]);

  const currentStart = logsPage.totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const currentEnd = Math.min(logsPage.totalElements, (page + 1) * PAGE_SIZE);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearchKeyword(searchInput);
    setRefreshTick((value) => value + 1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            System Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Nhật ký hệ thống
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi hành vi hệ thống và lịch sử thao tác quản trị.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]"
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo hành động, người thực hiện, đối tượng..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(0);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={outcomeFilter}
              onChange={(event) => {
                setOutcomeFilter(event.target.value);
                setPage(0);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            >
              {outcomeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Áp dụng
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Hành động</th>
                  <th className="p-3">Người thực hiện</th>
                  <th className="p-3">Đối tượng tác động</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Đang tải nhật ký hệ thống...
                    </td>
                  </tr>
                ) : logsPage.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Không có bản ghi phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  logsPage.content.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">
                          {log.action}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {log.description}
                        </p>
                      </td>
                      <td className="p-3 text-slate-600">{log.actor}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">
                          {log.target}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {log.targetType}
                        </p>
                      </td>
                      <td className="p-3 text-slate-600">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="p-3">
                        <SeverityBadge
                          severity={log.severity as SystemAdminLogSeverity}
                        />
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
                {logsPage.totalElements}
              </span>{" "}
              bản ghi
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
                disabled={page + 1 >= logsPage.totalPages || isLoading}
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, logsPage.totalPages - 1),
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default SystemAdminLogs;
