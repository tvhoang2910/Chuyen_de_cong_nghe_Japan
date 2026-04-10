import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

type AuthPayload = {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  role?: string;
};

type AuthTokenApiResponse = {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  role?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

export type AppRole = "USER" | "CONTRIBUTOR" | "ADMIN";

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
  role?: AppRole | "";
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

export type PremiumPlanSummary = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  lifetime: boolean;
  description?: string | null;
  active: boolean;
};

export type CreatePremiumPlanPayload = {
  name: string;
  price: number;
  durationDays?: number;
  lifetime?: boolean;
  description?: string;
  active?: boolean;
};

export type SubscriptionStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type UserSubscriptionQueueItem = {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  planId: number;
  planName: string;
  purchasedPrice: number;
  status: SubscriptionStatus;
  billImageUrl: string;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  promoCode?: string | null;
  trial: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type SubscriptionQueuePage = {
  content: UserSubscriptionQueueItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type SubscriptionApprovalAudit = {
  id: number;
  subscriptionId: number;
  reviewerId: number;
  reviewerEmail: string;
  reviewerRole: AppRole;
  decision: "APPROVED" | "REJECTED";
  previousStatus: SubscriptionStatus;
  newStatus: SubscriptionStatus;
  reviewNote?: string | null;
  reviewedAt: string;
  notificationDispatched: boolean;
  sourceChannel: string;
};

export type CreateSubscriptionPurchaseRequestPayload = {
  planId: number;
  paymentMethod?: string;
  transactionRef?: string;
  promoCode?: string;
  trial?: boolean;
  bill: File;
};

export type ReviewSubscriptionRequestPayload = {
  approved: boolean;
  reviewNote?: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRecovery?: boolean;
};

const authApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1/auth";
const publicAuthPaths = new Set([
  "/login",
  "/register",
  "/register/resend-verification",
  "/register/verify-email",
  "/oauth2/exchange",
  "/forgot-password",
  "/forgot-password/resend",
  "/forgot-password/verify-otp",
  "/reset-password",
]);
export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";
export const SUBSCRIPTION_REVIEW_UPDATED_EVENT = "subscription-review-updated";
const USER_FULL_NAME_STORAGE_KEY = "user_full_name";

const notifyAuthSessionChanged = () => {
  globalThis.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};

const cacheCurrentUserDisplayName = (profile: UserProfile) => {
  if (profile.fullName.trim().length > 0) {
    localStorage.setItem(USER_FULL_NAME_STORAGE_KEY, profile.fullName);
    return;
  }

  localStorage.removeItem(USER_FULL_NAME_STORAGE_KEY);
};

const axiosClient = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: authApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

const DEFAULT_GET_CACHE_TTL_MS = Number(
  import.meta.env.VITE_GET_CACHE_TTL_MS ?? 5000,
);
const responseCache = new Map<string, CacheEntry<unknown>>();
const inflightGetRequests = new Map<string, Promise<unknown>>();

const getCached = <T>(cacheKey: string): T | null => {
  const entry = responseCache.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (Date.now() >= entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }
  return entry.data as T;
};

const setCached = <T>(
  cacheKey: string,
  data: T,
  ttlMs = DEFAULT_GET_CACHE_TTL_MS,
) => {
  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

const invalidateCacheByPrefix = (prefix: string) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
};

const clearAllApiCache = () => {
  responseCache.clear();
  inflightGetRequests.clear();
};

const withCachedGet = async <T>(
  cacheKey: string,
  loader: () => Promise<T>,
  ttlMs = DEFAULT_GET_CACHE_TTL_MS,
): Promise<T> => {
  const cached = getCached<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Race-condition guard: check-then-set must be atomic relative to the event
  // loop, so we do them back-to-back. If two calls race past the cache check
  // simultaneously, the second one sees the in-flight entry and waits on it
  // instead of firing a duplicate loader.
  if (inflightGetRequests.has(cacheKey)) {
    return inflightGetRequests.get(cacheKey) as Promise<T>;
  }

  let resolvePromise: (data: T) => void;
  let rejectPromise: (err: unknown) => void;
  const request = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  inflightGetRequests.set(cacheKey, request as Promise<unknown>);

  loader()
    .then((data) => {
      setCached(cacheKey, data, ttlMs);
      resolvePromise(data);
    })
    .catch((err) => {
      rejectPromise(err);
    })
    .finally(() => {
      inflightGetRequests.delete(cacheKey);
    });

  return request;
};

export const exchangeOAuth2Code = async (code: string): Promise<AuthPayload> => {
  const response = await axiosClient.post<AuthTokenApiResponse>(
    '/oauth2/exchange',
    { code },
    { _skipAuthRecovery: true } as RetryableRequestConfig,
  );

  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    email: response.data.email,
    role: response.data.role,
  };
};

export const persistAuthSession = (payload: AuthPayload) => {
  localStorage.setItem("access_token", payload.accessToken);
  if (payload.refreshToken) {
    localStorage.setItem("refresh_token", payload.refreshToken);
  }
  if (payload.email) {
    localStorage.setItem("user_email", payload.email);
  }
  if (payload.role) {
    localStorage.setItem("user_role", payload.role);
  }
  localStorage.removeItem(USER_FULL_NAME_STORAGE_KEY);
  notifyAuthSessionChanged();
};

export const clearAuthSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_role");
  localStorage.removeItem(USER_FULL_NAME_STORAGE_KEY);
  clearAllApiCache();
  notifyAuthSessionChanged();
};

