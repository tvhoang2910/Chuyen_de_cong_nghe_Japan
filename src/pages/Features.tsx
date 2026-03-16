import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ChartColumnIncreasing, ShieldCheck, TimerReset, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const featureItems = [
  {
    icon: Brain,
    title: 'Spaced Repetition (SM-2)',
    description: 'Tự động nhắc lại đúng thời điểm để đưa kiến thức vào trí nhớ dài hạn.',
    color: 'blue',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Phân tích năng lực theo môn',
    description: 'Radar chart và thống kê giúp bạn thấy rõ điểm yếu cần cải thiện.',
    color: 'indigo',
  },
  {
    icon: TimerReset,
    title: 'Lịch ôn tập thông minh',
    description: 'Ưu tiên câu hỏi dễ quên để tối ưu thời gian học trước kỳ thi.',
    color: 'purple',
  },
  {
    icon: ShieldCheck,
    title: 'Đăng nhập an toàn JWT',
    description: 'Hỗ trợ refresh token, blacklist token và đăng xuất an toàn.',
    color: 'emerald',
  },
];

const Features: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <PublicHeader active="features" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48">
        {/* Background Mesh */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-float" />
          <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-indigo-400/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        <section className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6 font-bold text-xs uppercase tracking-widest text-blue-600"
          >
            <Sparkles className="w-3 h-3" /> Core Capabilities
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight"
          >
            Công cụ ôn thi <br /><span className="text-gradient">Thế hệ mới.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-xl font-medium leading-relaxed"
          >
            Sự kết hợp hoàn hảo giữa thuật toán ghi nhớ khoa học và trải nghiệm người dùng hiện đại giúp bạn tối ưu hóa 100% thời gian ôn luyện.
          </motion.p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featureItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article 
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Icon className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-8 shadow-inner`}>
                    <Icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h2 className="text-2xl font-black mb-4 tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h2>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed mb-6">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 relative overflow-hidden bg-slate-900 text-white rounded-[3rem] p-12 md:p-16 border border-white/5 shadow-2xl shadow-blue-900/20"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full -z-0"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-6 h-6 text-amber-400" />
                <span className="font-black uppercase tracking-widest text-sm text-slate-300">Ready to start?</span>
               </div>
               <h2 className="text-4xl font-black mb-6 tracking-tight">Biến mọi bài thi <br /> trở nên dễ dàng.</h2>
              <p className="text-slate-300 text-xl font-medium">Hàng ngàn sinh viên đã thành công, còn bạn thì sao?</p>
            </div>
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Bắt đầu ngay <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Features;
