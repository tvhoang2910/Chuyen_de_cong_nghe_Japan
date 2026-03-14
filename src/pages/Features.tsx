import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChartColumnIncreasing, ShieldCheck, TimerReset, ArrowRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const featureItems = [
  {
    icon: Brain,
    title: 'Spaced Repetition (SM-2)',
    description: 'Tự động nhắc lại đúng thời điểm để đưa kiến thức vào trí nhớ dài hạn.',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Phân tích năng lực theo môn',
    description: 'Radar chart và thống kê giúp bạn thấy rõ điểm yếu cần cải thiện.',
  },
  {
    icon: TimerReset,
    title: 'Lịch ôn tập thông minh',
    description: 'Ưu tiên câu hỏi dễ quên để tối ưu thời gian học trước kỳ thi.',
  },
  {
    icon: ShieldCheck,
    title: 'Đăng nhập an toàn JWT',
    description: 'Hỗ trợ refresh token, blacklist token và đăng xuất an toàn.',
  },
];

const Features: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader active="features" />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="text-center mb-12">
          <p className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-4">
            Feature Overview
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Tất cả công cụ để ôn thi hiệu quả</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Từ tìm kiếm đề thi, luyện tập theo lịch thông minh đến phân tích năng lực, mọi thứ tập trung trong một nơi.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-14 bg-slate-900 text-white rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Sẵn sàng tăng tốc điểm số?</h2>
            <p className="text-slate-300">Tạo tài khoản miễn phí để bắt đầu ôn tập ngay hôm nay.</p>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors text-white px-5 py-3 rounded-xl font-bold"
          >
            Bắt đầu ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Features;
