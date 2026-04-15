import React from 'react';
import { FileJson, Copy } from 'lucide-react';
import { type ImportAdminUsersResponse } from '../../api/axiosClient';

interface ImportUserSectionProps {
  importJsonInput: string;
  setImportJsonInput: (value: string) => void;
  skipExistingOnImport: boolean;
  setSkipExistingOnImport: (value: boolean) => void;
  isImporting: boolean;
  onImport: () => void;
  onGenerateSample: () => void;
  onCopySample: () => void;
  lastImportResult: ImportAdminUsersResponse | null;
}

const ImportUserSection: React.FC<ImportUserSectionProps> = ({
  importJsonInput,
  setImportJsonInput,
  skipExistingOnImport,
  setSkipExistingOnImport,
  isImporting,
  onImport,
  onGenerateSample,
  onCopySample,
  lastImportResult,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <FileJson className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Dữ liệu JSON</h3>
          <p className="text-xs text-slate-500">Nhập danh sách user để tạo hàng loạt.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={onGenerateSample}
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          Tạo JSON mẫu
        </button>
        <button
          onClick={onCopySample}
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy mẫu
        </button>
      </div>

      <textarea
        value={importJsonInput}
        onChange={(e) => setImportJsonInput(e.target.value)}
        rows={12}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
        placeholder={'[{"email":"teacher@example.com","fullName":"Teacher","password":"strong-pass-123"}]'}
      />

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={skipExistingOnImport}
          onChange={(e) => setSkipExistingOnImport(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600/30"
        />
        Bỏ qua tài khoản đã tồn tại email
      </label>

      <button
        onClick={onImport}
        disabled={isImporting || !importJsonInput.trim()}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isImporting ? 'Đang xử lý...' : 'Xác nhận import'}
      </button>

      {lastImportResult && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wide">Kết quả gần nhất</span>
            <span className="font-semibold">Tổng: {lastImportResult.total}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ResultMetric label="Thành công" value={lastImportResult.created} tone="emerald" />
            <ResultMetric label="Bỏ qua" value={lastImportResult.skipped} tone="amber" />
            <ResultMetric label="Thất bại" value={lastImportResult.failed} tone="rose" />
          </div>

          {lastImportResult.errors.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {lastImportResult.errors.map((error) => (
                <li
                  key={`${error.index}-${error.email}-${error.reason}`}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700"
                >
                  Dòng {error.index}: {error.email} - {error.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

interface ResultMetricProps {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'rose';
}

const ResultMetric: React.FC<ResultMetricProps> = ({ label, value, tone }) => {
  const toneClasses: Record<ResultMetricProps['tone'], string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-xl border px-2 py-1.5 text-center ${toneClasses[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-none">{value}</p>
    </div>
  );
};

export default ImportUserSection;
