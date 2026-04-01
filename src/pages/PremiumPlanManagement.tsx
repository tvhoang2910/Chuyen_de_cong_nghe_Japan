import React, { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { BadgeCheck, Layers3, PlusCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import MainLayout from '../components/MainLayout';
import {
  createPremiumPlan,
  fetchManagedPremiumPlans,
  type CreatePremiumPlanPayload,
  type PremiumPlanSummary,
} from '../api/axiosClient';

type PremiumPlanManagementProps = {
  mode: 'admin' | 'contributor';
};

type FormState = {
  name: string;
  price: string;
  durationDays: string;
  lifetime: boolean;
  description: string;
  active: boolean;
};

const initialForm: FormState = {
  name: '',
  price: '',
  durationDays: '30',
  lifetime: false,
  description: '',
  active: true,
};

const PremiumPlanManagement: React.FC<PremiumPlanManagementProps> = ({ mode }) => {
  const Layout = useMemo(() => (mode === 'admin' ? AdminLayout : MainLayout), [mode]);
  const [plans, setPlans] = useState<PremiumPlanSummary[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetchManagedPremiumPlans();
      setPlans(response);
    } catch {
      toast.error('Không thể tải danh sách gói Premium.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Giá gói không hợp lệ.');
      return;
    }

    const durationDays = Number(form.durationDays);
    if (!form.lifetime && (Number.isNaN(durationDays) || durationDays <= 0)) {
      toast.error('durationDays phải lớn hơn 0 với gói không phải lifetime.');
      return;
    }

    const payload: CreatePremiumPlanPayload = {
      name: form.name.trim(),
      price,
      durationDays: form.lifetime ? undefined : durationDays,
      lifetime: form.lifetime,
      description: form.description.trim() || undefined,
      active: form.active,
    };

    try {
      setIsSaving(true);
      await createPremiumPlan(payload);
      toast.success('Đã tạo gói Premium mới.');
      setForm(initialForm);
      await loadPlans();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Tạo gói Premium thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-7 text-white shadow-xl">
          <h1 className="text-3xl font-black tracking-tight">Quản trị gói Premium</h1>
          <p className="mt-2 text-sm text-slate-200">Admin và Contributor có thể tạo mới gói Premium để người dùng đăng ký.</p>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Danh sách gói</h2>
              <button
                id="premium-plans-refresh"
                type="button"
                onClick={() => void loadPlans()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
              >
                <RefreshCw className="h-4 w-4" /> Làm mới
              </button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              ) : plans.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có gói Premium nào.</p>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">{plan.name}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {plan.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{plan.lifetime ? 'Lifetime' : `${plan.durationDays} ngày`}</p>
                    <p className="mt-2 text-sm font-semibold text-indigo-700">{Number(plan.price).toLocaleString('vi-VN')}đ</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Tạo gói mới</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tên gói</span>
                <input
                  id="premium-plan-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: Premium Plus"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Giá</span>
                  <input
                    id="premium-plan-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="99000"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Số ngày</span>
                  <input
                    id="premium-plan-duration"
                    type="number"
                    min={1}
                    value={form.durationDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, durationDays: event.target.value }))}
                    disabled={form.lifetime}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
                    placeholder={form.lifetime ? 'Không áp dụng cho lifetime' : '30'}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mô tả</span>
                <textarea
                  id="premium-plan-description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    id="premium-plan-lifetime"
                    type="checkbox"
                    checked={form.lifetime}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        lifetime: checked,
                        durationDays: checked ? '' : '30',
                      }));
                    }}
                  />
                  <span>Lifetime</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    id="premium-plan-active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>

              <button
                id="premium-plan-submit"
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                <BadgeCheck className="h-4 w-4" />
                {isSaving ? 'Đang tạo...' : 'Tạo gói Premium'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <p className="inline-flex items-center gap-2 font-semibold text-slate-700">
            <Layers3 className="h-4 w-4 text-indigo-500" />
            Gợi ý: đặt mô tả ngắn gọn, giá &gt;= 0 và chọn đúng thời hạn gói.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default PremiumPlanManagement;
