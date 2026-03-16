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
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <FileJson className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-none">Import dữ liệu</h2>
          <p className="text-xs text-slate-500 mt-1">Đồng bộ nhanh danh sách người dùng qua JSON.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={onGenerateSample}
            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            Tạo JSON mẫu
          </button>
          <button
            onClick={onCopySample}
            className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Copy mẫu
          </button>
        </div>

        <textarea
          value={importJsonInput}
          onChange={(e) => setImportJsonInput(e.target.value)}
          rows={8}
          className="w-full p-4 bg-slate-900 text-cyan-400 font-mono text-xs rounded-2xl border-none focus:ring-4 focus:ring-cyan-600/10 outline-none transition-all placeholder:text-slate-700"
          placeholder={'[{"email":"teacher@example.com","fullName":"Teacher","password":"strong-pass-123"}]'}
        />

        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer group border border-transparent hover:border-slate-200 transition-all">
          <input
            type="checkbox"
            checked={skipExistingOnImport}
            onChange={(e) => setSkipExistingOnImport(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600/20"
          />
          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">Bỏ qua tài khoản đã tồn tại email</span>
        </label>

        <button
          onClick={onImport}
          disabled={isImporting || !importJsonInput.trim()}
          className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isImporting ? 'Đang xử lý...' : 'Xác nhận Import JSON'}
        </button>

        {lastImportResult && (
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
             <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Kết quả gần nhất</span>
                <span className="text-cyan-600">Tổng: {lastImportResult.total}</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Thành công</p>
                   <p className="text-lg font-bold text-emerald-600">{lastImportResult.created}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Bỏ qua</p>
                   <p className="text-lg font-bold text-amber-600">{lastImportResult.skipped}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Thất bại</p>
                   <p className="text-lg font-bold text-rose-600">{lastImportResult.failed}</p>
                </div>
             </div>
             {lastImportResult.errors.length > 0 && (
               <ul className="max-h-32 overflow-y-auto space-y-1 mt-2 pr-1">
                 {lastImportResult.errors.map((error) => (
                   <li key={`${error.index}-${error.email}-${error.reason}`} className="text-[10px] text-rose-500 bg-rose-50 p-1.5 rounded-lg border border-rose-100">
                     Line {error.index}: {error.email} - {error.reason}
                   </li>
                 ))}
               </ul>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportUserSection;
