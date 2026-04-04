import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import {
  fetchAuditLogs,
  fetchAuditLogStats,
  fetchAuditActionTypes,
  type AuditLogPage,
  type AuditLogFilters,
  type AuditLogStats,
} from '@/api/auditLog';

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  REFRESH: 'Làm mới token',
  FORGOT_PASSWORD: 'Quên mật khẩu',
  VERIFY_OTP: 'Xác minh OTP reset',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  VERIFY_EMAIL: 'Xác minh email',
  UPDATE_PROFILE: 'Cập nhật hồ sơ',
  UPLOAD_AVATAR: 'Upload avatar',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogPage | null>(null);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLabels, setActionLabels] = useState<Record<string, string>>(ACTION_LABELS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, statsData, actionsData] = await Promise.all([
        fetchAuditLogs(filters, page, 20),
        fetchAuditLogStats(),
        fetchAuditActionTypes(),
      ]);
      setLogs(logsData);
      setStats(statsData);
      setActionLabels((prev) => ({ ...prev, ...actionsData }));
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setFilters({
      email: (fd.get('email') as string) || undefined,
      action: (fd.get('action') as string) || undefined,
      outcome: (fd.get('outcome') as string) || undefined,
      fromDate: (fd.get('fromDate') as string) || undefined,
      toDate: (fd.get('toDate') as string) || undefined,
    });
    setPage(0);
  };

  const getActionLabel = (action: string) => actionLabels[action] ?? action;

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký bảo mật</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi các hoạt động đăng nhập, đăng xuất và thay đổi tài khoản.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-700">{stats.failedLoginsToday.toLocaleString()}</p>
                <p className="text-xs text-rose-500 font-medium">Đăng nhập thất bại hôm nay</p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {stats.successfulLoginsToday.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-500 font-medium">Đăng nhập thành công hôm nay</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
          <input
            name="email"
            type="text"
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-600/20 outline-none"
          />
        </div>
        <div className="w-44">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Hành động</label>
          <select
            name="action"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-600/20 outline-none bg-white"
          >
            <option value="">Tất cả</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Kết quả</label>
          <select
            name="outcome"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-600/20 outline-none bg-white"
          >
            <option value="">Tất cả</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILURE">Thất bại</option>
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Từ ngày</label>
          <input
            name="fromDate"
            type="datetime-local"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-600/20 outline-none"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Đến ngày</label>
          <input
            name="toDate"
            type="datetime-local"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-600/20 outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Tìm kiếm
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({});
            setPage(0);
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl"
        >
          Reset
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs?.content.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium">Không có bản ghi nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Thời gian</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Hành động</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Kết quả</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">IP</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs?.content.map((log) => (
                  <tr
                    key={log.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      log.outcome === 'FAILURE' ? 'bg-rose-50/50' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {log.email ?? <span className="text-slate-400 italic">anonymous</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {log.outcome === 'SUCCESS' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {log.outcome === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate"
                      title={log.details ?? ''}
                    >
                      {log.details ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {logs && logs.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Trang {logs.number + 1} / {logs.totalPages} — {logs.totalElements.toLocaleString()} bản ghi
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {logs.number + 1} / {logs.totalPages}
              </span>
              <button
                disabled={page >= logs.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
