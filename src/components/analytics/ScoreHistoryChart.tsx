import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ScorePoint } from '../../api/studyClient';

type Props = {
  points: ScorePoint[];
};

export const ScoreHistoryChart: React.FC<Props> = ({ points }) => {
  if (!points || points.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-8">
        Chưa có lịch sử điểm số.
      </p>
    );
  }

  // Most recent last (chronological order)
  const data = [...points].reverse();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="period"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickFormatter={(v: string) => {
            const [y, m] = v.split('-');
            return `${m}/${y.slice(2)}`;
          }}
        />
        <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Điểm TB']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="avgScorePercent"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#2563eb' }}
          activeDot={{ r: 6 }}
          name="Điểm TB"
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
