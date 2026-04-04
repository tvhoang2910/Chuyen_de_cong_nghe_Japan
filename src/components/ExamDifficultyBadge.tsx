import React from 'react';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD' | null | undefined;

interface ExamDifficultyBadgeProps {
  difficulty: DifficultyLevel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const CONFIG: Record<Exclude<DifficultyLevel, null | undefined>, {
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  EASY:      { label: 'Dễ',         bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  MEDIUM:    { label: 'Trung bình', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  HARD:      { label: 'Khó',        bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
  VERY_HARD: { label: 'Cực khó',   bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200'  },
};

export const ExamDifficultyBadge: React.FC<ExamDifficultyBadgeProps> = ({
  difficulty,
  size = 'md',
  showLabel = true,
}) => {
  if (!difficulty) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Chưa đánh giá
      </span>
    );
  }

  const cfg = CONFIG[difficulty] ?? CONFIG.MEDIUM;
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      title={`Độ khó: ${cfg.label}`}
      className={`inline-flex items-center gap-1 rounded font-medium border ${sizeClass} ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {difficulty === 'VERY_HARD' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )}
      {difficulty === 'HARD' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {showLabel && cfg.label}
    </span>
  );
};
