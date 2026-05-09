import React from "react";
import type {
  ServiceHealthItem,
  SystemAdminRole,
  SystemAdminUserStatus,
  SystemLogSeverity,
} from "../../mock/systemAdminMock";
import { roleLabelMap } from "../../mock/systemAdminMock";

interface RoleBadgeProps {
  role: SystemAdminRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const classes: Record<SystemAdminRole, string> = {
    USER: "bg-slate-100 text-slate-700",
    CONTRIBUTOR: "bg-cyan-100 text-cyan-700",
    ADMIN: "bg-rose-100 text-rose-700",
    AUDIT: "bg-amber-100 text-amber-700",
    SYSTEM_ADMIN: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[role]}`}
    >
      {roleLabelMap[role]}
    </span>
  );
};

interface UserStatusBadgeProps {
  status: SystemAdminUserStatus;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
  return status === "ACTIVE" ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      Đang hoạt động
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      Đã khóa
    </span>
  );
};

interface SeverityBadgeProps {
  severity: SystemLogSeverity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const labelMap: Record<SystemLogSeverity, string> = {
    INFO: "Thông tin",
    WARNING: "Cảnh báo",
    ERROR: "Lỗi",
  };

  const classes: Record<SystemLogSeverity, string> = {
    INFO: "bg-cyan-100 text-cyan-700",
    WARNING: "bg-amber-100 text-amber-700",
    ERROR: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[severity]}`}
    >
      {labelMap[severity]}
    </span>
  );
};

interface ServiceStatusBadgeProps {
  status: ServiceHealthItem["status"];
}

export const ServiceStatusBadge: React.FC<ServiceStatusBadgeProps> = ({
  status,
}) => {
  return status === "Hoạt động" ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      Hoạt động
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
      Ngừng hoạt động
    </span>
  );
};
