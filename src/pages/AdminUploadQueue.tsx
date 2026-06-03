import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "../components/AdminLayout";
import {
  approveUpload,
  fetchAdminUploadHistory,
  fetchPendingQueue,
  fetchUploadDetail,
  fetchUploadPageBlob,
  rejectUpload,
  type ExamUploadHistoryResponse,
  type ExamUploadResponse,
} from "../api/examUploadClient";
import { useExamEventsSSE } from "../hooks/useExamEventsSSE";

const PAGE_SIZE = 10;
const EXTRACTION_POLL_INTERVAL_MS = 4000;
const EXTRACTION_POLL_TIMEOUT_MS = 5 * 60 * 1000;

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Lý do phải có ít nhất 5 ký tự.")
    .max(1000, "Lý do tối đa 1000 ký tự."),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

type DetailTab = "preview" | "history";

interface AdminUploadQueueProps {
  mode?: "admin" | "contributor";
}

const PreviewUnavailable: React.FC<{ pageNumber?: number }> = ({
  pageNumber,
}) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
    <p className="font-bold">
      {pageNumber ? `Không xem được trang ${pageNumber}.` : "Không có file xem trước."}
    </p>
    <p className="mt-1 text-amber-700">
      File gốc có thể đã mất khỏi lưu trữ hoặc chưa được upload hoàn tất.
    </p>
  </div>
);

const PreviewLoading: React.FC<{ pageNumber: number }> = ({ pageNumber }) => (
  <div className="flex min-h-40 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
    <Loader2 className="h-4 w-4 animate-spin" />
    Đang tải trang {pageNumber}...
  </div>
);

