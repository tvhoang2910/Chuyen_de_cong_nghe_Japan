import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { AlertTriangle, CheckCircle2, Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import MainLayout from '../components/MainLayout';
import {
  fetchReportQueue,
  fetchProcessedReportQueue,
  fetchReportsForQuestion,
  fetchReportHistory,
  resolveQuestionReports,
  type ReportQueueItem,
  type ResolveReportPayload,
  type QuestionReportHistoryResponse,
} from '../api/reportClient';
import type { QuestionReportResponse } from '../api/examClient';

type AdminReportsProps = {
  mode: 'admin' | 'contributor';
};

const STATUS_OPTIONS: Array<{ value: ResolveReportPayload['status']; label: string }> = [
  { value: 'REVIEWING', label: 'Đang xem xét' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'REJECTED', label: 'Từ chối báo cáo' },
];

const getSeverityTone = (count: number): string => {
  if (count >= 8) {
    return 'text-rose-700 bg-rose-100';
  }
  if (count >= 4) {
    return 'text-amber-700 bg-amber-100';
  }
  return 'text-emerald-700 bg-emerald-100';
};

const AdminReports: React.FC<AdminReportsProps> = ({ mode }) => {
  const Layout = useMemo(() => (mode === 'admin' ? AdminLayout : MainLayout), [mode]);

  const [queueItems, setQueueItems] = useState<ReportQueueItem[]>([]);
  const [processedItems, setProcessedItems] = useState<ReportQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReportQueueItem | null>(null);
  const [selectedReports, setSelectedReports] = useState<QuestionReportResponse[]>([]);
  const [processingHistory, setProcessingHistory] = useState<QuestionReportHistoryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolveForm, setResolveForm] = useState<ResolveReportPayload>({
    status: 'REVIEWING',
    resolutionNote: '',
    unhideQuestion: false,
  });

  const processedOnlyItems = useMemo(() => {
    const openQuestionIds = new Set(queueItems.map((item) => item.questionId));
    return processedItems.filter((item) => !openQuestionIds.has(item.questionId));
  }, [processedItems, queueItems]);

  const hasActionableReports = useMemo(
    () => selectedReports.some((report) => report.status === 'REPORTED' || report.status === 'REVIEWING'),
    [selectedReports],
  );

  const loadQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const [queueResponse, processedResponse] = await Promise.all([
        fetchReportQueue(page, 20),
        fetchProcessedReportQueue(0, 20),
      ]);
      setQueueItems(queueResponse.content);
      setProcessedItems(processedResponse.content);
      setTotalPages(queueResponse.totalPages);
      setSelectedItem((current) => {
        const combinedItems = [...queueResponse.content, ...processedResponse.content];

        if (!current) {
          return queueResponse.content[0] ?? processedResponse.content[0] ?? null;
        }

        const matched = combinedItems.find((item) => item.questionId === current.questionId);
        return matched ?? current;
      });
    } catch {
      toast.error('Không thể tải hàng chờ báo cáo câu hỏi.');
    } finally {
      setIsLoadingQueue(false);
    }
  }, [page]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const loadReportsForQuestion = async () => {
      if (!selectedItem) {
        setSelectedReports([]);
        setProcessingHistory([]);
        return;
      }

      try {
        setIsLoadingReports(true);
        const [rows, history] = await Promise.all([
          fetchReportsForQuestion(selectedItem.questionId),
          fetchReportHistory(selectedItem.questionId),
        ]);
        setSelectedReports(rows);
        setProcessingHistory(history);
      } catch {
        toast.error('Không thể tải chi tiết báo cáo cho câu hỏi đã chọn.');
        setSelectedReports([]);
        setProcessingHistory([]);
      } finally {
        setIsLoadingReports(false);
      }
    };

    setResolveForm({
      status: 'REVIEWING',
      resolutionNote: '',
      unhideQuestion: false,
    });
    setProcessingHistory([]);

    void loadReportsForQuestion();
  }, [selectedItem]);

  const handleResolve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem || isSubmitting) {
      return;
    }

    const resolvedQuestionId = selectedItem.questionId;

    try {
      setIsSubmitting(true);
      await resolveQuestionReports(resolvedQuestionId, {
        status: resolveForm.status,
        resolutionNote: resolveForm.resolutionNote?.trim() || undefined,
        unhideQuestion: resolveForm.unhideQuestion,
      });
      toast.success('Đã cập nhật trạng thái xử lý báo cáo.');
      await loadQueue();

      const [rows, history] = await Promise.all([
        fetchReportsForQuestion(resolvedQuestionId),
        fetchReportHistory(resolvedQuestionId),
      ]);
      setSelectedReports(rows);
      setProcessingHistory(history);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể xử lý báo cáo lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Trung tâm báo cáo câu hỏi</h1>
              <p className="mt-2 text-sm text-slate-200">
                Theo dõi câu hỏi bị báo lỗi và xử lý trực tiếp ngay trên từng cụm báo cáo.
              </p>
            </div>
            <button
              type="button"
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
              <h2 className="text-lg font-bold text-slate-900">Danh sách câu hỏi cần xử lý</h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{queueItems.length} mục</span>
            </div>

            <div className="space-y-3">
              {isLoadingQueue ? (
                [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
              ) : queueItems.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Không có báo cáo đang chờ xử lý.</p>
              ) : (
                queueItems.map((item) => (
                  <button
                    key={item.questionId}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedItem?.questionId === item.questionId
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">Q#{item.questionId} • {item.examTitle}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getSeverityTone(item.totalReportCount)}`}>
                        {item.totalReportCount} báo cáo
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.questionPreview}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Loại nổi bật: {item.topReportTypeLabel}</span>
                      <span>{new Date(item.latestReportedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="px-2 text-sm font-bold uppercase tracking-wide text-slate-500">Đã xử lý gần đây</h3>
              {isLoadingQueue ? (
                [1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              ) : processedOnlyItems.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">Chưa có lịch sử xử lý.</p>
              ) : (
                processedOnlyItems.map((item) => (
                  <button
                    key={`processed-${item.questionId}`}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedItem?.questionId === item.questionId
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">Q#{item.questionId} • {item.examTitle}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Đã xử lý
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.questionPreview}</p>
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 0))}
                  disabled={page === 0 || isLoadingQueue}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Trang trước
                </button>
                <span className="text-xs font-semibold text-slate-500">Trang {page + 1}/{Math.max(totalPages, 1)}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(current + 1, Math.max(totalPages - 1, 0)))}
                  disabled={page >= totalPages - 1 || isLoadingQueue}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selectedItem ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Chọn một câu hỏi ở cột bên trái để xem chi tiết.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Chi tiết câu hỏi #{selectedItem.questionId}</h2>
                    <p className="text-sm text-slate-500">Đề thi: {selectedItem.examTitle}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> {selectedItem.uniqueReportersCount} người báo cáo
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="mb-2 font-semibold text-slate-900">Nội dung rút gọn</p>
                  <p>{selectedItem.questionPreview}</p>
                  <p className="mt-3 text-xs text-slate-500">Exam ID: {selectedItem.examId} • Cập nhật: {new Date(selectedItem.latestReportedAt).toLocaleString('vi-VN')}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Lịch sử báo cáo</h3>
                  {isLoadingReports ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                    </div>
                  ) : selectedReports.length === 0 ? (
                    <p className="text-sm text-slate-500">Không có dữ liệu chi tiết.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedReports.map((report) => (
                        <article key={report.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{report.reportTypeLabel}</p>
                            <span className="text-xs font-semibold text-slate-500">{report.statusLabel}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{report.description || 'Không có mô tả chi tiết.'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Reporter: {report.reporterUsername} • {new Date(report.createdAt).toLocaleString('vi-VN')}
                          </p>
                          {report.resolutionNote ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                              <Eye className="h-3.5 w-3.5" /> Ghi chú xử lý: {report.resolutionNote}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {hasActionableReports ? (
                  <form className="space-y-3" onSubmit={handleResolve}>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Cập nhật trạng thái xử lý</h3>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái mới</span>
                      <select
                        value={resolveForm.status}
                        onChange={(event) =>
                          setResolveForm((current) => ({
                            ...current,
                            status: event.target.value as ResolveReportPayload['status'],
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Ghi chú</span>
                      <textarea
                        value={resolveForm.resolutionNote ?? ''}
                        onChange={(event) =>
                          setResolveForm((current) => ({
                            ...current,
                            resolutionNote: event.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Mô tả cách xử lý hoặc lý do từ chối báo cáo"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={resolveForm.unhideQuestion}
                        onChange={(event) =>
                          setResolveForm((current) => ({
                            ...current,
                            unhideQuestion: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      Bỏ ẩn câu hỏi sau khi xử lý
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting || isLoadingReports}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Cập nhật xử lý
                    </button>
                  </form>
                ) : (
                  <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    Câu hỏi này đã xử lý xong. Bạn có thể xem lại toàn bộ lịch sử xử lý bên dưới và trong mục Đã xử lý gần đây.
                  </p>
                )}

                {/* NEW SECTION: Processing History */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Lịch sử xử lý</h3>
                  {isLoadingReports ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                    </div>
                  ) : processingHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có lịch sử xử lý. Trạng thái ban đầu của các báo cáo.</p>
                  ) : (
                    <div className="space-y-2">
                      {processingHistory.map((h) => (
                        <article key={h.id} className="rounded-xl bg-indigo-50 p-3 text-sm text-slate-700">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-indigo-800">{h.actionLabel}</p>
                            <span className="text-xs font-semibold text-slate-500">
                              {new Date(h.processedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {h.note ? <p className="mt-1 text-xs text-indigo-700">Ghi chú: {h.note}</p> : null}
                          {h.newStatus && (
                            <p className="mt-1 text-xs text-slate-500">
                              Trạng thái: <span className="font-medium">{h.newStatus}</span>
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Khi chọn "Đã xử lý", hệ thống sẽ gửi web push tới các user đã báo lỗi (nếu user có bật push notification).
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AdminReports;
