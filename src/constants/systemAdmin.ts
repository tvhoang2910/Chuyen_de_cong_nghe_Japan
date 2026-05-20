import type { AppRole } from "../api/axiosClient";

export type SystemAdminRole = AppRole;

export const roleLabelMap: Record<SystemAdminRole, string> = {
  USER: "Người dùng",
  CONTRIBUTOR: "Cộng tác viên",
  ADMIN: "Quản trị viên",
  AUDIT: "Kiểm toán",
  SYSTEM_ADMIN: "Quản trị hệ thống",
};

export const roleOptions: Array<{ value: SystemAdminRole; label: string }> = [
  { value: "USER", label: "Người dùng" },
  { value: "CONTRIBUTOR", label: "Cộng tác viên" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "AUDIT", label: "Kiểm toán" },
  { value: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];
