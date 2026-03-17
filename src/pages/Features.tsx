import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  ChartColumnIncreasing, 
  TimerReset, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Layers, 
  Target, 
  MousePointer2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const featureItems = [
  {
    icon: Brain,
    title: 'Spaced Repetition (SM-2)',
    description: 'Tự động nhắc lại đúng thời điểm để đưa kiến thức vào trí nhớ dài hạn, giảm 80% thời gian ôn tập lại.',
    color: 'blue',
  },
  {
    icon: ChartColumnIncreasing,
    title: 'Phân tích năng lực AI',
    description: 'Radar chart và thống kê chuyên sâu giúp bạn thấy rõ lỗ hổng kiến thức để tập trung cải thiện.',
    color: 'indigo',
  },
  {
    icon: TimerReset,
    title: 'Lịch ôn tập thông minh',
    description: 'Tự động sắp xếp lộ trình ôn thi dựa trên ngày thi thực tế và mức độ khó của từng học phần.',
    color: 'purple',
  },
  {
    icon: Target,
    title: 'Chế độ luyện đề thực chiến',
    description: 'Mô phỏng áp lực phòng thi thật với đồng hồ đếm ngược và cấu trúc đề thi chuẩn từ các trường.',
    color: 'emerald',
  },
];

const steps = [
  {
    title: 'Thu thập & Phân loại',
    description: 'Hệ thống tự động phân loại hàng ngàn đề thi theo chuyên ngành và mức độ khó.',
    icon: Layers,
  },
  {
    title: 'Luyện tập thông minh',
    description: 'Làm bài và nhận phản hồi tức thì từ thuật toán SM-2 để tối ưu hóa việc ghi nhớ.',
    icon: Zap,
  },
  {
    title: 'Vượt qua kỳ thi',
    description: 'Tự tin bước vào phòng thi với 100% kiến thức đã được khắc sâu vào trí nhớ dài hạn.',
    icon: Target,
  }
];

const Features: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-700">
      <PublicHeader active="features" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48">
        {/* Background Mesh */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-indigo-400/10 blur-[120px] rounded-full" />
        </div>

        {/* Hero Section */}
        <section className="text-center mb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8 font-black text-[10px] uppercase tracking-[0.2em] text-blue-600"
          >
            <Sparkles className="w-3.5 h-3.5" /> Core Capabilities
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            Công nghệ ôn thi <br /><span className="text-gradient">Đột phá.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-xl font-medium leading-relaxed"
          >
            Chúng tôi kết hợp khoa học não bộ với công nghệ AI tiên tiến để mang lại cho bạn trải nghiệm học tập chưa từng có.
          </motion.p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-40">
          {featureItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article 
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-[3rem] border border-slate-200 p-12 shadow-2xl shadow-slate-200/50 hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.07] transition-all duration-700">
                  <Icon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-[1.25rem] bg-${item.color}-50 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 text-${item.color}-600`} />
                  </div>
                  <h2 className="text-3xl font-black mb-6 tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h2>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">{item.description}</p>
                  <div className="flex items-center gap-3 text-xs font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                    Xem chi tiết thuật toán <MousePointer2 className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        {/* How it works */}
        <section className="py-24 mb-40 relative bg-slate-900 rounded-[4rem] overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-0"></div>
          <div className="relative z-10 px-12 md:px-20">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Quy trình 3 bước <span className="text-indigo-400">tối ưu.</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {steps.map((step, i) => (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="text-center group"
                >
                  <div className="relative inline-block mb-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform">
                      <step.icon className="w-10 h-10" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 font-black text-sm shadow-xl">
                      0{i+1}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{step.title}</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden bg-white text-slate-900 rounded-[4rem] p-12 md:p-24 border border-slate-200 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full -z-0"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                  <span className="font-black uppercase tracking-[0.2em] text-xs text-slate-400">Sẵn sàng trải nghiệm?</span>
               </div>
               <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-[0.9]">Tự tin chinh phục <br /> mọi đỉnh cao tri thức.</h2>
              <p className="text-slate-500 text-xl font-medium leading-relaxed">Đừng để kỳ thi làm bạn lo lắng. Hãy để ExamBank đồng hành cùng bạn trên con đường đạt điểm A+.</p>
            </div>
            <Link
              to="/register"
              className="group relative inline-flex items-center justify-center bg-slate-900 text-white px-12 py-7 rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-900/20"
            >
              Đăng ký ngay <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Features;