export const notifySubscriptionReviewUpdated = () => {
  globalThis.dispatchEvent(new Event(SUBSCRIPTION_REVIEW_UPDATED_EVENT));
};

export const getCurrentSessionRole = (): AppRole | null => {
  const role = localStorage.getItem("user_role");
  return role === "USER" || role === "CONTRIBUTOR" || role === "ADMIN"
    ? role
    : null;
};

export const fetchCurrentUserProfile = async (): Promise<UserProfile> => {
  return withCachedGet<UserProfile>(
    "profile:me",
    async () => {
      const response = await axiosClient.get<UserProfile>("/me");
      cacheCurrentUserDisplayName(response.data);
      return response.data;
    },
    3000,
  );
};

export const updateCurrentUserProfile = async (
  payload: UpdateMyProfilePayload,
): Promise<UserProfile> => {
  const response = await axiosClient.patch<UserProfile>("/me", payload);
  cacheCurrentUserDisplayName(response.data);
  setCached("profile:me", response.data, 3000);
  return response.data;
};

export const uploadCurrentUserAvatar = async (
  file: File,
): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosClient.post<UserProfile>("/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  cacheCurrentUserDisplayName(response.data);
  setCached("profile:me", response.data, 3000);
  return response.data;
};

export const fetchAdminUsers = async (
  params: FetchAdminUsersParams,
): Promise<AdminUsersPage> => {
  const query = new URLSearchParams();
  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const search = params.search?.trim() ?? "";
  const role = params.role ?? "";

  query.set("page", String(page));
  query.set("size", String(size));
  if (search) {
    query.set("search", search);
  }
  if (role) {
    query.set("role", role);
  }

  const cacheKey = `admin:users:${page}:${size}:${search}:${role}`;
  return withCachedGet<AdminUsersPage>(
    cacheKey,
    async () => {
      const response = await axiosClient.get<AdminUsersPage>(
        `/admin/users?${query.toString()}`,
        { _skipAuthRecovery: true } as RetryableRequestConfig,
      );
      return response.data;
    },
    2000,
  );
};

export const createAdminUser = async (
  payload: CreateAdminUserPayload,
): Promise<AdminUserItem> => {
  const response = await axiosClient.post<AdminUserItem>(
    "/admin/users",
    payload,
  );
  invalidateCacheByPrefix("admin:users:");
  return response.data;
};

export const updateAdminUserStatus = async (
  userId: number,
  payload: UpdateAdminUserStatusPayload,
): Promise<AdminUserItem> => {
  const response = await axiosClient.put<AdminUserItem>(
    `/admin/users/${userId}/status`,
    payload,
  );
  invalidateCacheByPrefix("admin:users:");
  return response.data;
};

export const updateAdminUserRole = async (
  userId: number,
  payload: UpdateAdminUserRolePayload,
): Promise<AdminUserItem> => {
  const response = await axiosClient.put<AdminUserItem>(
    `/admin/users/${userId}/role`,
    payload,
  );
  invalidateCacheByPrefix("admin:users:");
  return response.data;
};

export const importAdminUsers = async (
  payload: ImportAdminUsersPayload,
): Promise<ImportAdminUsersResponse> => {
  const response = await axiosClient.post<ImportAdminUsersResponse>(
    "/admin/users/import-json",
    payload,
  );
  invalidateCacheByPrefix("admin:users:");
  return response.data;
};

