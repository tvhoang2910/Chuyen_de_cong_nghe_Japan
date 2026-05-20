import React from "react";
import { type AuditLogItem } from "../../api/auditClient";

interface AuditLogTableProps {
  rows: AuditLogItem[];
  isLoading: boolean;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const actionBadgeClass = (action?: string | null) => {
  if (action === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (action === "REJECTED") return "bg-rose-100 text-rose-700";
  if (action === "REFUND") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-600";
};

const actionLabel = (action?: string | null) => {
  if (action === "APPROVED") return "Đã duyệt";
  if (action === "REJECTED") return "Từ chối";
  if (action === "REFUND") return "Hoàn tiền";
  return action ?? "-";
};

const formatChange = (oldValue?: string | null, newValue?: string | null) => {
  const before = oldValue?.trim() ? oldValue : "-";
  const after = newValue?.trim() ? newValue : "-";
  return `${before} → ${after}`;
};

const AuditLogTable: React.FC<AuditLogTableProps> = ({ rows, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Đang tải...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="p-3">Người thực hiện</th>
            <th className="p-3">Hành động</th>
            <th className="p-3">Khách hàng</th>
            <th className="p-3">Thay đổi</th>
            <th className="p-3">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.createdAt ?? "unknown"}-${index}`}
              className="border-t"
            >
              <td className="p-3">
                <div className="font-semibold text-slate-900">
                  {row.userName || row.userEmail || row.userId || "-"}
                </div>
                {row.userEmail ? (
                  <div className="text-xs text-slate-500">{row.userEmail}</div>
                ) : null}
              </td>
              <td className="p-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${actionBadgeClass(
                    row.action,
                  )}`}
                >
                  {actionLabel(row.action)}
                </span>
              </td>
              <td className="p-3">
                <div className="font-semibold text-slate-900">
                  {row.targetName || row.targetEmail || row.targetId || "-"}
                </div>
                {row.targetEmail ? (
                  <div className="text-xs text-slate-500">
                    {row.targetEmail}
                  </div>
                ) : null}
                {row.targetId ? (
                  <div className="text-xs text-slate-500">
                    ID: {row.targetId}
                  </div>
                ) : null}
              </td>
              <td className="p-3">
                {formatChange(row.oldValue, row.newValue)}
              </td>
              <td className="p-3">{formatDateTime(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
