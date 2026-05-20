import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coins, Filter } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import {
  fetchPaymentTransactions,
  fetchPaymentStats,
  type PaymentTransaction,
} from "../../api/auditClient";

const formatMoney = (v?: number) =>
  `${Number(v ?? 0).toLocaleString("vi-VN")}đ`;

const AuditPayments: React.FC = () => {
  const [rows, setRows] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<{
    totalAmount?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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
      const p = await fetchPaymentTransactions({
        page,
        size: 10,
        user: userFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setRows(p.content);
      setTotalPages(p.totalPages ?? 0);
      setTotalElements(p.totalElements ?? 0);
      const s = await fetchPaymentStats({
        user: userFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setStats(s);
    } catch (err) {
      toast.error("Không tải được dữ liệu giao dịch.");
    } finally {
      setIsLoading(false);
    }
  }, [page, userFilter, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Audit Dashboard
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Quản lý Giao dịch & Phí
              </h1>
              <p className="text-sm text-slate-600">
                Theo dõi dòng tiền và lịch sử giao dịch đã xử lý.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </div>
              <input
                className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                placeholder="Lọc theo email"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <button
                onClick={() => {
                  setPage(0);
                  void load();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-500 hover:to-blue-500"
              >
                <Coins className="h-4 w-4" />
                Lọc giao dịch
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                Tổng doanh thu
              </p>
              <div className="mt-2 text-2xl font-semibold">
                {formatMoney(stats?.totalAmount)}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Đã tổng hợp theo bộ lọc hiện tại
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Số giao dịch
              </p>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {totalElements}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Giao dịch đã hoàn tất xử lý
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="text-left">
                  <th className="p-3">ID</th>
                  <th className="p-3">Người dùng</th>
                  <th className="p-3">Số tiền</th>
                  <th className="p-3">Gói Premium</th>
                  <th className="p-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Không có giao dịch.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <td className="p-3 font-semibold text-slate-900">
                        #{r.id}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">
                          {r.userEmail}
                        </div>
                        <div className="text-xs text-slate-500">
                          User ID: {r.userId}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-emerald-600">
                        {formatMoney(r.amount)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {r.planName ?? "-"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(r.processedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 mt-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold text-slate-900">
                  {totalElements === 0 ? 0 : page * 10 + 1}
                </span>
                -
                <span className="font-semibold text-slate-900">
                  {Math.min(totalElements, (page + 1) * 10)}
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

export default AuditPayments;
