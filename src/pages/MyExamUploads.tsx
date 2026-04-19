import { Fragment, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import {
  fetchMyUploads,
  fetchUploadHistory,
  type ExamUploadHistoryResponse,
  type ExamUploadResponse,
  type ExamUploadStatus,
} from "../api/examUploadClient";
import { useExamEventsSSE } from "../hooks/useExamEventsSSE";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ExamUploadStatus, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt, chờ trích xuất",
  REJECTED: "Bị từ chối",
  EXTRACTING: "Đang trích xuất",
  EXTRACTED: "Đã trích xuất",
  EXTRACT_FAILED: "Trích xuất lỗi",
  SELF_UPLOADED: "Tự upload",
};

const STATUS_CLASS: Record<ExamUploadStatus, string> = {
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  EXTRACTING: "bg-blue-50 text-blue-700 border-blue-200",
  EXTRACTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EXTRACT_FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  SELF_UPLOADED: "bg-slate-50 text-slate-700 border-slate-200",
};

const StatusIcon: React.FC<{ status: ExamUploadStatus }> = ({ status }) => {
  if (status === "APPROVED" || status === "EXTRACTED") {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  if (status === "REJECTED" || status === "EXTRACT_FAILED") {
    return <XCircle className="h-4 w-4" />;
  }
  if (status === "EXTRACTING") {
    return <AlertCircle className="h-4 w-4" />;
  }
  return <Clock className="h-4 w-4" />;
};

const MyExamUploads: React.FC = () => {
  const [items, setItems] = useState<ExamUploadResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyMap, setHistoryMap] = useState<
    Record<number, ExamUploadHistoryResponse[]>
  >({});
  const [historyLoading, setHistoryLoading] = useState<number | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    try {
      const res = await fetchMyUploads(nextPage, PAGE_SIZE);
      setItems(res.content);
      setTotalPages(Math.max(res.totalPages, 1));
      setPage(res.page);
    } catch {
      toast.error("Không tải được lịch sử upload.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  // Realtime updates via SSE.
  const accessToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("access_token");
  const { subscribe } = useExamEventsSSE(accessToken);

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (
        event.eventType === "AI_EXTRACTION_SUCCESS" ||
        event.eventType === "AI_EXTRACTION_FAILED"
      ) {
        void load(page);
      }
    });
    return unsubscribe;
  }, [subscribe, load, page]);

  // Polling fallback while any upload is still being extracted.
  useEffect(() => {
    const hasExtracting = items.some((u) => u.status === "EXTRACTING");
    if (!hasExtracting) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      void load(page);
    }, 8000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [items, load, page]);

  const toggleExpand = async (uploadId: number) => {
    if (expandedId === uploadId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(uploadId);
    if (!historyMap[uploadId]) {
      setHistoryLoading(uploadId);
      try {
        const history = await fetchUploadHistory(uploadId);
        setHistoryMap((prev) => ({ ...prev, [uploadId]: history }));
      } catch {
        toast.error("Không tải được lịch sử duyệt.");
      } finally {
        setHistoryLoading(null);
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Đề đã upload
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi trạng thái duyệt và lý do từ chối (nếu có).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(page)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Số trang
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ngày gửi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Bạn chưa upload đề nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isOpen = expandedId === item.id;
                  const history = historyMap[item.id];
                  return (
                    <Fragment key={item.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleExpand(item.id)}
                            className="rounded-lg p-1.5 hover:bg-slate-100"
                            aria-label="Mở lịch sử"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[item.status]}`}
                          >
                            <StatusIcon status={item.status} />
                            {STATUS_LABEL[item.status]}
                          </span>
                          {item.status === "REJECTED" &&
                            item.rejectionReason && (
                              <p className="mt-1 text-xs text-rose-600">
                                {item.rejectionReason}
                              </p>
                            )}
                          {item.status === "EXTRACTED" &&
                            item.extractedExamId && (
                              <Link
                                to={`/dashboard/exams/${item.extractedExamId}`}
                                className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Mở đề đã trích xuất
                              </Link>
                            )}
                          {item.status === "EXTRACT_FAILED" && (
                            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                              {item.extractionError ??
                                item.rejectionReason ??
                                "Trích xuất thất bại không rõ nguyên nhân."}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {item.pageCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td
                            colSpan={5}
                            className="bg-slate-50 px-8 py-4"
                          >
                            {historyLoading === item.id ? (
                              <p className="text-sm text-slate-500">
                                Đang tải lịch sử...
                              </p>
                            ) : history && history.length > 0 ? (
                              <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
                                {history.map((h) => (
                                  <li key={h.id} className="relative">
                                    <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-blue-500" />
                                    <p className="text-sm font-semibold text-slate-900">
                                      {h.action}
                                      {h.previousStatus && (
                                        <>
                                          {" "}
                                          ·{" "}
                                          <span className="text-slate-500">
                                            {h.previousStatus} →{" "}
                                            {h.newStatus}
                                          </span>
                                        </>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {new Date(h.createdAt).toLocaleString(
                                        "vi-VN",
                                      )}
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
                            ) : (
                              <p className="text-sm text-slate-500">
                                Chưa có lịch sử.
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => void load(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-sm text-slate-600">
              Trang {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => void load(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyExamUploads;
