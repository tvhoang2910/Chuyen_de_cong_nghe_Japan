import React, { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import {
  fetchVipRequests,
  fetchVipRequestHistory,
  fetchVipRequestBill,
  type VipRequestItem,
} from "../../api/auditClient";

const statusBadgeClass = (status: string) => {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700";
  if (status === "PENDING_REVIEW") return "bg-amber-100 text-amber-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

const statusLabel = (status: string) => {
  if (status === "APPROVED") return "Đã duyệt";
  if (status === "PENDING_REVIEW") return "Chờ duyệt";
  if (status === "REJECTED") return "Từ chối";
  if (status === "EXPIRED") return "Hết hạn";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
};

const AuditVipApproval: React.FC = () => {
  const [rows, setRows] = useState<VipRequestItem[]>([]);
  const page = 0;
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<VipRequestItem | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);
  const [billError, setBillError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const p = await fetchVipRequests(page, 20, "PENDING_REVIEW");
      setRows(p.content);
    } catch (err) {
      toast.error("Không tải được danh sách yêu cầu VIP.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = useCallback(async (row: VipRequestItem) => {
    const isClosing = await new Promise<boolean>((resolve) => {
      setSelected((prev) => {
        const shouldClose = prev?.id === row.id;
        resolve(shouldClose);
        return shouldClose ? null : row;
      });
    });

    if (isClosing) {
      setHistory([]);
      setBillError(null);
      setBillPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    setBillError(null);
    setBillPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const h = await fetchVipRequestHistory(row.id);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      setHistory([]);
    }

    if (!row.billImageUrl) {
      setBillError("Không có ảnh bill được gửi.");
      return;
    }

    try {
      const billBlob = await fetchVipRequestBill(row.id);
      const previewUrl = URL.createObjectURL(billBlob);
      setBillPreviewUrl(previewUrl);
    } catch (err) {
      let message = "Không tải được ảnh bill.";
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const detail = (err.response?.data as { message?: string } | undefined)
          ?.message;
        if (status) {
          message += ` (status ${status})`;
        }
        if (detail) {
          message += `: ${detail}`;
        }
      }
      message += " Hãy thử mở ảnh gốc.";
      setBillError(message);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (billPreviewUrl) {
        URL.revokeObjectURL(billPreviewUrl);
      }
    };
  }, [billPreviewUrl]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Đối soát yêu cầu VIP</h1>
          <p className="text-sm text-slate-600">
            Audit chỉ kiểm tra bill và lịch sử. Thao tác duyệt/từ chối nằm ở màn Admin thanh toán.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-3">ID</th>
                  <th className="p-3">Người yêu cầu</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Gói</th>
                  <th className="p-3">Số tiền</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      Đang tải...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      Không có yêu cầu.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 align-top">{r.id}</td>
                      <td className="p-3 align-top">
                        <div className="font-semibold">{r.userFullName}</div>
                      </td>
                      <td className="p-3 align-top">{r.userEmail}</td>
                      <td className="p-3 align-top">{r.planName ?? "-"}</td>
                      <td className="p-3 align-top">
                        {Number(r.purchasedPrice ?? 0).toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-3 align-top">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(r.status)}`}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetail(r)}
                            className="px-3 py-1 rounded-xl bg-slate-100"
                          >
                            <span className="inline-flex items-center gap-2">
                              {selected?.id === r.id ? "Thu gọn" : "Chi tiết"}
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  selected?.id === r.id
                                    ? "rotate-180 text-slate-600"
                                    : "text-slate-500"
                                }`}
                              />
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Chi tiết yêu cầu #{selected.id}</h3>
              <div className="text-xs text-slate-500">
                {selected.createdAt
                  ? new Date(selected.createdAt).toLocaleString()
                  : ""}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold">Bill chuyển khoản</div>
                {billPreviewUrl ? (
                  <div className="mt-3 space-y-2">
                    {selected.billImageUrl && (
                      <a
                        href={selected.billImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-700 underline"
                      >
                        Mở ảnh gốc
                      </a>
                    )}
                    <img
                      src={billPreviewUrl ?? undefined}
                      alt="Bill chuyển khoản"
                      className="max-h-96 w-full rounded-xl object-contain bg-white"
                      loading="lazy"
                    />
                  </div>
                ) : billError ? (
                  <p className="mt-2 text-sm text-slate-500">{billError}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Không có ảnh bill được gửi.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="font-semibold">Thông tin thanh toán</div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Người yêu cầu</span>
                    <span className="font-medium">{selected.userFullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium">{selected.userEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Gói</span>
                    <span className="font-medium">
                      {selected.planName ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số tiền</span>
                    <span className="font-medium">
                      {Number(selected.purchasedPrice ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phương thức</span>
                    <span className="font-medium">
                      {selected.paymentMethod ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã giao dịch</span>
                    <span className="font-medium">
                      {selected.transactionRef ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div> 

            <h4 className="mt-6 font-bold">Lịch sử xử lý</h4>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">Không có lịch sử.</p>
              ) : (
                history.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {h.reviewerEmail ?? h.reviewerRole}
                      </div>
                      <div className="text-xs text-slate-500">
                        {h.reviewNote ?? ""}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {h.reviewedAt
                        ? new Date(h.reviewedAt).toLocaleString()
                        : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AuditVipApproval;
