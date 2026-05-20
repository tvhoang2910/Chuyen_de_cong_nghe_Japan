import React, { useCallback, useEffect, useState } from "react";
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
  const [userFilter, setUserFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const p = await fetchPaymentTransactions({
        page: 0,
        size: 50,
        user: userFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setRows(p.content);
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
  }, [userFilter, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quản lý Giao dịch & Phí</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4">
          <div className="flex gap-3 mb-4">
            <input
              className="px-3 py-2 border rounded-xl"
              placeholder="Filter bằng email user"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded-xl"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border rounded-xl"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <button
              onClick={() => void load()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl"
            >
              Lọc
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              Tổng doanh thu
              <br />
              <div className="text-xl font-bold">
                {formatMoney(stats?.totalAmount)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              Số giao dịch
              <br />
              <div className="text-xl font-bold">{rows.length}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-3">ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Số tiền</th>
                  <th className="p-3">Gói premium</th>
                  <th className="p-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center">
                      Đang tải...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center">
                      Không có giao dịch.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-3">{r.id}</td>
                      <td className="p-3">{r.userEmail}</td>
                      <td className="p-3">{formatMoney(r.amount)}</td>
                      <td className="p-3">{r.planName ?? "-"}</td>
                      <td className="p-3">
                        {new Date(r.processedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditPayments;
