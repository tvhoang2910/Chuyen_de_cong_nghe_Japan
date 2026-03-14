import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const plans = [
  {
    name: 'Free',
    price: '0đ',
    period: '/tháng',
    description: 'Dành cho sinh viên bắt đầu luyện đề.',
    features: ['Làm đề cơ bản', 'Theo dõi điểm số', 'Dashboard tiến độ'],
    cta: 'Dùng miễn phí',
    ctaLink: '/register',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '99.000đ',
    period: '/tháng',
    description: 'Tối ưu hóa toàn bộ quá trình ôn tập.',
    features: ['Không giới hạn đề thi', 'Phân tích AI nâng cao', 'Ưu tiên hỗ trợ'],
    cta: 'Nâng cấp Premium',
    ctaLink: '/register',
    highlight: true,
  },
];

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader active="pricing" />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="text-center mb-14">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Gói phù hợp cho từng mục tiêu học tập</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Bắt đầu miễn phí và nâng cấp khi bạn cần nhiều đề thi hơn cùng phân tích chuyên sâu.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-3xl border p-8 shadow-sm ${
                plan.highlight
                  ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className={`mb-5 ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}>{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.highlight ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaLink}
                className={`inline-flex justify-center w-full rounded-xl px-4 py-3 font-bold transition-colors ${
                  plan.highlight
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Pricing;