export const fetchPremiumPlans = async (): Promise<PremiumPlanSummary[]> => {
  return withCachedGet<PremiumPlanSummary[]>(
    "subscription:plans:active",
    async () => {
      const response = await axiosClient.get<PremiumPlanSummary[]>(
        "/subscriptions/plans",
      );
      return response.data;
    },
  );
};

export const fetchManagedPremiumPlans = async (): Promise<
  PremiumPlanSummary[]
> => {
  return withCachedGet<PremiumPlanSummary[]>(
    "subscription:plans:manage",
    async () => {
      const response = await axiosClient.get<PremiumPlanSummary[]>(
        "/subscriptions/plans/manage",
      );
      return response.data;
    },
  );
};

export const createPremiumPlan = async (
  payload: CreatePremiumPlanPayload,
): Promise<PremiumPlanSummary> => {
  const response = await axiosClient.post<PremiumPlanSummary>(
    "/subscriptions/plans",
    payload,
  );
  invalidateCacheByPrefix("subscription:plans:");
  return response.data;
};

export const createSubscriptionPurchaseRequest = async (
  payload: CreateSubscriptionPurchaseRequestPayload,
): Promise<UserSubscriptionQueueItem> => {
  const formData = new FormData();
  formData.append("planId", String(payload.planId));
  formData.append("bill", payload.bill);
  if (payload.paymentMethod?.trim()) {
    formData.append("paymentMethod", payload.paymentMethod.trim());
  }
  if (payload.transactionRef?.trim()) {
    formData.append("transactionRef", payload.transactionRef.trim());
  }
  if (payload.promoCode?.trim()) {
    formData.append("promoCode", payload.promoCode.trim());
  }
  if (typeof payload.trial === "boolean") {
    formData.append("trial", String(payload.trial));
  }

  const response = await axiosClient.post<UserSubscriptionQueueItem>(
    "/subscriptions/purchase-requests",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  invalidateCacheByPrefix("subscription:my-requests");
  invalidateCacheByPrefix("subscription:review-queue:");
  return response.data;
};

export const fetchMySubscriptionRequests = async (): Promise<
  UserSubscriptionQueueItem[]
> => {
  return withCachedGet<UserSubscriptionQueueItem[]>(
    "subscription:my-requests",
    async () => {
      const response = await axiosClient.get<UserSubscriptionQueueItem[]>(
        "/subscriptions/my-requests",
        { _skipAuthRecovery: true } as RetryableRequestConfig,
      );
      return response.data;
    },
  );
};

export const fetchSubscriptionReviewQueue = async (
  page = 0,
  size = 10,
  status: SubscriptionStatus = "PENDING_REVIEW",
): Promise<SubscriptionQueuePage> => {
  const cacheKey = `subscription:review-queue:${status}:${page}:${size}`;
  return withCachedGet<SubscriptionQueuePage>(
    cacheKey,
    async () => {
      const query = new URLSearchParams();
      query.set("page", String(page));
      query.set("size", String(size));
      query.set("status", status);

      const response = await axiosClient.get<SubscriptionQueuePage>(
        `/subscriptions/review-queue?${query.toString()}`,
        { _skipAuthRecovery: true } as RetryableRequestConfig,
      );
      return response.data;
    },
    2500,
  );
};

export const fetchPendingSubscriptionReviewCount =
  async (): Promise<number> => {
    const page = await fetchSubscriptionReviewQueue(0, 1, "PENDING_REVIEW");
    return page.totalElements;
  };

export const reviewSubscriptionPurchaseRequest = async (
  subscriptionId: number,
  payload: ReviewSubscriptionRequestPayload,
): Promise<UserSubscriptionQueueItem> => {
  const response = await axiosClient.patch<UserSubscriptionQueueItem>(
    `/subscriptions/purchase-requests/${subscriptionId}/review`,
    payload,
  );
  invalidateCacheByPrefix("subscription:review-queue:");
  invalidateCacheByPrefix("subscription:my-requests");
  return response.data;
};

export const fetchSubscriptionApprovalAudits = async (
  subscriptionId: number,
): Promise<SubscriptionApprovalAudit[]> => {
  const response = await axiosClient.get<SubscriptionApprovalAudit[]>(
    `/subscriptions/purchase-requests/${subscriptionId}/approvals`,
  );
  return response.data;
};

axiosClient.interceptors.request.use((config) => {
  const requestPath = config.url ?? "";
  if (publicAuthPaths.has(requestPath)) {
    return config;
  }

  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const requestNewAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }

  const response = await refreshClient.post("/refresh", { refreshToken });
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

    if (originalRequest?._skipAuthRecovery && status === 401) {
      throw error;
    }

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
