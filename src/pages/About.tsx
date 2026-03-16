import React from 'react';
import { Link } from 'react-router-dom';
import { Target, GraduationCap, ShieldCheck, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const values = [
  {
    icon: Target,
    title: 'Học đúng trọng tâm',
    description: 'Tập trung vào câu hỏi quan trọng, giảm thời gian ôn dàn trải và tăng hiệu quả đột phá.',
    color: 'blue',
  },
  {
    icon: GraduationCap,
    title: 'Dành cho sinh viên thật',
    description: 'Thiết kế dựa trên hành vi học tập thực tế tại VNU, tối ưu hóa cho từng học phần cụ thể.',
    color: 'indigo',
  },
  {
    icon: ShieldCheck,
    title: 'An toàn & Tin cậy',
    description: 'Hệ thống bảo mật đa lớp đảm bảo dữ liệu lộ trình học tập của bạn luôn được bảo vệ.',
    color: 'emerald',
  },
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <PublicHeader active="about" />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-48">
        <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-12 md:p-20 mb-20 shadow-2xl shadow-blue-900/20 border border-white/5">
          <div className="absolute -right-20 -top-20 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-float" />
          <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />

          <div className="relative z-10 max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white/10 border border-white/10 px-4 py-1.5 rounded-full mb-8"
            >
              <Rocket className="w-3.5 h-3.5 text-blue-400" /> Our Mission
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]"
            >
              Xây dựng nền tảng <br /> ôn thi <span className="text-blue-500">Thế hệ mới.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-xl font-medium leading-relaxed max-w-2xl"
            >
              ExamBank không chỉ là một ngân hàng đề thi. Chúng tôi kết hợp khoa học ghi nhớ và AI để giúp sinh viên Việt Nam học tập thông minh, hiệu quả và bền vững hơn.
            </motion.p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.article 
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl hover:shadow-2xl hover:border-blue-200 transition-all duration-500"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${value.color}-50 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 text-${value.color}-600`} />
                </div>
                <h2 className="text-2xl font-black mb-4 tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{value.title}</h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">{value.description}</p>
              </motion.article>
            );
          })}
        </section>

        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[3rem] border border-slate-200 p-12 md:p-16 shadow-2xl shadow-slate-200/50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-50 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <h2 className="text-4xl font-black tracking-tighter text-slate-900">Sứ mệnh của chúng tôi</h2>
             </div>
             <p className="text-slate-500 text-xl font-medium leading-relaxed mb-12 max-w-4xl">
               Mục tiêu của ExamBank là giúp mỗi sinh viên có một lộ trình ôn thi rõ ràng, đo lường được và bền vững. Chúng tôi tin rằng không có sinh viên nào kém, chỉ có phương pháp học tập chưa tối ưu. Với ExamBank, mọi sinh viên đều có thể chinh phục những đỉnh cao mới.
             </p>

             <div className="flex flex-wrap gap-5">
               <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20">
                 Bắt đầu ngay <ArrowRight className="w-5 h-5 ml-2" />
               </Link>
               <Link to="/features" className="inline-flex items-center justify-center px-10 py-5 rounded-[1.5rem] border-2 border-slate-200 text-slate-900 font-black text-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
                 Khám phá tính năng
               </Link>
             </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default About;
