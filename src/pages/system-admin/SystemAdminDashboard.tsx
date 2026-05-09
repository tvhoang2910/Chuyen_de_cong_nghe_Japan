import React from "react";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Users,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { ServiceStatusBadge } from "../../components/system-admin/SystemAdminBadges";
import { serviceHealthMock } from "../../mock/systemAdminMock";
import {
  fetchSystemAdminDashboard,
  fetchSystemAdminLogs,
  type SystemAdminDashboard,
  type SystemAdminLogItem,
} from "../../api/systemAdminClient";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN");

const SystemAdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [dashboard, setDashboard] = React.useState<SystemAdminDashboard | null>(
    null,
  );
  const [recentLogs, setRecentLogs] = React.useState<SystemAdminLogItem[]>([]);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [dashboardResponse, logsResponse] = await Promise.all([
          fetchSystemAdminDashboard(),
          fetchSystemAdminLogs({ page: 0, size: 6 }),
        ]);

        if (mounted) {
          setDashboard(dashboardResponse);
          setRecentLogs(logsResponse.content);
        }
      } catch (error) {
        console.error("Failed to load system-admin dashboard", error);
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
  }, []);

  const totalUsers = dashboard?.totalUsers ?? 0;
  const totalAdmins = dashboard?.totalAdmins ?? 0;
  const lockedUsers = dashboard?.lockedUsers ?? 0;
  const failedLoginCount = dashboard?.failedLoginAttempts ?? 0;

  const recentActivities = recentLogs.slice(0, 5).map((log) => ({
    id: String(log.id),
    title:
      log.action === "LOCK_USER"
        ? "Khóa tài khoản"
        : log.action === "UNLOCK_USER"
          ? "Mở khóa tài khoản"
          : log.action === "CHANGE_ROLE"
            ? "Đổi vai trò người dùng"
            : log.action === "LOGIN"
              ? "Đăng nhập hệ thống"
              : log.action,
    actor: log.actor,
    createdAt: log.createdAt,
    status:
      log.severity === "ERROR"
        ? "THẤT_BẠI"
        : log.severity === "WARNING"
          ? "CẢNH_BÁO"
          : "THÀNH_CÔNG",
  }));

  const activityStatusClass = (
    status: (typeof recentActivities)[number]["status"],
  ) => {
    if (status === "THÀNH_CÔNG") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "CẢNH_BÁO") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-rose-100 text-rose-700";
  };

  const activityStatusLabel = (
    status: (typeof recentActivities)[number]["status"],
  ) => {
    if (status === "THÀNH_CÔNG") {
      return "Thành công";
    }
    if (status === "CẢNH_BÁO") {
      return "Cảnh báo";
    }
    return "Thất bại";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            System Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Dashboard kỹ thuật
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi nhanh sức khỏe hệ thống, người dùng và sự kiện vận hành.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            title="Tổng người dùng"
            value={isLoading ? "..." : totalUsers.toLocaleString("vi-VN")}
            tone="slate"
          />
          <StatCard
            icon={ShieldCheck}
            title="Tổng quản trị viên"
            value={isLoading ? "..." : totalAdmins.toLocaleString("vi-VN")}
            tone="cyan"
          />
          <StatCard
            icon={ShieldX}
            title="Tài khoản bị khóa"
            value={isLoading ? "..." : lockedUsers.toLocaleString("vi-VN")}
            tone="rose"
          />
          <StatCard
            icon={AlertTriangle}
            title="Đăng nhập thất bại"
            value={isLoading ? "..." : failedLoginCount.toLocaleString("vi-VN")}
            tone="amber"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Hoạt động gần đây
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                24 giờ gần nhất
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="p-3">Hoạt động</th>
                    <th className="p-3">Người thực hiện</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        Đang tải hoạt động...
                      </td>
                    </tr>
                  ) : recentActivities.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        Chưa có hoạt động gần đây.
                      </td>
                    </tr>
                  ) : (
                    recentActivities.map((activity) => (
                      <tr key={activity.id} className="border-t">
                        <td className="p-3 font-semibold text-slate-900">
                          {activity.title}
                        </td>
                        <td className="p-3 text-slate-600">{activity.actor}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${activityStatusClass(
                              activity.status,
                            )}`}
                          >
                            {activityStatusLabel(activity.status)}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {formatDateTime(activity.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Nhật ký hệ thống gần đây
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Đồng bộ từ backend
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="p-3">Hành động</th>
                    <th className="p-3">Đối tượng</th>
                    <th className="p-3">Mức độ</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        Đang tải nhật ký...
                      </td>
                    </tr>
                  ) : recentLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-slate-500"
                      >
                        Không có nhật ký phù hợp.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="p-3 font-semibold text-slate-900">
                          {log.action}
                        </td>
                        <td className="p-3 text-slate-600">{log.target}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              log.severity === "INFO"
                                ? "bg-cyan-100 text-cyan-700"
                                : log.severity === "WARNING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Trạng thái hệ thống
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {serviceHealthMock.map((service) => (
              <div
                key={service.serviceName}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {service.serviceName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Cập nhật: {formatDateTime(service.lastCheckedAt)}
                </p>
                <div className="mt-3">
                  <ServiceStatusBadge status={service.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "slate" | "cyan" | "rose" | "amber";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  tone,
}) => {
  const toneClass: Record<StatCardProps["tone"], string> = {
    slate: "bg-slate-100 text-slate-700",
    cyan: "bg-cyan-100 text-cyan-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span className={`rounded-xl p-2 ${toneClass[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default SystemAdminDashboard;
