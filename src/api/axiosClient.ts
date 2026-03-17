import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

type AuthPayload = {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  role?: string;
};

export type AppRole = 'USER' | 'CONTRIBUTOR' | 'ADMIN';

export type UserProfile = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  school?: string | null;
  subject?: string | null;
  role: AppRole;
  premium: boolean;
};

export type UpdateMyProfilePayload = {
  fullName?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  school?: string | null;
  subject?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export type AdminUserItem = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  school?: string | null;
  subject?: string | null;
  role: AppRole;
  status: boolean;
  statusCode: number;
  statusReason?: string | null;
  statusChangedBy?: string | null;
  createdAt: string;
};

export type AdminUsersPage = {
  content: AdminUserItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

export type FetchAdminUsersParams = {
  page?: number;
  size?: number;
  search?: string;
  role?: AppRole | '';
};

export type CreateAdminUserPayload = {
  email: string;
  fullName: string;
  password: string;
  role?: AppRole;
};

export type UpdateAdminUserStatusPayload = {
  active?: boolean;
  status?: number;
  reason: string;
};

export type UpdateAdminUserRolePayload = {
  role: AppRole;
};

export type ImportAdminUserItemPayload = {
  email: string;
  fullName: string;
  password: string;
  role?: AppRole;
  avatarUrl?: string;
  phoneNumber?: string;
  school?: string;
  subject?: string;
};

export type ImportAdminUsersPayload = {
  users: ImportAdminUserItemPayload[];
  skipExisting?: boolean;
};

export type ImportAdminUsersResponse = {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{
    index: number;
    email: string;
    reason: string;
  }>;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const authApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1/auth';
const publicAuthPaths = new Set([
  '/login',
  '/register',
  '/register/resend-verification',
  '/register/verify-email',
  '/forgot-password',
  '/forgot-password/resend',
  '/forgot-password/verify-otp',
  '/reset-password',
]);
export const AUTH_SESSION_CHANGED_EVENT = 'auth-session-changed';

const notifyAuthSessionChanged = () => {
  globalThis.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};

const axiosClient = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

export const persistAuthSession = (payload: AuthPayload) => {
  localStorage.setItem('access_token', payload.accessToken);
  if (payload.refreshToken) {
    localStorage.setItem('refresh_token', payload.refreshToken);
  }
  if (payload.email) {
    localStorage.setItem('user_email', payload.email);
  }
  if (payload.role) {
    localStorage.setItem('user_role', payload.role);
  }
  notifyAuthSessionChanged();
};

export const clearAuthSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_role');
  notifyAuthSessionChanged();
};

export const getCurrentSessionRole = (): AppRole | null => {
  const role = localStorage.getItem('user_role');
  return role === 'USER' || role === 'CONTRIBUTOR' || role === 'ADMIN' ? role : null;
};

export const fetchCurrentUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosClient.get<UserProfile>('/me');
  return response.data;
};

export const updateCurrentUserProfile = async (payload: UpdateMyProfilePayload): Promise<UserProfile> => {
  const response = await axiosClient.patch<UserProfile>('/me', payload);
  return response.data;
};

export const uploadCurrentUserAvatar = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosClient.post<UserProfile>('/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchAdminUsers = async (params: FetchAdminUsersParams): Promise<AdminUsersPage> => {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 10));
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.role) {
    query.set('role', params.role);
  }

  const response = await axiosClient.get<AdminUsersPage>(`/admin/users?${query.toString()}`);
  return response.data;
};

export const createAdminUser = async (payload: CreateAdminUserPayload): Promise<AdminUserItem> => {
  const response = await axiosClient.post<AdminUserItem>('/admin/users', payload);
  return response.data;
};

export const updateAdminUserStatus = async (
  userId: number,
  payload: UpdateAdminUserStatusPayload,
): Promise<AdminUserItem> => {
  const response = await axiosClient.put<AdminUserItem>(`/admin/users/${userId}/status`, payload);
  return response.data;
};

export const updateAdminUserRole = async (
  userId: number,
  payload: UpdateAdminUserRolePayload,
): Promise<AdminUserItem> => {
  const response = await axiosClient.put<AdminUserItem>(`/admin/users/${userId}/role`, payload);
  return response.data;
};

export const importAdminUsers = async (payload: ImportAdminUsersPayload): Promise<ImportAdminUsersResponse> => {
  const response = await axiosClient.post<ImportAdminUsersResponse>('/admin/users/import-json', payload);
  return response.data;
};

axiosClient.interceptors.request.use((config) => {
  const requestPath = config.url ?? '';
  if (publicAuthPaths.has(requestPath)) {
    return config;
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const requestNewAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  const response = await refreshClient.post('/refresh', { refreshToken });
  const accessToken = response.data?.accessToken as string | undefined;

  if (!accessToken) {
    return null;
  }

  persistAuthSession({
    accessToken,
    refreshToken: response.data?.refreshToken,
    email: response.data?.email,
    role: response.data?.role,
  });

  return accessToken;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= requestNewAccessToken();

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) {
        clearAuthSession();
        throw error;
      }

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      clearAuthSession();
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  },
);

export default axiosClient;