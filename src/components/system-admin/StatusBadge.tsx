import React from "react";
import type { ServiceRuntimeStatus } from "../../api/systemAdminClient";

interface StatusBadgeProps {
  status: ServiceRuntimeStatus;
}

const statusLabelMap: Record<ServiceRuntimeStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

const statusClassMap: Record<ServiceRuntimeStatus, string> = {
  ONLINE: "bg-emerald-100 text-emerald-700",
  OFFLINE: "bg-rose-100 text-rose-700",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[status]}`}
    >
      {statusLabelMap[status]}
    </span>
  );
};

export default StatusBadge;
