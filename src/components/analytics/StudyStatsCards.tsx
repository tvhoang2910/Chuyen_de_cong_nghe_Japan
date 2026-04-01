import { Flame, Clock, Target, Zap } from 'lucide-react';
import type { StudyStats } from '../../api/studyClient';

type Props = {
  stats: StudyStats;
};

export const StudyStatsCards: React.FC<Props> = ({ stats }) => {
  const cards = [
    {
      label: 'Tổng lần thi',
      value: stats.totalAttempts,
      icon: <Target className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Điểm TB',
      value: stats.avgScorePercent != null ? `${stats.avgScorePercent.toFixed(1)}%` : '--',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Ngày Streak',
      value: stats.streakDays,
      icon: <Flame className="w-5 h-5" />,
      color: 'text-orange-500 bg-orange-50',
    },
    {
      label: 'Thời gian học',
      value: stats.totalStudyMinutes > 0
        ? `${Math.round(stats.totalStudyMinutes / 60)}h`
        : '--',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm"
        >
          <div className={`p-2.5 rounded-xl ${card.color}`}>
            {card.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 leading-none">
              {String(card.value)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
