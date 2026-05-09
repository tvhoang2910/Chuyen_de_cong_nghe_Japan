import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import AuditLogTable from "../../components/audit/AuditLogTable";
import { fetchAuditLogs, type AuditLogItem } from "../../api/auditClient";

const PAGE_SIZE = 10;

const actionOptions = [
  { label: "Tất cả", value: "" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Từ chối", value: "REJECTED" },
  { label: "Hoàn tiền", value: "REFUND" },
];

const AuditLogPage: React.FC = () => {
  const [rows, setRows] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [actionFilter, setActionFilter] = useState("");

  const visiblePages = useMemo(() => {
    const maxPages = Math.max(totalPages, 1);
    const windowSize = 5;
    const start = Math.max(0, Math.min(page - 2, maxPages - windowSize));
    return Array.from(
      { length: Math.min(windowSize, maxPages) },
      (_, i) => start + i,
    );
  }, [page, totalPages]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchAuditLogs({
        page,
        size: PAGE_SIZE,
        action: actionFilter || undefined,
      });
      setRows(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error("Failed to load audit logs", err);
      toast.error("Không tải được nhật ký hệ thống.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleActionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(event.target.value);
    setPage(0);
  };

  const currentStart = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const currentEnd = Math.min(totalElements, (page + 1) * PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nhật ký hệ thống</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <select
              className="px-3 py-2 border rounded-xl bg-white"
              value={actionFilter}
              onChange={handleActionChange}
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <AuditLogTable rows={rows} isLoading={isLoading} />

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 mt-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {currentStart}
                </span>
                -
                <span className="font-semibold text-slate-900">
                  {currentEnd}
                </span>{" "}
                /{" "}
                <span className="font-semibold text-slate-900">
                  {totalElements}
                </span>{" "}
                bản ghi
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
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
                    setPage((prev) => Math.min(prev + 1, totalPages - 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogPage;
