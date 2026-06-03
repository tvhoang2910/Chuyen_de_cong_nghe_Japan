import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { BarChart3, CheckCheck, Eye, MailCheck, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import MainLayout from '../components/MainLayout';
import {
  cancelSubscriptionByAdmin,
  fetchSubscriptionAnalyticsOverview,
  fetchSubscriptionBillImage,
  fetchSubscriptionHistory,
  fetchSubscriptionApprovalAudits,
  notifySubscriptionReviewUpdated,
  fetchSubscriptionReviewQueue,
  reviewSubscriptionPurchaseRequest,
  type SubscriptionAnalyticsOverview,
  type SubscriptionHistoryItem,
  type SubscriptionHistoryPage,
  type SubscriptionStatus,
  type SubscriptionApprovalAudit,
  type UserSubscriptionQueueItem,
} from '../api/axiosClient';
import { formatSubscriptionStatus } from '../utils/statusLabels';

type SubscriptionReviewQueueProps = {
  mode: 'admin' | 'audit' | 'contributor';
};

type HistoryFilters = {
  search: string;
  status: SubscriptionStatus | '';
  from: string;
  to: string;
};

const EMPTY_HISTORY_FILTERS: HistoryFilters = {
  search: '',
  status: '',
  from: '',
  to: '',
};

const formatMoney = (amount: number | null | undefined): string => {
  return `${Number(amount ?? 0).toLocaleString('vi-VN')}đ`;
};

const statusBadgeClass = (status: SubscriptionStatus): string => {
  if (status === 'APPROVED') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === 'PENDING_REVIEW') {
    return 'bg-amber-100 text-amber-700';
  }
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return 'bg-rose-100 text-rose-700';
  }
  if (status === 'EXPIRED') {
    return 'bg-slate-200 text-slate-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const SubscriptionReviewQueue: React.FC<SubscriptionReviewQueueProps> = ({ mode }) => {
  const isAdminMode = mode === 'admin';
  const isAuditMode = mode === 'audit';
  const canViewHistory = isAdminMode || isAuditMode;
  const canManageRequests = isAdminMode || isAuditMode;
  const [rows, setRows] = useState<UserSubscriptionQueueItem[]>([]);
  const [selected, setSelected] = useState<UserSubscriptionQueueItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus>('PENDING_REVIEW');
  const [audits, setAudits] = useState<SubscriptionApprovalAudit[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [analytics, setAnalytics] = useState<SubscriptionAnalyticsOverview | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const [history, setHistory] = useState<SubscriptionHistoryPage | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [historyFilterDraft, setHistoryFilterDraft] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [historyPageIndex, setHistoryPageIndex] = useState(0);
  const historyPageSize = 10;

  const [cancelTarget, setCancelTarget] = useState<SubscriptionHistoryItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [billPreviewTarget, setBillPreviewTarget] = useState<{ id: number; label: string } | null>(null);
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);
  const [isBillPreviewLoading, setIsBillPreviewLoading] = useState(false);

  const Layout = useMemo(() => (mode === 'contributor' ? MainLayout : AdminLayout), [mode]);

  const loadQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchSubscriptionReviewQueue(0, 20, statusFilter);
      setRows(response.content);
      setSelected((current) => response.content.find((item) => item.id === current?.id) ?? response.content[0] ?? null);
    } catch {
      toast.error('Không thể tải hàng chờ duyệt.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const loadAudits = async () => {
      if (!selected) {
        setAudits([]);
        return;
      }
      try {
        const response = await fetchSubscriptionApprovalAudits(selected.id);
        setAudits(response);
      } catch {
        setAudits([]);
      }
    };
    void loadAudits();
  }, [selected]);

  const requestAnalytics = useCallback(async () => {
    if (!isAdminMode) {
      return;
    }
    try {
      setIsAnalyticsLoading(true);
      const response = await fetchSubscriptionAnalyticsOverview();
      setAnalytics(response);
    } catch {
      toast.error('Không thể tải analytics subscription.');
      setAnalytics(null);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [isAdminMode]);

  const requestHistory = useCallback(
    async (filters: HistoryFilters, page: number) => {
      if (!canViewHistory) {
        return;
      }
      try {
        setIsHistoryLoading(true);
        const response = await fetchSubscriptionHistory({
          search: filters.search || undefined,
          status: filters.status || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page,
          size: historyPageSize,
          sort: 'createdAt,desc',
        });
        setHistory(response);
      } catch {
        toast.error('Không thể tải lịch sử subscription.');
        setHistory(null);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [canViewHistory, historyPageSize],
  );

  useEffect(() => {
    if (!isAdminMode) {
      return;
    }
    void requestAnalytics();
  }, [isAdminMode, requestAnalytics]);

  useEffect(() => {
    if (!canViewHistory) {
      return;
    }
    void requestHistory(historyFilters, historyPageIndex);
  }, [canViewHistory, historyFilters, historyPageIndex, requestHistory]);

  const handleReview = async (approved: boolean) => {
    if (!selected || !canManageRequests) {
      return;
    }
    try {
      setIsSubmitting(true);
      await reviewSubscriptionPurchaseRequest(selected.id, {
        approved,
        reviewNote,
      });
      toast.success(approved ? 'Đã duyệt yêu cầu và gửi thông báo cho user.' : 'Đã từ chối yêu cầu và gửi thông báo cho user.');
      notifySubscriptionReviewUpdated();
      setReviewNote('');
      await loadQueue();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Xử lý duyệt thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyHistoryFilters = () => {
    setHistoryPageIndex(0);
    setHistoryFilters(historyFilterDraft);
  };

  const handleCloseBillPreview = useCallback(() => {
    setBillPreviewTarget(null);
    setIsBillPreviewLoading(false);
    setBillPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  }, []);

  const handleOpenBillPreview = async (subscriptionId: number, label: string) => {
    setBillPreviewTarget({ id: subscriptionId, label });
    setIsBillPreviewLoading(true);
    setBillPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });

    try {
      const blob = await fetchSubscriptionBillImage(subscriptionId);
      const objectUrl = URL.createObjectURL(blob);
      setBillPreviewUrl(objectUrl);
    } catch {
      toast.error('Không thể tải bill chuyển khoản.');
      setBillPreviewTarget(null);
    } finally {
      setIsBillPreviewLoading(false);
    }
  };

  const handleResetHistoryFilters = () => {
    setHistoryFilterDraft(EMPTY_HISTORY_FILTERS);
    setHistoryPageIndex(0);
    setHistoryFilters(EMPTY_HISTORY_FILTERS);
  };

  const handleOpenCancelModal = (item: SubscriptionHistoryItem) => {
    if (!canManageRequests) {
      return;
    }
    setCancelTarget(item);
    setCancelReason('');
  };

  const handleCloseCancelModal = useCallback(() => {
    setCancelTarget(null);
    setCancelReason('');
  }, []);

  useEffect(() => {
    if (!billPreviewTarget && !cancelTarget) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (billPreviewTarget) {
          handleCloseBillPreview();
        }
        if (cancelTarget) {
          handleCloseCancelModal();
        }
      }
    };

    globalThis.addEventListener('keydown', onEscape);
    return () => {
      globalThis.removeEventListener('keydown', onEscape);
    };
  }, [billPreviewTarget, cancelTarget, handleCloseBillPreview, handleCloseCancelModal]);

  useEffect(() => {
    return () => {
      if (billPreviewUrl) {
        URL.revokeObjectURL(billPreviewUrl);
      }
    };
  }, [billPreviewUrl]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !canManageRequests) {
      return;
    }

    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Vui lòng nhập lý do hủy gói.');
      return;
    }

    try {
      setIsCancelling(true);
      const response = await cancelSubscriptionByAdmin(cancelTarget.id, { reason });
      toast.success(`Đã hủy gói thành công. Refund dự kiến: ${formatMoney(response.refundAmount)}`);
      notifySubscriptionReviewUpdated();
      handleCloseCancelModal();
      await Promise.all([
        loadQueue(),
        requestHistory(historyFilters, historyPageIndex),
        requestAnalytics(),
      ]);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Hủy subscription thất bại.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {isAuditMode ? 'Đối soát thanh toán Premium' : 'Hàng chờ duyệt thanh toán Premium'}
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                {isAuditMode
                  ? 'Audit có thể duyệt/hủy sau khi đối soát bill, đồng thời theo dõi lịch sử subscription và approval.'
                  : 'Duyệt thủ công bill chuyển khoản, hệ thống sẽ tự đẩy web push + email khi có kết quả.'}
              </p>
            </div>
            <button
              onClick={() => void loadQueue()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
          </div>
        </section>

        {isAdminMode && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Doanh thu tháng</p>
              <p className="mt-3 text-2xl font-black text-emerald-900">
                {isAnalyticsLoading ? '...' : formatMoney(analytics?.monthlyRevenue)}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Premium active</p>
              <p className="mt-3 text-2xl font-black text-cyan-900">
                {isAnalyticsLoading ? '...' : Number(analytics?.activePremiumCount ?? 0).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Top plan</p>
              <p className="mt-3 text-lg font-black text-violet-900">{analytics?.topPlanName || 'Chưa có dữ liệu'}</p>
              <p className="mt-1 text-xs font-semibold text-violet-700">
                {isAnalyticsLoading
                  ? '...'
                  : `${Number(analytics?.topPlanSubscriptions ?? 0).toLocaleString('vi-VN')} subscriptions`}
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-slate-900">Danh sách yêu cầu</h2>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{rows.length} bản ghi</span>
            </div>
            <div className="mb-3 px-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="PENDING_REVIEW">{formatSubscriptionStatus('PENDING_REVIEW')}</option>
                <option value="APPROVED">{formatSubscriptionStatus('APPROVED')}</option>
                <option value="REJECTED">{formatSubscriptionStatus('REJECTED')}</option>
              </select>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
              ) : rows.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Không có request cho trạng thái đã chọn.</p>
              ) : (
                rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelected(row)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected?.id === row.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">#{row.id} - {row.userFullName}</p>
                      <p className="text-xs font-semibold text-slate-500">{new Date(row.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{row.planName} • {Number(row.purchasedPrice).toLocaleString('vi-VN')}đ</p>
                    <p className="mt-1 text-xs text-slate-500">Mã GD: {row.transactionRef || '-'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                {canManageRequests ? 'Chọn một request để duyệt.' : 'Chọn một request để xem chi tiết.'}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Review request #{selected.id}</h2>
                    <p className="text-sm text-slate-500">{selected.userFullName} • {selected.userEmail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(selected.status)}`}>
                    <ShieldCheck className="h-3.5 w-3.5" /> {formatSubscriptionStatus(selected.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p><strong>Gói:</strong> {selected.planName}</p>
                  <p><strong>Số tiền:</strong> {Number(selected.purchasedPrice).toLocaleString('vi-VN')}đ</p>
                  <p><strong>Phương thức:</strong> {selected.paymentMethod || '-'}</p>
                  <p><strong>Mã giao dịch:</strong> {selected.transactionRef || '-'}</p>
                  <button
                    type="button"
                    onClick={() => void handleOpenBillPreview(selected.id, `Request #${selected.id}`)}
                    className="inline-flex w-fit items-center gap-2 font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    <Eye className="h-4 w-4" /> Mở bill chuyển khoản
                  </button>
                </div>

                {canManageRequests ? (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Ghi chú duyệt</span>
                    <textarea
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                      placeholder="VD: Đã đối soát thành công với sao kê ngân hàng"
                    />
                  </label>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    Request đã xử lý, chỉ còn ở chế độ xem lịch sử.
                  </p>
                )}

                {canManageRequests && selected.status === 'PENDING_REVIEW' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleReview(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                    >
                      <CheckCheck className="h-4 w-4" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleReview(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:bg-rose-300"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                    {canManageRequests
                      ? 'Request này đã xử lý, chỉ còn ở chế độ xem lịch sử.'
                      : 'Audit đang xem request ở chế độ chỉ đọc.'}
                  </p>
                )}

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Lịch sử duyệt</h3>
                  {audits.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có lịch sử duyệt.</p>
                  ) : (
                    <div className="space-y-2">
                      {audits.map((audit) => (
                        <div key={audit.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          <p className="font-semibold">{audit.reviewerEmail} • {audit.decision}</p>
                          <p className="text-xs text-slate-500">{new Date(audit.reviewedAt).toLocaleString('vi-VN')}</p>
                          <p className="mt-1 text-xs text-slate-500">{audit.reviewNote || 'Không có ghi chú'} • {audit.notificationDispatched ? 'Đã gửi notify' : 'Lỗi gửi notify'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <MailCheck className="h-4 w-4" />
                  {canManageRequests
                    ? 'Sau khi duyệt, RabbitMQ event sẽ được publish để gửi web push + email cho user.'
                    : 'Audit có thể đối chiếu lịch sử gửi notify từ bản ghi approval.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {canViewHistory && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900">
                <BarChart3 className="h-5 w-5 text-cyan-600" /> Lịch sử subscription
              </h2>
              <button
                type="button"
                onClick={() => void requestHistory(historyFilters, historyPageIndex)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" /> Tải lại
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                value={historyFilterDraft.search}
                onChange={(event) =>
                  setHistoryFilterDraft((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder="Tìm theo user, email, plan, mã GD"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <select
                value={historyFilterDraft.status}
                onChange={(event) =>
                  setHistoryFilterDraft((current) => ({
                    ...current,
                    status: event.target.value as SubscriptionStatus | '',
                  }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING_REVIEW">{formatSubscriptionStatus('PENDING_REVIEW')}</option>
                <option value="APPROVED">{formatSubscriptionStatus('APPROVED')}</option>
                <option value="REJECTED">{formatSubscriptionStatus('REJECTED')}</option>
                <option value="EXPIRED">{formatSubscriptionStatus('EXPIRED')}</option>
                <option value="CANCELLED">{formatSubscriptionStatus('CANCELLED')}</option>
              </select>
              <input
                type="date"
                value={historyFilterDraft.from}
                onChange={(event) =>
                  setHistoryFilterDraft((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="date"
                value={historyFilterDraft.to}
                onChange={(event) =>
                  setHistoryFilterDraft((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplyHistoryFilters}
                  className="w-full rounded-xl bg-cyan-600 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  Lọc
                </button>
                <button
                  type="button"
                  onClick={handleResetHistoryFilters}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Giá</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Tạo lúc</th>
                    <th className="px-4 py-3 text-left">Lý do hủy</th>
                    <th className="px-4 py-3 text-right">{canManageRequests ? 'Action' : 'Bill'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {isHistoryLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : !history || history.content.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Không có dữ liệu subscription history.
                      </td>
                    </tr>
                  ) : (
                    history.content.map((item) => {
                      const canCancel = item.status === 'APPROVED';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{item.userFullName}</p>
                            <p className="text-xs text-slate-500">{item.userEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{item.planName}</p>
                            <p className="text-xs text-slate-500">#{item.id}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold">{formatMoney(item.purchasedPrice)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(item.status)}`}>
                              {formatSubscriptionStatus(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {item.cancellationReason || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {item.billImageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => void handleOpenBillPreview(item.id, `Lịch sử #${item.id}`)}
                                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Bill
                                </button>
                              ) : null}
                              {canManageRequests ? (
                                <button
                                  type="button"
                                  disabled={!canCancel}
                                  onClick={() => handleOpenCancelModal(item)}
                                  className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200"
                                >
                                  Hủy gói
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <p>
                Tổng bản ghi: {Number(history?.totalElements ?? 0).toLocaleString('vi-VN')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryPageIndex((current) => Math.max(current - 1, 0))}
                  disabled={Boolean(history?.first ?? true)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="font-semibold text-slate-700">
                  Trang {Number(history?.number ?? 0) + 1} / {Math.max(Number(history?.totalPages ?? 1), 1)}
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryPageIndex((current) => current + 1)}
                  disabled={Boolean(history?.last ?? true)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {billPreviewTarget && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={handleCloseBillPreview}>
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Đóng xem bill"
            onClick={handleCloseBillPreview}
          />
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-review-bill-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="subscription-review-bill-preview-title" className="text-base font-black text-slate-900">Bill chuyển khoản</h3>
                <p className="text-xs text-slate-500">{billPreviewTarget.label}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseBillPreview}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng modal bill"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-slate-100 p-4">
              {isBillPreviewLoading ? (
                <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-500">
                  Đang tải bill...
                </div>
              ) : billPreviewUrl ? (
                <img
                  src={billPreviewUrl}
                  alt={`Bill ${billPreviewTarget.id}`}
                  className="mx-auto max-h-[72vh] w-auto rounded-lg border border-slate-300 bg-white shadow"
                />
              ) : (
                <div className="flex h-[60vh] items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-500">
                  Không có dữ liệu bill để hiển thị.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={handleCloseCancelModal}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-cancel-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="subscription-cancel-title" className="text-lg font-black text-slate-900">Xác nhận hủy subscription</h3>
                <p className="mt-1 text-sm text-slate-500">
                  #{cancelTarget.id} - {cancelTarget.userFullName} - {cancelTarget.planName}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng modal hủy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Lý do hủy (bắt buộc)
              </span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                placeholder="VD: Khách hàng yêu cầu hủy, sai thông tin chuyển khoản..."
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancel()}
                disabled={isCancelling || cancelReason.trim().length === 0}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SubscriptionReviewQueue;
