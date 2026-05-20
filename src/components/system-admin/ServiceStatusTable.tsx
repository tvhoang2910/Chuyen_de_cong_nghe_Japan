import React from "react";
import type { SystemAdminServiceStatusItem } from "../../api/systemAdminClient";
import StatusBadge from "./StatusBadge";

interface ServiceStatusTableProps {
  data: SystemAdminServiceStatusItem[];
  isLoading: boolean;
  errorMessage: string | null;
}

const ServiceStatusTable: React.FC<ServiceStatusTableProps> = ({
  data,
  isLoading,
  errorMessage,
}) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Service</th>
              <th className="p-3">Status</th>
              <th className="p-3">Port</th>
              <th className="p-3">Last heartbeat</th>
              <th className="p-3">Response time</th>
              <th className="p-3">Updated at</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Đang tải trạng thái service...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-rose-600">
                  {errorMessage}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Không có dữ liệu trạng thái service.
                </td>
              </tr>
            ) : (
              data.map((service) => (
                <tr
                  key={service.id}
                  className="border-t transition hover:bg-slate-50"
                >
                  <td className="p-3 font-semibold text-slate-900">
                    {service.name}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={service.status} />
                  </td>
                  <td className="p-3 text-slate-600">{service.port}</td>
                  <td className="p-3 text-slate-600">{service.heartbeat}</td>
                  <td className="p-3 text-slate-600">{service.responseTime}</td>
                  <td className="p-3 text-slate-600">{service.updatedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ServiceStatusTable;
