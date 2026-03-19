import React, { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { CheckCheck, Eye, MailCheck, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import MainLayout from '../components/MainLayout';
import {
  fetchSubscriptionApprovalAudits,
  notifySubscriptionReviewUpdated,
  fetchSubscriptionReviewQueue,
  reviewSubscriptionPurchaseRequest,
  type SubscriptionStatus,
  type SubscriptionApprovalAudit,
  type UserSubscriptionQueueItem,
} from '../api/axiosClient';

type SubscriptionReviewQueueProps = {
  mode: 'admin' | 'contributor';
};

const SubscriptionReviewQueue: React.FC<SubscriptionReviewQueueProps> = ({ mode }) => {
  const [rows, setRows] = useState<UserSubscriptionQueueItem[]>([]);
  const [selected, setSelected] = useState<UserSubscriptionQueueItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus>('PENDING_REVIEW');
  const [audits, setAudits] = useState<SubscriptionApprovalAudit[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const Layout = useMemo(() => (mode === 'admin' ? AdminLayout : MainLayout), [mode]);

  const loadQueue = async () => {
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
  };

  useEffect(() => {
    void loadQueue();
  }, [statusFilter]);

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
  }, [selected?.id]);

  const handleReview = async (approved: boolean) => {
    if (!selected) {
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

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Hàng chờ duyệt thanh toán Premium</h1>
              <p className="mt-2 text-sm text-slate-200">Duyệt thủ công bill chuyển khoản, hệ thống sẽ tự đẩy web push + email khi có kết quả.</p>
            </div>
            <button
              onClick={() => void loadQueue()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" /> Làm mới
            </button>
          </div>
        </section>

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
                <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
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
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chọn một request để duyệt.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Review request #{selected.id}</h2>
                    <p className="text-sm text-slate-500">{selected.userFullName} • {selected.userEmail}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> {selected.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p><strong>Gói:</strong> {selected.planName}</p>
                  <p><strong>Số tiền:</strong> {Number(selected.purchasedPrice).toLocaleString('vi-VN')}đ</p>
                  <p><strong>Phương thức:</strong> {selected.paymentMethod || '-'}</p>
                  <p><strong>Mã giao dịch:</strong> {selected.transactionRef || '-'}</p>
                  <a href={selected.billImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-cyan-700 hover:text-cyan-900">
                    <Eye className="h-4 w-4" /> Mở bill chuyển khoản
                  </a>
                </div>

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

                {selected.status === 'PENDING_REVIEW' ? (
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
                    Request này đã xử lý, chỉ còn ở chế độ xem lịch sử.
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
                  <MailCheck className="h-4 w-4" /> Sau khi duyệt, RabbitMQ event sẽ được publish để gửi web push + email cho user.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SubscriptionReviewQueue;
