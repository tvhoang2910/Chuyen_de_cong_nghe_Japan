import axiosClient, {
  type AdminUserItem,
  type AdminUsersPage,
  type AppRole,
} from "./axiosClient";

export type SystemAdminUserStatus = "ACTIVE" | "LOCKED";

export type SystemAdminUser = Omit<AdminUserItem, "status"> & {
  status: SystemAdminUserStatus;
  department: string;
};

export type SystemAdminUsersPage = {
  content: SystemAdminUser[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type SystemAdminLogSeverity = "INFO" | "WARNING" | "ERROR";

export type SystemAdminLogAction =
  | "LOGIN"
  | "LOGOUT"
  | "REFRESH_TOKEN"
  | "FORGOT_PASSWORD"
  | "VERIFY_RESET_OTP"
  | "VERIFY_REGISTER_EMAIL"
  | "RESET_PASSWORD"
  | "UPDATE_PROFILE"
  | "UPLOAD_AVATAR"
  | "LOCK_USER"
  | "UNLOCK_USER"
  | "CHANGE_ROLE";

export type SystemAdminLogItem = {
  id: number;
  action: SystemAdminLogAction | string;
  actor: string;
  target: string;
  targetType: string;
  severity: SystemAdminLogSeverity;
  createdAt: string;
  description: string;
};

export type SystemAdminLogPage = {
  content: SystemAdminLogItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type SystemAdminDashboard = {
  totalUsers: number;
  totalAdmins: number;
  lockedUsers: number;
  failedLoginAttempts: number;
};

export type ServiceRuntimeStatus = "ONLINE" | "DOWN";

export type ServiceStatusFilter = "ALL" | "ONLINE" | "OFFLINE";

export type SystemAdminServiceStatusItem = {
  id: number;
  name: string;
  status: ServiceRuntimeStatus;
  port: number;
  heartbeat: string;
  responseTime: string;
  updatedAt: string;
};

const normalizeDepartment = (user: AdminUserItem): string => {
  return user.school?.trim() || user.subject?.trim() || "Không xác định";
};

const normalizeStatus = (
  status: AdminUserItem["status"],
): SystemAdminUserStatus => {
  return status ? "ACTIVE" : "LOCKED";
};

const mapUser = (user: AdminUserItem): SystemAdminUser => ({
  ...user,
  status: normalizeStatus(user.status),
  department: normalizeDepartment(user),
});

export const fetchSystemAdminUsers = async (params: {
  page?: number;
  size?: number;
  search?: string;
  role?: AppRole | "";
  status?: SystemAdminUserStatus | "";
}): Promise<SystemAdminUsersPage> => {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 10));
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.role) {
    query.set("role", params.role);
  }
  if (params.status) {
    query.set("status", params.status);
  }

  const response = await axiosClient.get<AdminUsersPage>(
    `/system-admin/users?${query.toString()}`,
  );
  return {
    ...response.data,
    first: response.data.number === 0,
    last: response.data.number + 1 >= response.data.totalPages,
    content: response.data.content.map(mapUser),
  };
};

export const fetchSystemAdminUser = async (
  userId: number,
): Promise<SystemAdminUser> => {
  const response = await axiosClient.get<AdminUserItem>(
    `/system-admin/users/${userId}`,
  );
  return mapUser(response.data);
};

export const lockSystemAdminUser = async (
  userId: number,
): Promise<SystemAdminUser> => {
  const response = await axiosClient.put<AdminUserItem>(
    `/system-admin/users/${userId}/lock`,
  );
  return mapUser(response.data);
};

export const unlockSystemAdminUser = async (
  userId: number,
): Promise<SystemAdminUser> => {
  const response = await axiosClient.put<AdminUserItem>(
    `/system-admin/users/${userId}/unlock`,
  );
  return mapUser(response.data);
};

export const updateSystemAdminUserRole = async (
  userId: number,
  payload: { role: AppRole },
): Promise<SystemAdminUser> => {
  const response = await axiosClient.put<AdminUserItem>(
    `/system-admin/users/${userId}/role`,
    payload,
  );
  return mapUser(response.data);
};

export const fetchSystemAdminLogs = async (params: {
  page?: number;
  size?: number;
  search?: string;
  action?: string;
  outcome?: string;
}): Promise<SystemAdminLogPage> => {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 10));
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.action?.trim()) {
    query.set("action", params.action.trim());
  }
  if (params.outcome?.trim()) {
    query.set("outcome", params.outcome.trim());
  }

  const response = await axiosClient.get<SystemAdminLogPage>(
    `/system-admin/logs?${query.toString()}`,
  );
  return response.data;
};

export const fetchSystemAdminDashboard =
  async (): Promise<SystemAdminDashboard> => {
    const response = await axiosClient.get<SystemAdminDashboard>(
      "/system-admin/dashboard",
    );
    return response.data;
  };

export const fetchSystemAdminServiceStatus = async (): Promise<
  SystemAdminServiceStatusItem[]
> => {
  const response = await axiosClient.get<SystemAdminServiceStatusItem[]>(
    "/system-admin/system-status",
  );
  return response.data;
};
