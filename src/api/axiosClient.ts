import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

type AuthPayload = {
  accessToken: string;
  refreshToken?: string;
  email?: string;
};

export type UserProfile = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  premium: boolean;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const authApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1/auth';
const publicAuthPaths = new Set([
  '/login',
  '/register',
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
  notifyAuthSessionChanged();
};

export const clearAuthSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  notifyAuthSessionChanged();
};

export const fetchCurrentUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosClient.get<UserProfile>('/me');
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