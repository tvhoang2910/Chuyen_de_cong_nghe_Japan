import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap, ShieldCheck, HelpCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const plans = [
  {
    name: 'Free',
    monthlyPrice: '0đ',
    yearlyPrice: '0đ',
    description: 'Dành cho sinh viên bắt đầu luyện đề cơ bản.',
    features: ['Làm đề thi công khai', 'Theo dõi điểm số cơ bản', 'Dashboard cá nhân', 'Đăng nhập Google'],
    cta: 'Dùng miễn phí',
    ctaLink: '/register',
    highlight: false,
  },
  {
    name: 'Premium',
    monthlyPrice: '99k',
    yearlyPrice: '79k',
    description: 'Tối ưu hóa toàn bộ quá trình ôn tập với AI.',
    features: ['Không giới hạn đề thi', 'Phân tích AI chuyên sâu', 'Chế độ ôn tập Offline', 'Ưu tiên hỗ trợ 24/7', 'Giao diện không quảng cáo', 'Xuất báo cáo PDF'],
    cta: 'Nâng cấp Premium',
    ctaLink: '/register',
    highlight: true,
  },
];

const faqs = [
  {
    q: 'Tôi có thể hủy gói Premium bất cứ lúc nào không?',
    a: 'Có, bạn có thể hủy đăng ký bất cứ lúc nào trong phần cài đặt tài khoản. Bạn vẫn sẽ có quyền truy cập vào các tính năng Premium cho đến hết chu kỳ thanh toán.'
  },
  {
    q: 'Phương thức thanh toán hỗ trợ là gì?',
    a: 'Chúng tôi hỗ trợ thanh toán qua MoMo, ZaloPay, chuyển khoản ngân hàng và thẻ Visa/Mastercard.'
  },
  {
    q: 'Có chính sách hoàn tiền không?',
    a: 'Chúng tôi hỗ trợ hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu bạn không hài lòng với dịch vụ và chưa sử dụng quá nhiều tài nguyên AI.'
  }
];

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <PublicHeader active="pricing" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-amber-400/5 blur-[120px] rounded-full" />
        </div>

        <section className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 shadow-sm mb-8 font-black text-[10px] uppercase tracking-[0.2em] text-amber-700"
          >
            <Sparkles className="w-3.5 h-3.5" /> Flexible Plans
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Đầu tư cho <br /><span className="text-gradient">Thành công.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-xl font-medium mb-12"
          >
            Lựa chọn gói phù hợp để bắt đầu hành trình chinh phục điểm A+.
          </motion.p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
             <span className={`text-sm font-black uppercase tracking-widest ${isYearly ? 'text-slate-400' : 'text-slate-900'}`}>Hàng tháng</span>
             <button 
              onClick={() => setIsYearly(!isYearly)}
              className="w-16 h-8 bg-slate-900 rounded-full relative p-1 transition-colors hover:bg-indigo-600"
             >
                <motion.div 
                  animate={{ x: isYearly ? 32 : 0 }}
                  className="w-6 h-6 bg-white rounded-full shadow-lg"
                />
             </button>
             <span className={`text-sm font-black uppercase tracking-widest ${isYearly ? 'text-slate-900' : 'text-slate-400'}`}>Hàng năm</span>
             <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest animate-bounce">
                Tiết kiệm 20%
             </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-40">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-[4rem] border p-12 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                plan.highlight
                  ? 'bg-slate-900 text-white border-slate-800 shadow-indigo-900/20'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                  Phổ biến nhất
                </div>
              )}

              <div className="mb-12">
                <h2 className="text-4xl font-black mb-4 tracking-tight">{plan.name}</h2>
                <p className={`text-lg font-medium leading-relaxed ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-12 flex items-baseline gap-2">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={isYearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-7xl font-black tracking-tighter"
                  >
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </motion.span>
                </AnimatePresence>
                <span className={`text-xl font-bold ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                  /tháng
                </span>
              </div>

              <div className={`h-px w-full mb-12 ${plan.highlight ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

              <ul className="space-y-6 mb-16">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-5 group">
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${plan.highlight ? 'bg-indigo-500/20 group-hover:bg-indigo-500' : 'bg-indigo-50 group-hover:bg-indigo-100'}`}>
                       <Check className={`w-4 h-4 ${plan.highlight ? 'text-indigo-400 group-hover:text-white' : 'text-indigo-600'}`} strokeWidth={4} />
                    </div>
                    <span className="font-bold text-lg tracking-tight opacity-90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaLink}
                className={`flex justify-center w-full rounded-[2rem] px-10 py-6 font-black text-xl transition-all active:scale-95 shadow-2xl ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.article>
          ))}
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto mb-40">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tight mb-4 text-slate-900">Câu hỏi thường gặp</h2>
              <p className="text-slate-500 font-medium">Mọi thứ bạn cần biết về gói Premium của ExamBank.</p>
           </div>
           <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={faq.q} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                   <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                   >
                      <span className="font-black text-slate-900">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                   </button>
                   <AnimatePresence>
                      {openFaq === i && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                           <div className="px-8 pb-6 text-slate-500 font-medium leading-relaxed">
                              {faq.a}
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              ))}
           </div>
        </section>

        {/* Trust Section */}
        <section className="text-center max-w-4xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { icon: ShieldCheck, label: 'Bảo mật tuyệt đối', color: 'emerald' },
                { icon: Zap, label: 'Xử lý tức thì', color: 'amber' },
                { icon: HelpCircle, label: 'Hỗ trợ 24/7', color: 'blue' }
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-6 group">
                   <div className={`w-16 h-16 rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-8 h-8 text-${item.color}-500`} />
                   </div>
                   <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.label}</h4>
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};

export default Pricing;