const AdminUploadQueue: React.FC<AdminUploadQueueProps> = ({ mode = "admin" }) => {
  const [queue, setQueue] = useState<ExamUploadResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<ExamUploadResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [tab, setTab] = useState<DetailTab>("preview");
  const [history, setHistory] = useState<ExamUploadHistoryResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [failedPreviewIndexes, setFailedPreviewIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [previewBlobUrls, setPreviewBlobUrls] = useState<Record<number, string>>(
    {},
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [extractingUploadId, setExtractingUploadId] = useState<number | null>(
    null,
  );
  const extractingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const extractionPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const extractionPollingInFlightRef = useRef(false);
  const extractionStartedAtRef = useRef<number | null>(null);

  const accessToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("access_token");
  const { subscribe } = useExamEventsSSE(accessToken);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  });

  const loadQueue = useCallback(async (nextPage: number) => {
    setIsLoadingQueue(true);
    try {
      const res = await fetchPendingQueue(nextPage, PAGE_SIZE);
      setQueue(res.content);
      setTotalPages(Math.max(res.totalPages, 1));
      setPage(res.page);
    } catch {
      toast.error("Không tải được hàng đợi duyệt.");
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue(0);
  }, [loadQueue]);

  const openDetail = async (uploadId: number) => {
    setSelectedId(uploadId);
    setTab("preview");
    setSelectedDetail(null);
    setFailedPreviewIndexes(new Set());
    setPreviewBlobUrls({});
    setIsLoadingDetail(true);
    try {
      const detail = await fetchUploadDetail(uploadId);
      setSelectedDetail(detail);
    } catch {
      toast.error("Không tải được chi tiết upload.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSelectedDetail(null);
    setFailedPreviewIndexes(new Set());
    setPreviewBlobUrls({});
    setHistory([]);
    setExtractingUploadId(null);
    if (extractingTimeoutRef.current) {
      clearTimeout(extractingTimeoutRef.current);
      extractingTimeoutRef.current = null;
    }
    if (extractionPollIntervalRef.current) {
      clearInterval(extractionPollIntervalRef.current);
      extractionPollIntervalRef.current = null;
    }
    extractionPollingInFlightRef.current = false;
    extractionStartedAtRef.current = null;
    reset();
  }, [reset]);

  useEffect(() => {
    if (tab !== "history" || selectedId === null) return;
    setIsLoadingHistory(true);
    fetchAdminUploadHistory(selectedId)
      .then((rows) => setHistory(rows))
      .catch(() => toast.error("Không tải được lịch sử duyệt."))
      .finally(() => setIsLoadingHistory(false));
  }, [tab, selectedId]);

  const onApprove = async () => {
    if (selectedId === null) return;
    const uploadId = selectedId;
    setIsApproving(true);
    setExtractingUploadId(uploadId);
    try {
      await approveUpload(uploadId);
      toast("Đã duyệt — đang chờ AI trích xuất…", { icon: "⏳" });
    } catch {
      toast.error("Lỗi khi duyệt.");
      setExtractingUploadId(null);
    } finally {
      setIsApproving(false);
    }
  };

  // Subscribe SSE to resolve extraction result for the approved upload.
  useEffect(() => {
    if (extractingUploadId === null) {
      return undefined;
    }
    const unsubscribe = subscribe((event) => {
      if (
        event.uploadRequestId !== extractingUploadId ||
        (event.eventType !== "AI_EXTRACTION_SUCCESS" &&
          event.eventType !== "AI_EXTRACTION_FAILED")
      ) {
        return;
      }
      if (event.eventType === "AI_EXTRACTION_SUCCESS") {
        setExtractingUploadId(null);
        closeDetail();
        void loadQueue(page);
      } else {
        extractingTimeoutRef.current = setTimeout(() => {
          setExtractingUploadId(null);
          closeDetail();
          void loadQueue(page);
        }, 1500);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [extractingUploadId, subscribe, closeDetail, loadQueue, page]);

  // Polling fallback: prevents infinite loading if SSE is delayed/missing.
  useEffect(() => {
    if (extractingUploadId === null) {
      return undefined;
    }

    extractionStartedAtRef.current = Date.now();

    const pollExtractionStatus = async () => {
      if (extractionPollingInFlightRef.current) {
        return;
      }
      extractionPollingInFlightRef.current = true;

      try {
        const detail = await fetchUploadDetail(extractingUploadId);
        setSelectedDetail((previous) =>
          previous && previous.id === detail.id ? detail : previous,
        );

        if (detail.status === "EXTRACTED") {
          toast.success("Đã trích xuất xong.");
          setExtractingUploadId(null);
          closeDetail();
          void loadQueue(page);
          return;
        }

        if (detail.status === "EXTRACT_FAILED") {
          toast.error(detail.extractionError ?? "Trích xuất thất bại.");
          setExtractingUploadId(null);
          closeDetail();
          void loadQueue(page);
          return;
        }

        const startedAt = extractionStartedAtRef.current;
        if (startedAt && Date.now() - startedAt > EXTRACTION_POLL_TIMEOUT_MS) {
          toast.error("Trích xuất đang mất lâu hơn bình thường. Vui lòng kiểm tra lại hàng đợi.");
          setExtractingUploadId(null);
          closeDetail();
          void loadQueue(page);
        }
      } catch {
        // Ignore transient poll failures; user can still receive SSE resolution.
      } finally {
        extractionPollingInFlightRef.current = false;
      }
    };

    extractionPollIntervalRef.current = setInterval(() => {
      void pollExtractionStatus();
    }, EXTRACTION_POLL_INTERVAL_MS);

    return () => {
      if (extractionPollIntervalRef.current) {
        clearInterval(extractionPollIntervalRef.current);
        extractionPollIntervalRef.current = null;
      }
      extractionPollingInFlightRef.current = false;
    };
  }, [extractingUploadId, closeDetail, loadQueue, page]);

  useEffect(() => {
    return () => {
      if (extractingTimeoutRef.current) {
        clearTimeout(extractingTimeoutRef.current);
      }
      if (extractionPollIntervalRef.current) {
        clearInterval(extractionPollIntervalRef.current);
      }
    };
  }, []);

  const onReject = async (values: RejectFormValues) => {
    if (selectedId === null) return;
    setIsRejecting(true);
    try {
      await rejectUpload(selectedId, values.reason.trim());
      toast.success("Đã từ chối upload.");
      closeDetail();
      await loadQueue(page);
    } catch {
      toast.error("Lỗi khi từ chối.");
    } finally {
      setIsRejecting(false);
    }
  };

  const previewItems = useMemo(() => {
    if (!selectedDetail?.viewUrls) return [];
    return selectedDetail.viewUrls.map((url, index) => ({ url, index }));
  }, [selectedDetail]);

  const isPdfPreview = useMemo(() => {
    if (!selectedDetail?.viewUrls?.length) return false;
    const contentType = selectedDetail.contentType?.toLowerCase() ?? "";
    if (contentType === "application/pdf") return true;
    const firstObjectKey = selectedDetail.objectKeys?.[0]?.toLowerCase() ?? "";
    return firstObjectKey.endsWith(".pdf");
  }, [selectedDetail]);

  const markPreviewFailed = (index: number) => {
    setFailedPreviewIndexes((current) => {
      const next = new Set(current);
      next.add(index);
      return next;
    });
  };

  useEffect(() => {
    if (tab !== "preview" || !selectedDetail?.viewUrls?.length) {
      setPreviewBlobUrls({});
      setIsLoadingPreview(false);
      return undefined;
    }

    let cancelled = false;
    const createdUrls: string[] = [];

    setIsLoadingPreview(true);
    setPreviewBlobUrls({});
    setFailedPreviewIndexes(new Set());

    Promise.all(
      selectedDetail.viewUrls.map(async (_url, index) => {
        try {
          const blob = await fetchUploadPageBlob(selectedDetail.id, index + 1);
          const objectUrl = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return [index, null] as const;
          }
          createdUrls.push(objectUrl);
          return [index, objectUrl] as const;
        } catch {
          return [index, null] as const;
        }
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        const nextUrls: Record<number, string> = {};
        const nextFailed = new Set<number>();

        entries.forEach(([index, objectUrl]) => {
          if (objectUrl) {
            nextUrls[index] = objectUrl;
          } else {
            nextFailed.add(index);
          }
        });

        setPreviewBlobUrls(nextUrls);
        setFailedPreviewIndexes(nextFailed);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      });

    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [tab, selectedDetail?.id, selectedDetail?.viewUrls?.length]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "contributor" ? "Duyệt đề từ học sinh" : "Duyệt upload đề thi"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "contributor"
                ? "Các đề người dùng thường gửi lên sẽ xuất hiện ở đây để contributor duyệt. Danh sách file bạn tự upload nằm ở mục Đề tôi đã upload."
                : "Các yêu cầu upload đang chờ duyệt. Bấm vào một hàng để xem chi tiết."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue(page)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Uploader
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Số trang
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ngày gửi
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingQueue && queue.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Không có yêu cầu chờ duyệt.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => void openDetail(item.id)}
                    data-testid={`upload-row-${item.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      #{item.uploaderId} · {item.uploaderRole}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.pageCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                        Chờ duyệt
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => void loadQueue(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-600">
              Trang {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => void loadQueue(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {selectedId !== null && (
        <div className="fixed inset-0 z-[90] flex">
          <button
            type="button"
            aria-label="Đóng chi tiết"
            className="flex-1 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedDetail?.title ?? "Đang tải..."}
                </h2>
                {selectedDetail && (
                  <p className="text-xs text-slate-500">
                    #{selectedDetail.id} · Uploader{" "}
                    #{selectedDetail.uploaderId} ·{" "}
                    {selectedDetail.pageCount} trang
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <nav className="flex gap-2 border-b border-slate-100 px-6 py-2">
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "preview" ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Xem trước
              </button>
              <button
                type="button"
                onClick={() => setTab("history")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "history" ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <History className="h-4 w-4" />
                Lịch sử duyệt
              </button>
            </nav>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetail ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải chi tiết...
                </div>
              ) : tab === "preview" ? (
                selectedDetail?.description ? (
                  <p className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {selectedDetail.description}
                  </p>
                ) : null
              ) : null}

              {tab === "preview" && !isLoadingDetail && previewItems.length > 0 && (
                <div className="space-y-4">
                  {isPdfPreview
                    ? previewItems.map((p) => {
                        const previewSrc = previewBlobUrls[p.index];
                        if (failedPreviewIndexes.has(p.index)) {
                          return (
                            <PreviewUnavailable key={p.index} pageNumber={p.index + 1} />
                          );
                        }
                        if (isLoadingPreview || !previewSrc) {
                          return <PreviewLoading key={p.index} pageNumber={p.index + 1} />;
                        }
                        return (
                          <iframe
                            key={p.index}
                            src={previewSrc}
                            title={`Trang ${p.index + 1}`}
                            onError={() => markPreviewFailed(p.index)}
                            className="h-[600px] w-full rounded-xl border border-slate-200"
                          />
                        );
                      })
                    : previewItems.map((p) => {
                        const previewSrc = previewBlobUrls[p.index];
                        return (
                          <figure
                            key={p.index}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >
                            {failedPreviewIndexes.has(p.index) ? (
                              <PreviewUnavailable pageNumber={p.index + 1} />
                            ) : isLoadingPreview || !previewSrc ? (
                              <PreviewLoading pageNumber={p.index + 1} />
                            ) : (
                              <img
                                src={previewSrc}
                                alt={`Trang ${p.index + 1}`}
                                onError={() => markPreviewFailed(p.index)}
                                className="w-full"
                              />
                            )}
                            <figcaption className="bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                              Trang {p.index + 1}
                            </figcaption>
                          </figure>
                        );
                      })}
                </div>
              )}

              {tab === "preview" && !isLoadingDetail && previewItems.length === 0 && (
                <PreviewUnavailable />
              )}

              {tab === "history" && (
                <div>
                  {isLoadingHistory ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải lịch sử...
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có lịch sử.</p>
                  ) : (
                    <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                      {history.map((h) => (
                        <li key={h.id} className="relative">
                          <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-cyan-500" />
                          <p className="text-sm font-semibold text-slate-900">
                            {h.action}
                            {h.previousStatus && (
                              <span className="ml-2 text-xs font-normal text-slate-500">
                                {h.previousStatus} → {h.newStatus}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(h.createdAt).toLocaleString("vi-VN")}
                            {h.actorRole ? ` · ${h.actorRole}` : ""}
                          </p>
                          {h.note && (
                            <p className="mt-1 text-xs italic text-slate-600">
                              “{h.note}”
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>

            {tab === "preview" &&
              selectedDetail?.status === "PENDING_APPROVAL" && (
                <footer className="space-y-3 border-t border-slate-100 bg-slate-50 p-6">
                  <form
                    onSubmit={handleSubmit(onReject)}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="reject-reason"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Lý do từ chối
                    </label>
                    <textarea
                      id="reject-reason"
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
                      placeholder="Nhập lý do (tối thiểu 5 ký tự)..."
                      {...register("reason")}
                    />
                    {errors.reason && (
                      <p className="text-xs text-rose-600">
                        {errors.reason.message}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isRejecting || isApproving}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        {isRejecting ? "Đang xử lý..." : "Từ chối"}
                      </button>
                      <button
                        type="button"
                        disabled={isApproving || isRejecting}
                        onClick={() => void onApprove()}
                        data-testid="approve-btn"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isApproving ? "Đang duyệt..." : "Duyệt"}
                      </button>
                    </div>
                  </form>
                </footer>
              )}
            {extractingUploadId !== null && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm"
                role="status"
                aria-live="polite"
                data-testid="extracting-overlay"
              >
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-slate-700">
                  Đang trích xuất…
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUploadQueue;
