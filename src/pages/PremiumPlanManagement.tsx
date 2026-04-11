import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { BadgeCheck, Edit3, Layers3, PlusCircle, RefreshCw, Save, Search, Trash2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import MainLayout from '../components/MainLayout';
import {
  createPremiumPlan,
  deletePremiumPlan,
  fetchManagedPremiumPlans,
  type CreatePremiumPlanPayload,
  type PremiumPlanSummary,
  updatePremiumPlan,
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

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const PremiumPlanManagement: React.FC<PremiumPlanManagementProps> = ({ mode }) => {
  const Layout = useMemo(() => (mode === 'admin' ? AdminLayout : MainLayout), [mode]);
  const canManage = mode === 'admin';
  const [plans, setPlans] = useState<PremiumPlanSummary[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  const editingPlan = useMemo(
    () => plans.find((plan) => plan.id === editingPlanId) ?? null,
    [plans, editingPlanId],
  );

  const filteredPlans = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return plans.filter((plan) => {
      if (activeFilter === 'ACTIVE' && !plan.active) {
        return false;
      }
      if (activeFilter === 'INACTIVE' && plan.active) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return `${plan.name} ${plan.description ?? ''}`.toLowerCase().includes(keyword);
    });
  }, [plans, searchKeyword, activeFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.active).length;
    const lifetime = plans.filter((plan) => plan.lifetime).length;
    return {
      total: plans.length,
      active,
      inactive: plans.length - active,
      lifetime,
    };
  }, [plans]);

  const syncFormWithPlan = useCallback((plan: PremiumPlanSummary | null) => {
    if (!plan) {
      setForm(initialForm);
      return;
    }
    setForm({
      name: plan.name,
      price: String(plan.price),
      durationDays: plan.lifetime ? '' : String(plan.durationDays),
      lifetime: plan.lifetime,
      description: plan.description ?? '',
      active: plan.active,
    });
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchManagedPremiumPlans();
      setPlans(response);
      setEditingPlanId((current) =>
        current && response.some((plan) => plan.id === current) ? current : null,
      );
    } catch {
      toast.error('Không thể tải danh sách gói Premium.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    syncFormWithPlan(editingPlan);
  }, [editingPlan, syncFormWithPlan]);

  const handleStartCreate = () => {
    setEditingPlanId(null);
    syncFormWithPlan(null);
  };

  const handleStartEdit = (plan: PremiumPlanSummary) => {
    setEditingPlanId(plan.id);
    syncFormWithPlan(plan);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManage) {
      toast.error('Chỉ ADMIN mới có quyền thêm/sửa/xóa gói Premium.');
      return;
    }

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
      if (editingPlanId) {
        await updatePremiumPlan(editingPlanId, payload);
        toast.success('Đã cập nhật gói Premium.');
      } else {
        await createPremiumPlan(payload);
        toast.success('Đã tạo gói Premium mới.');
      }
      handleStartCreate();
      await loadPlans();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Lưu gói Premium thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plan: PremiumPlanSummary) => {
    if (!canManage) {
      toast.error('Chỉ ADMIN mới có quyền thêm/sửa/xóa gói Premium.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa gói "${plan.name}"? Hành động này không thể hoàn tác.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingPlanId(plan.id);
      await deletePremiumPlan(plan.id);
      toast.success('Đã xóa gói Premium.');
      if (editingPlanId === plan.id) {
        handleStartCreate();
      }
      await loadPlans();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Xóa gói Premium thất bại.');
    } finally {
      setDeletingPlanId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-7 text-white shadow-xl">
          <h1 className="text-3xl font-black tracking-tight">Quản trị gói Premium</h1>
          <p className="mt-2 text-sm text-slate-200">Quản lý danh mục gói Premium: xem, tìm kiếm, thêm, sửa, xóa và kiểm soát trạng thái gói.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tổng số gói</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Đang active</p>
            <p className="mt-2 text-2xl font-black text-emerald-800">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Đã tắt</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{stats.inactive}</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Lifetime</p>
            <p className="mt-2 text-2xl font-black text-indigo-800">{stats.lifetime}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
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

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr,180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="premium-plan-search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Tìm theo tên hoặc mô tả gói"
                />
              </label>

              <select
                id="premium-plan-active-filter"
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Chỉ active</option>
                <option value="INACTIVE">Chỉ inactive</option>
              </select>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              ) : filteredPlans.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chưa có gói Premium nào.</p>
              ) : (
                filteredPlans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-500">{plan.description || 'Không có mô tả'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {plan.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">{plan.lifetime ? 'Lifetime' : `${plan.durationDays} ngày`}</p>
                        <p className="text-sm font-semibold text-indigo-700">{vndFormatter.format(Number(plan.price))}</p>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(plan)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(plan)}
                            disabled={deletingPlanId === plan.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingPlanId === plan.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <PlusCircle className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-bold">{editingPlanId ? 'Cập nhật gói' : 'Tạo gói mới'}</h2>
            </div>

            {!canManage && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Chế độ chỉ xem: chỉ ADMIN mới có quyền thêm/sửa/xóa gói Premium.
              </p>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tên gói</span>
                <input
                  id="premium-plan-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  disabled={!canManage}
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
                    disabled={!canManage}
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
                    disabled={form.lifetime || !canManage}
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
                  disabled={!canManage}
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
                    disabled={!canManage}
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
                    disabled={!canManage}
                    onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  id="premium-plan-submit"
                  type="submit"
                  disabled={isSaving || !canManage}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {editingPlanId ? <Save className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                  {isSaving ? 'Đang lưu...' : editingPlanId ? 'Lưu cập nhật' : 'Tạo gói Premium'}
                </button>

                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:border-slate-500"
                >
                  <XCircle className="h-4 w-4" /> Hủy chỉnh sửa
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <p className="inline-flex items-center gap-2 font-semibold text-slate-700">
            <Layers3 className="h-4 w-4 text-indigo-500" />
            Gợi ý: dùng tên gói rõ nghĩa, giá theo VNĐ, và chỉ xóa gói chưa có đăng ký để giữ an toàn dữ liệu lịch sử.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default PremiumPlanManagement;
