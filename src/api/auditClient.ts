import axiosClient from "./axiosClient";

export type VipRequestItem = {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  planId?: number;
  planName?: string;
  purchasedPrice?: number;
  billImageUrl?: string | null;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  promoCode?: string | null;
  trial?: boolean;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  createdAt: string;
};

export type VipRequestPage = {
  content: VipRequestItem[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
};

export const fetchVipRequests = async (
  page = 0,
  size = 20,
  status = "PENDING_REVIEW",
): Promise<VipRequestPage> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("status", status);
  const res = await axiosClient.get<VipRequestPage>(
    `/audit/vip/requests?${params.toString()}`,
  );
  return res.data;
};

export const approveVipRequest = async (
  id: number,
  payload?: { reviewNote?: string },
) => {
  const res = await axiosClient.patch(
    `/audit/vip/requests/${id}/approve`,
    payload || {},
  );
  return res.data;
};

export const rejectVipRequest = async (
  id: number,
  payload?: { reviewNote?: string },
) => {
  const res = await axiosClient.patch(
    `/audit/vip/requests/${id}/reject`,
    payload || {},
  );
  return res.data;
};

export const fetchVipRequestHistory = async (id: number) => {
  const res = await axiosClient.get(`/audit/vip/requests/${id}/history`);
  return res.data;
};

export const fetchVipRequestBill = async (
  subscriptionId: number,
): Promise<Blob> => {
  const res = await axiosClient.get(
    `/subscriptions/purchase-requests/${subscriptionId}/bill`,
    {
      responseType: "blob",
    },
  );
  return res.data as Blob;
};

export type AuditLogItem = {
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string | null;
  targetId: number | null;
  targetName: string | null;
  targetEmail: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string | null;
};

export type AuditLogPage = {
  content: AuditLogItem[];
  totalPages: number;
  totalElements: number;
};

export const fetchAuditLogs = async (params: {
  page?: number;
  size?: number;
  action?: string;
  userId?: number;
}) => {
  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("size", String(size));
  if (params.action) q.set("action", params.action);
  if (typeof params.userId === "number") q.set("userId", String(params.userId));
  const res = await axiosClient.get<AuditLogPage>(
    `/audit/logs?${q.toString()}`,
  );
  return res.data;
};

// Payments
export type PaymentTransaction = {
  id: number;
  userId: number;
  userEmail: string;
  planName?: string | null;
  amount: number;
  fee: number;
  processedAt: string;
  metadata?: Record<string, unknown> | null;
};

export type PaymentPage = {
  content: PaymentTransaction[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
};

export const fetchPaymentTransactions = async (params: {
  page?: number;
  size?: number;
  user?: string;
  from?: string;
  to?: string;
}) => {
  const page = params.page ?? 0;
  const size = params.size ?? 20;
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("size", String(size));
  if (params.user) q.set("user", params.user);

  const toIso = (d?: string, endOfDay = false) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d; // fallback to raw value
    if (endOfDay) dt.setHours(23, 59, 59, 999);
    return dt.toISOString();
  };

  if (params.from) {
    const v = toIso(params.from, false);
    if (v) q.set("from", v);
  }
  if (params.to) {
    const v = toIso(params.to, true);
    if (v) q.set("to", v);
  }
  const res = await axiosClient.get<PaymentPage>(
    `/audit/payments/transactions?${q.toString()}`,
  );
  return res.data;
};

export type PaymentStats = {
  totalAmount: number;
  totalFee: number;
  count: number;
};

export const fetchPaymentStats = async (params?: {
  user?: string;
  from?: string;
  to?: string;
}) => {
  const q = new URLSearchParams();
  const toIso = (d?: string, endOfDay = false) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    if (endOfDay) dt.setHours(23, 59, 59, 999);
    return dt.toISOString();
  };
  if (params?.from) {
    const v = toIso(params.from, false);
    if (v) q.set("from", v);
  }
  if (params?.user) q.set("user", params.user);
  if (params?.to) {
    const v = toIso(params.to, true);
    if (v) q.set("to", v);
  }
  const res = await axiosClient.get<PaymentStats>(
    `/audit/payments/stats?${q.toString()}`,
  );
  return res.data;
};

export const calculatePaymentFee = async (payload: { amount: number }) => {
  const res = await axiosClient.post(`/audit/payments/calculate`, payload);
  return res.data;
};

export default {};
