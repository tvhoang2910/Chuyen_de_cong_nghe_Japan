import React, { useState } from 'react';
import { Flag, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitQuestionReport, type ReportType } from '../api/examClient';

type ReportModalProps = {
  questionId: number;
  attemptId: number;
  questionContent: string;
  onClose: () => void;
  onSuccess: () => void;
};

const REPORT_OPTIONS: Array<{ value: ReportType; label: string }> = [
  { value: 'WRONG_ANSWER', label: 'Đáp án sai' },
  { value: 'TYPO', label: 'Chính tả' },
  { value: 'MISSING_INFORMATION', label: 'Thiếu thông tin' },
  { value: 'INVALID_QUESTION', label: 'Đề sai' },
  { value: 'OTHER', label: 'Khác' },
];

const ReportModal: React.FC<ReportModalProps> = ({ questionId, attemptId, questionContent, onClose, onSuccess }) => {
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!reportType) {
      toast.error('Vui lòng chọn loại lỗi.');
      return;
    }

    setSubmitting(true);
    try {
      await submitQuestionReport(questionId, attemptId, {
        reportType,
        description: description.trim() || undefined,
      });
      toast.success('Đã gửi báo cáo.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Gửi báo cáo thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitReport();
  };

  const handleDescriptionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || submitting) {
      return;
    }

    event.preventDefault();
    void submitReport();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
              <Flag className="h-4 w-4 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Báo lỗi câu hỏi</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form className="space-y-4 p-6" onSubmit={handleSubmit}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Câu hỏi</p>
            <p>{questionContent}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Loại lỗi</label>
            <div className="grid gap-2">
              {REPORT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    reportType === option.value
                      ? 'border-rose-400 bg-rose-50 text-rose-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="reportType"
                    value={option.value}
                    checked={reportType === option.value}
                    onChange={() => setReportType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Mô tả (tùy chọn)</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              placeholder="Mô tả thêm lỗi bạn phát hiện..."
              rows={4}
              maxLength={1000}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{description.length}/1000</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 font-bold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gửi báo cáo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
