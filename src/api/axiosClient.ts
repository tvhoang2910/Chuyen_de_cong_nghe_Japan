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

export type AppRole =
  | "USER"
  | "CONTRIBUTOR"
  | "ADMIN"
  | "AUDIT"
  | "SYSTEM_ADMIN";

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

export type UpdatePremiumPlanPayload = CreatePremiumPlanPayload;

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

export type SubscriptionHistoryItem = {
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
  cancellationReason?: string | null;
  cancelledByEmail?: string | null;
  cancelledAt?: string | null;
  refundedAmount?: number | null;
};

export type SubscriptionHistoryPage = {
  content: SubscriptionHistoryItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type FetchSubscriptionHistoryParams = {
  search?: string;
  status?: SubscriptionStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type CancelSubscriptionPayload = {
  reason: string;
};

export type CancelSubscriptionResult = {
  subscriptionId: number;
  previousStatus: SubscriptionStatus;
  currentStatus: SubscriptionStatus;
  reason: string;
  refundPolicy: string;
  refundRate: number;
  refundAmount: number;
  cancelledAt: string;
};

export type SubscriptionAnalyticsOverview = {
  monthlyRevenue: number;
  activePremiumCount: number;
  topPlanName?: string | null;
  topPlanSubscriptions: number;
  generatedAt: string;
};

export type NotificationPreference = {
  emailEnabled: boolean;
  webPushEnabled: boolean;
};

export type UserNotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type UserNotificationPage = {
  content: UserNotificationItem[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  unreadCount: number;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRecovery?: boolean;
};

const publicAuthPaths = new Set([
  "/login",
  "/refresh",
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
const ACCESS_TOKEN_COOKIE_KEY = "access_token";
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const setAccessTokenCookie = (token: string) => {
  if (!globalThis.document) {
    return;
  }

  const secureAttribute =
    globalThis.location?.protocol === "https:" ? "; Secure" : "";
  globalThis.document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=${token}; Path=/; Max-Age=${ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureAttribute}`;
};

const clearAccessTokenCookie = () => {
  if (!globalThis.document) {
    return;
  }
  globalThis.document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

const syncAccessTokenCookieFromStorage = () => {
  const token = localStorage.getItem("access_token");
  if (token) {
    setAccessTokenCookie(token);
  }
};

syncAccessTokenCookieFromStorage();

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

const DEFAULT_AUTH_BASE = "/api/v1/auth";

const axiosClient = axios.create({
  baseURL: DEFAULT_AUTH_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: DEFAULT_AUTH_BASE,
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
const MAX_GET_CACHE_ENTRIES = Number(
  import.meta.env.VITE_GET_CACHE_MAX_ENTRIES ?? 200,
);
const responseCache = new Map<string, CacheEntry<unknown>>();
const inflightGetRequests = new Map<string, Promise<unknown>>();

const evictCacheIfNeeded = () => {
  if (responseCache.size < MAX_GET_CACHE_ENTRIES) {
    return;
  }

  const removeCount = Math.max(1, Math.floor(MAX_GET_CACHE_ENTRIES * 0.2));
  let removed = 0;
  for (const key of responseCache.keys()) {
    responseCache.delete(key);
    removed += 1;
    if (removed >= removeCount) {
      break;
    }
  }
};

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
  evictCacheIfNeeded();
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

export const exchangeOAuth2Code = async (
  code: string,
): Promise<AuthPayload> => {
  const response = await axiosClient.post<AuthTokenApiResponse>(
    "/oauth2/exchange",
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
  setAccessTokenCookie(payload.accessToken);
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
  const timerPrefix = "exam_bank_study_timer_v2:";
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(timerPrefix)) {
      keysToRemove.push(key);
    }
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_role");
  localStorage.removeItem(USER_FULL_NAME_STORAGE_KEY);
  clearAccessTokenCookie();
  localStorage.removeItem("exam_bank_study_timer_v1");
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  clearAllApiCache();
  notifyAuthSessionChanged();
};

export const notifySubscriptionReviewUpdated = () => {
  globalThis.dispatchEvent(new Event(SUBSCRIPTION_REVIEW_UPDATED_EVENT));
};

export const getCurrentSessionRole = (): AppRole | null => {
  const role = localStorage.getItem("user_role");
  return role === "USER" ||
    role === "CONTRIBUTOR" ||
    role === "ADMIN" ||
    role === "AUDIT" ||
    role === "SYSTEM_ADMIN"
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

export const fetchManagedPremiumPlans = async (params?: {
  search?: string;
  active?: boolean;
}): Promise<PremiumPlanSummary[]> => {
  const search = params?.search?.trim() ?? "";
  const active =
    typeof params?.active === "boolean" ? String(params.active) : "";
  const query = new URLSearchParams();
  if (search) {
    query.set("search", search);
  }
  if (active) {
    query.set("active", active);
  }
  const queryString = query.toString();

  return withCachedGet<PremiumPlanSummary[]>(
    `subscription:plans:manage:${search}:${active}`,
    async () => {
      const response = await axiosClient.get<PremiumPlanSummary[]>(
        queryString
          ? `/subscriptions/plans/manage?${queryString}`
          : "/subscriptions/plans/manage",
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

export const updatePremiumPlan = async (
  planId: number,
  payload: UpdatePremiumPlanPayload,
): Promise<PremiumPlanSummary> => {
  const response = await axiosClient.put<PremiumPlanSummary>(
    `/subscriptions/plans/${planId}`,
    payload,
  );
  invalidateCacheByPrefix("subscription:plans:");
  return response.data;
};

export const deletePremiumPlan = async (planId: number): Promise<void> => {
  await axiosClient.delete(`/subscriptions/plans/${planId}`);
  invalidateCacheByPrefix("subscription:plans:");
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

export const fetchSubscriptionHistory = async (
  params: FetchSubscriptionHistoryParams = {},
): Promise<SubscriptionHistoryPage> => {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const sort = params.sort?.trim() || "createdAt,desc";
  const search = params.search?.trim() || "";
  const status = params.status || "";
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("size", String(size));
  query.set("sort", sort);
  if (search) {
    query.set("search", search);
  }
  if (status) {
    query.set("status", status);
  }
  if (from) {
    query.set("from", from);
  }
  if (to) {
    query.set("to", to);
  }

  const cacheKey = `subscription:history:${page}:${size}:${sort}:${search}:${status}:${from}:${to}`;
  return withCachedGet<SubscriptionHistoryPage>(
    cacheKey,
    async () => {
      const response = await axiosClient.get<SubscriptionHistoryPage>(
        `/subscriptions/history?${query.toString()}`,
      );
      return response.data;
    },
    2500,
  );
};

export const cancelSubscriptionByAdmin = async (
  subscriptionId: number,
  payload: CancelSubscriptionPayload,
): Promise<CancelSubscriptionResult> => {
  const response = await axiosClient.patch<CancelSubscriptionResult>(
    `/subscriptions/${subscriptionId}/cancel`,
    payload,
  );
  invalidateCacheByPrefix("subscription:history:");
  invalidateCacheByPrefix("subscription:analytics:");
  invalidateCacheByPrefix("subscription:review-queue:");
  invalidateCacheByPrefix("subscription:my-requests");
  return response.data;
};

export const fetchSubscriptionAnalyticsOverview =
  async (): Promise<SubscriptionAnalyticsOverview> => {
    return withCachedGet<SubscriptionAnalyticsOverview>(
      "subscription:analytics:overview",
      async () => {
        const response = await axiosClient.get<SubscriptionAnalyticsOverview>(
          "/subscriptions/analytics/overview",
        );
        return response.data;
      },
      3000,
    );
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

export const fetchSubscriptionBillImage = async (
  subscriptionId: number,
): Promise<Blob> => {
  const response = await axiosClient.get<Blob>(
    `/subscriptions/purchase-requests/${subscriptionId}/bill`,
    {
      responseType: "blob",
    },
  );
  return response.data;
};

export const fetchNotificationPreferences =
  async (): Promise<NotificationPreference> => {
    return withCachedGet<NotificationPreference>(
      "notification:center:preferences",
      async () => {
        const response = await axiosClient.get<NotificationPreference>(
          "/notifications/preferences",
        );
        return response.data;
      },
      1500,
    );
  };

export const updateNotificationPreferences = async (
  payload: Partial<NotificationPreference>,
): Promise<NotificationPreference> => {
  const response = await axiosClient.patch<NotificationPreference>(
    "/notifications/preferences",
    payload,
  );
  setCached("notification:center:preferences", response.data, 1500);
  return response.data;
};

export const fetchUserNotifications = async (
  page = 0,
  size = 20,
): Promise<UserNotificationPage> => {
  const cacheKey = `notification:center:list:${page}:${size}`;
  return withCachedGet<UserNotificationPage>(
    cacheKey,
    async () => {
      const response = await axiosClient.get<UserNotificationPage>(
        `/notifications?page=${page}&size=${size}`,
      );
      return response.data;
    },
    1000,
  );
};

export const markUserNotificationRead = async (
  notificationId: number,
): Promise<UserNotificationItem> => {
  const response = await axiosClient.patch<UserNotificationItem>(
    `/notifications/${notificationId}/read`,
  );
  invalidateCacheByPrefix("notification:center:list:");
  return response.data;
};

export const markAllUserNotificationsRead = async (): Promise<number> => {
  const response = await axiosClient.patch<{ updatedCount: number }>(
    "/notifications/read-all",
  );
  invalidateCacheByPrefix("notification:center:list:");
  return response.data.updatedCount;
};

axiosClient.interceptors.request.use((config) => {
  const requestPath = config.url ?? "";
  if (publicAuthPaths.has(requestPath)) {
    return config;
  }

  // Always attach Authorization header when we have an access token in storage.
  // Token expiry/refresh is handled by the response interceptor (401 -> refresh).
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
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
      clearAuthSession();
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
