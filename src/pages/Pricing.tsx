import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const plans = [
  {
    name: 'Free',
    price: '0đ',
    period: '/tháng',
    description: 'Dành cho sinh viên bắt đầu luyện đề cơ bản.',
    features: ['Làm đề thi công khai', 'Theo dõi điểm số cơ bản', 'Dashboard cá nhân', 'Đăng nhập Google'],
    cta: 'Dùng miễn phí',
    ctaLink: '/register',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '99k',
    period: '/tháng',
    description: 'Tối ưu hóa toàn bộ quá trình ôn tập với AI.',
    features: ['Không giới hạn đề thi', 'Phân tích AI chuyên sâu', 'Chế độ ôn tập Offline', 'Ưu tiên hỗ trợ 24/7', 'Không quảng cáo'],
    cta: 'Nâng cấp Premium',
    ctaLink: '/register',
    highlight: true,
  },
];

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <PublicHeader active="pricing" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-float" />
        </div>

        <section className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 shadow-sm mb-6 font-black text-xs uppercase tracking-widest text-amber-700"
          >
            <Sparkles className="w-3 h-3" /> Flexible Plans
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6"
          >
            Đầu tư cho <br /><span className="text-gradient">Tương lai của bạn.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-xl font-medium"
          >
            Bắt đầu miễn phí và nâng cấp khi bạn sẵn sàng chinh phục những nấc thang tri thức cao hơn.
          </motion.p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-[3rem] border p-10 md:p-12 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                plan.highlight
                  ? 'bg-slate-900 text-white border-slate-800 shadow-blue-900/20'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                  Recommended
                </div>
              )}

              <div className="mb-10">
                <h2 className="text-3xl font-black mb-4 tracking-tight">{plan.name}</h2>
                <p className={`text-lg font-medium leading-relaxed ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-10 flex items-baseline gap-2">
                <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                <span className={`text-lg font-bold ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {plan.period}
                </span>
              </div>

              <div className={`h-px w-full mb-10 ${plan.highlight ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

              <ul className="space-y-5 mb-12">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-4 group">
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${plan.highlight ? 'bg-blue-500/20 group-hover:bg-blue-500' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                       <Check className={`w-3.5 h-3.5 ${plan.highlight ? 'text-blue-400 group-hover:text-white' : 'text-blue-600'}`} strokeWidth={3} />
                    </div>
                    <span className="font-bold text-lg tracking-tight opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaLink}
                className={`flex justify-center w-full rounded-[1.5rem] px-8 py-5 font-black text-lg transition-all active:scale-95 shadow-2xl ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.article>
          ))}
        </section>

        {/* Comparison Trust Section */}
        <section className="mt-32 text-center max-w-4xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                 </div>
                 <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">An toàn tuyệt đối</h4>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
                    <Zap className="w-6 h-6 text-amber-500" />
                 </div>
                 <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Xử lý tức thì</h4>
              </div>
              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
                    <Sparkles className="w-6 h-6 text-blue-500" />
                 </div>
                 <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Thông minh vượt trội</h4>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
