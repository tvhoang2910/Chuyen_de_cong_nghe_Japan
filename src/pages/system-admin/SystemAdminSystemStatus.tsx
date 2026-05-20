import React from "react";
import { Activity, Clock3, Server, ServerCrash, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import ServiceStatusCard from "../../components/system-admin/ServiceStatusCard";
import ServiceStatusTable from "../../components/system-admin/ServiceStatusTable";
import {
  fetchSystemAdminServiceStatus,
  type ServiceStatusFilter,
  type SystemAdminServiceStatusItem,
} from "../../api/systemAdminClient";

const SystemAdminSystemStatus: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<ServiceStatusFilter>("ALL");
  const [services, setServices] = React.useState<
    SystemAdminServiceStatusItem[]
  >([]);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const response = await fetchSystemAdminServiceStatus();
        if (mounted) {
          setServices(response);
        }
      } catch (error) {
        console.error("Failed to load system status", error);
        if (mounted) {
          setServices([]);
          setErrorMessage("Không thể tải trạng thái hệ thống từ backend.");
          toast.error("Không tải được trạng thái hệ thống.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    const intervalId = globalThis.setInterval(() => {
      void load();
    }, 10000);

    return () => {
      mounted = false;
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const filteredServices = React.useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return services.filter((service) => {
      const matchSearch =
        normalizedKeyword.length === 0 ||
        service.name.toLowerCase().includes(normalizedKeyword);

      const matchStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ONLINE"
            ? service.status === "ONLINE"
            : service.status === "OFFLINE";

      return matchSearch && matchStatus;
    });
  }, [searchKeyword, statusFilter, services]);

  const totalServices = services.length;
  const onlineCount = services.filter(
    (service) => service.status === "ONLINE",
  ).length;
  const offlineCount = services.filter(
    (service) => service.status === "OFFLINE",
  ).length;

  const averageResponseMs = React.useMemo(() => {
    const numericTimes = services
      .map((service) => {
        if (!service.responseTime.endsWith("ms")) {
          return null;
        }

        const value = Number.parseInt(
          service.responseTime.replace("ms", ""),
          10,
        );
        return Number.isFinite(value) ? value : null;
      })
      .filter((value): value is number => value !== null);

    if (numericTimes.length === 0) {
      return "N/A";
    }

    const sum = numericTimes.reduce(
      (accumulator, current) => accumulator + current,
      0,
    );
    const average = Math.round(sum / numericTimes.length);
    return `${average}ms`;
  }, [services]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            System Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Trạng thái hệ thống
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi trạng thái hoạt động của các microservice trong hệ thống
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ServiceStatusCard
            title="Tổng services"
            value={isLoading ? "..." : String(totalServices)}
            icon={Server}
            tone="slate"
          />
          <ServiceStatusCard
            title="Đang hoạt động"
            value={isLoading ? "..." : String(onlineCount)}
            icon={Activity}
            tone="emerald"
          />
          <ServiceStatusCard
            title="Ngừng hoạt động"
            value={isLoading ? "..." : String(offlineCount)}
            icon={ServerCrash}
            tone="rose"
          />
          <ServiceStatusCard
            title="Response time trung bình"
            value={isLoading ? "..." : averageResponseMs}
            icon={Clock3}
            tone="cyan"
          />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm theo tên service..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === "ALL"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ONLINE")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === "ONLINE"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                Online
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("OFFLINE")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === "OFFLINE"
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-rose-400 hover:text-rose-700"
                }`}
              >
                Offline
              </button>
            </div>
          </div>
        </section>

        <ServiceStatusTable
          data={filteredServices}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>
    </AdminLayout>
  );
};

export default SystemAdminSystemStatus;
