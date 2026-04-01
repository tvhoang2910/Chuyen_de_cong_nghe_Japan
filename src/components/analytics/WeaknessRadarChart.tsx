import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { RadarPoint } from '../../api/studyClient';

type Props = {
  points: RadarPoint[];
};

export const WeaknessRadarChart: React.FC<Props> = ({ points }) => {
  if (!points || points.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic text-center py-8">
        Chưa có dữ liệu — hãy làm thêm đề thi để hệ thống phân tích.
      </p>
    );
  }

  const isFallbackUntagged = points.length === 1 && points[0].tagId === 0;

  const data = points.map((p) => ({
    subject: p.tagId === 0 ? 'Chưa gắn tag' : p.tagName,
    score: Math.round(p.correctRate),
    fullMark: 100,
  }));

  return (
    <div className="h-full">
      {isFallbackUntagged && (
        <p className="mb-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Radar đang dùng fallback tổng hợp vì dữ liệu bài làm chưa gắn tag.
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Tỷ lệ đúng']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
          <Radar
            name="Điểm mạnh"
            dataKey="score"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
