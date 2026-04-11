import React from 'react';
import { Crown, Lock, Sparkles } from 'lucide-react';

type PremiumUpsellModalProps = {
  open: boolean;
  title: string;
  description: string;
  teaserQuestionCount?: number;
  onClose: () => void;
  onUpgrade: () => void;
};

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({
  open,
  title,
  description,
  teaserQuestionCount,
  onClose,
  onUpgrade,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Crown className="h-3.5 w-3.5" /> Premium Content
        </div>
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>

        {typeof teaserQuestionCount === 'number' && teaserQuestionCount > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-white/70 p-3 text-sm text-amber-900">
            <p className="font-semibold">Bạn đang ở chế độ xem thử</p>
            <p className="mt-1">
              Bạn có thể xem trước {teaserQuestionCount} câu hỏi đầu tiên. Nâng cấp để mở toàn bộ đề và bắt đầu làm bài.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Sparkles className="h-4 w-4" /> Nâng cấp Premium
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Lock className="h-4 w-4" /> Để sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsellModal;
