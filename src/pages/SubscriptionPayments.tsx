import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { CheckCircle2, Clock3, FileImage, Landmark, ReceiptText, UploadCloud, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';
import {
  createSubscriptionPurchaseRequest,
  fetchMySubscriptionRequests,
  fetchPremiumPlans,
  type PremiumPlanSummary,
  type SubscriptionStatus,
  type UserSubscriptionQueueItem,
} from '../api/axiosClient';

const statusBadgeClass: Record<SubscriptionStatus, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  EXPIRED: 'bg-slate-100 text-slate-700 border border-slate-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const statusLabel: Record<SubscriptionStatus, string> = {
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
};

const MAX_BILL_SIZE_BYTES = 20 * 1024 * 1024;

const SubscriptionPayments: React.FC = () => {
  const [plans, setPlans] = useState<PremiumPlanSummary[]>([]);
  const [requests, setRequests] = useState<UserSubscriptionQueueItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [plansResponse, requestsResponse] = await Promise.all([
        fetchPremiumPlans(),
        fetchMySubscriptionRequests(),
      ]);
      setPlans(plansResponse);
      setRequests(requestsResponse);
      if (!selectedPlanId && plansResponse.length > 0) {
        setSelectedPlanId(plansResponse[0].id);
      }
    } catch {
      toast.error('Không thể tải dữ liệu gói Premium.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlanId) {
      toast.error('Vui lòng chọn gói Premium.');
      return;
    }
    if (!billFile) {
      toast.error('Vui lòng tải lên bill chuyển khoản.');
      return;
    }
    if (billFile.size > MAX_BILL_SIZE_BYTES) {
      toast.error('Bill vuot qua gioi han 20MB. Vui long chon file nho hon.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createSubscriptionPurchaseRequest({
        planId: selectedPlanId,
        paymentMethod,
        transactionRef,
        promoCode,
        bill: billFile,
      });
      toast.success('Đã gửi yêu cầu nâng cấp. Hệ thống sẽ thông báo khi được duyệt.');
      setTransactionRef('');
      setPromoCode('');
      setBillFile(null);
      await loadData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-br from-sky-700 via-cyan-700 to-teal-700 p-8 text-white shadow-xl shadow-cyan-900/20">
          <h1 className="text-3xl font-black tracking-tight">Nâng cấp Premium qua QR Banking</h1>
          <p className="mt-3 max-w-2xl text-cyan-50/90">
            Quét QR của hệ thống, chuyển khoản và tải bill. Admin/Contributor sẽ duyệt thủ công, sau đó hệ thống tự gửi web push + email kết quả.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <Landmark className="h-5 w-5 text-cyan-600" />
              <h2 className="text-xl font-bold">Chọn gói</h2>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const active = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-cyan-500 bg-cyan-50 shadow-sm shadow-cyan-500/20'
                          : 'border-slate-200 bg-white hover:border-cyan-300'
                      }`}
                    >
                      <p className="text-lg font-bold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{plan.description || 'Gói nâng cao cho trải nghiệm học tập.'}</p>
                      <p className="mt-4 text-2xl font-black text-cyan-700">{Number(plan.price).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {plan.lifetime ? 'Lifetime' : `${plan.durationDays} ngày`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Gửi bill thanh toán</h2>
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 p-4 text-sm text-cyan-900">
                <p className="font-semibold">Thông tin chuyển khoản mẫu</p>
                <p className="mt-2">Ngân hàng: MB Bank</p>
                <p>STK: 1234567899</p>
                <p>Nội dung: PREMIUM {selectedPlan?.id || 'PLAN'} USER</p>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Phương thức</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="momo">Ví MoMo</option>
                  <option value="zalopay">ZaloPay</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mã giao dịch</span>
                <input
                  value={transactionRef}
                  onChange={(event) => setTransactionRef(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="VD: FT260319123456"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mã khuyến mãi (nếu có)</span>
                <input
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="VD: PREMIUM10"
                />
              </label>

              <label className="block rounded-xl border border-slate-300 bg-slate-50 p-3">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <FileImage className="h-4 w-4" /> Bill chuyển khoản
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setBillFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">Gioi han kich thuoc: toi da 20MB.</p>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                <UploadCloud className="h-4 w-4" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu nâng cấp'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Lịch sử yêu cầu của bạn</h2>
            <ReceiptText className="h-5 w-5 text-slate-500" />
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có yêu cầu nào.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{request.planName}</p>
                      <p className="text-sm text-slate-500">{new Date(request.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass[request.status]}`}>
                      {request.status === 'PENDING_REVIEW' && <Clock3 className="h-3.5 w-3.5" />}
                      {request.status === 'APPROVED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {request.status === 'REJECTED' && <XCircle className="h-3.5 w-3.5" />}
                      {statusLabel[request.status]}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    <p>Số tiền: {Number(request.purchasedPrice).toLocaleString('vi-VN')}đ</p>
                    <p>Mã giao dịch: {request.transactionRef || '-'}</p>
                    <a
                      href={request.billImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cyan-700 hover:text-cyan-800"
                    >
                      Xem bill đã tải lên
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default SubscriptionPayments;
