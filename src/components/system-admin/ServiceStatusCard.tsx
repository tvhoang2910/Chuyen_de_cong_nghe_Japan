import React from "react";
import type { LucideIcon } from "lucide-react";

interface ServiceStatusCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: "slate" | "emerald" | "rose" | "cyan";
}

const toneClassMap: Record<ServiceStatusCardProps["tone"], string> = {
  slate: "bg-slate-100 text-slate-700",
  emerald: "bg-emerald-100 text-emerald-700",
  rose: "bg-rose-100 text-rose-700",
  cyan: "bg-cyan-100 text-cyan-700",
};

const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({
  title,
  value,
  icon: Icon,
  tone,
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span className={`rounded-xl p-2 ${toneClassMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default ServiceStatusCard;
