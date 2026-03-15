import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Brain, Trophy, BarChart3, Zap, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { Link } from 'react-router-dom';

// --- Components ---

const InfiniteMarquee = () => {
  const reviews = [
    { name: "Minh Anh", role: "K67 CNTT", text: "ExamBank giúp mình đạt A+ môn Giải tích 1." },
    { name: "Tuấn Hưng", role: "K68 Dệt May", text: "Giao diện quá đẹp và dễ sử dụng!" },
    { name: "Hương Ly", role: "K66 Kinh Tế", text: "Tính năng Spaced Repetition thực sự hiệu quả." },
    { name: "Đức Thắng", role: "K67 Cơ Điện Tử", text: "Kho đề thi phong phú, sát với thực tế." },
    { name: "Lan Chi", role: "K68 Luật", text: "Review đề thi giúp mình tự tin hơn hẳn." },
    { name: "Hoàng Nam", role: "K65 Y Dược", text: "Mình đã giới thiệu cho cả lớp cùng dùng." },
  ];

  return (
    <div className="w-full overflow-hidden py-10 bg-slate-50/50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
        
        <div className="flex gap-8 animate-scroll w-max hover:[animation-play-state:paused]">
          {[...reviews, ...reviews, ...reviews].map((review, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 min-w-[320px]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {review.name.charAt(0)}
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">{review.name} <span className="text-slate-400 font-normal text-xs">· {review.role}</span></h5>
                <p className="text-sm text-slate-600 font-medium">"{review.text}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, colSpan = "md:col-span-4", color = "blue" }: any) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  };

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${colSpan} relative group rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`
        }}
      />
      <div className="relative p-8 h-full flex flex-col items-start z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorClasses[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-display font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

// --- Main Page ---

const Home: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      <PublicHeader active="home" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
          {/* Aurora Background */}
          <div className="absolute inset-0 -z-10 bg-noise opacity-40 mix-blend-soft-light"></div>
          <div className="absolute inset-0 -z-20 overflow-hidden">
             <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-3xl animate-aurora rounded-full opacity-60"></div>
          </div>
          
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 shadow-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">
                Phiên bản 2.0 - Thông minh hơn
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-8xl font-display font-black text-slate-900 tracking-tight leading-[1.1] mb-8"
            >
              Ôn thi thông minh. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 animate-gradient-x">
                Đạt điểm tối đa.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed font-medium"
            >
              Khai phá tiềm năng ghi nhớ với thuật toán <span className="text-slate-900 font-bold">Spaced Repetition</span>. 
              Cá nhân hóa lộ trình học tập để bạn tự tin chinh phục mọi học phần.
            </motion.p>

            {/* Search Bar - Elevated */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full max-w-2xl relative z-20"
            >
              <div className="relative group p-2 bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-slate-200 transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300">
                <div className="flex items-center">
                  <div className="pl-4">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Tìm mã học phần (VD: INT2203)..." 
                    className="w-full px-4 py-4 text-base bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                  <button className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                    Bắt đầu
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-slate-500 font-medium">
                <span>Phổ biến:</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors">Giải tích 1</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors">Triết học</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors">Lập trình HDT</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof */}
        <InfiniteMarquee />

        {/* Features Grid */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-3xl mx-auto">
               <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Công nghệ học tập tiên tiến</h2>
               <p className="text-lg text-slate-500 font-medium">Chúng tôi không chỉ cung cấp đề thi, chúng tôi cung cấp phương pháp học tập hiệu quả nhất.</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <FeatureCard 
                colSpan="md:col-span-8"
                icon={Zap}
                color="blue"
                title="Spaced Repetition Algorithm" 
                desc="Hệ thống tự động tính toán 'điểm quên' của não bộ để nhắc lại kiến thức đúng thời điểm vàng, giúp chuyển hóa kiến thức vào trí nhớ dài hạn." 
              />
              <FeatureCard 
                colSpan="md:col-span-4"
                icon={Trophy}
                color="amber"
                title="Gamification" 
                desc="Biến việc học thành trò chơi. Leo rank Leaderboard, duy trì Streak và nhận huy hiệu danh giá." 
              />
              <FeatureCard 
                colSpan="md:col-span-4"
                icon={BarChart3}
                color="indigo"
                title="AI Analytics" 
                desc="Biểu đồ Radar phân tích điểm mạnh yếu chi tiết từng chương." 
              />
              <FeatureCard 
                colSpan="md:col-span-8"
                icon={ShieldCheck}
                color="emerald"
                title="Ngân hàng đề Verified" 
                desc="100% đề thi được đóng góp và kiểm duyệt bởi cộng đồng sinh viên giỏi và giảng viên, đảm bảo độ chính xác tuyệt đối." 
              />
            </motion.div>
          </div>
        </section>

        {/* Modern CTA */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900 -z-20"></div>
          <div className="absolute inset-0 bg-noise opacity-10 -z-10"></div>
          <div className="absolute top-0 right-0 p-32 bg-blue-600/20 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-indigo-600/20 blur-[150px] rounded-full"></div>

          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                 <Sparkles className="w-3 h-3" /> Early Access
              </div>
              <h2 className="text-5xl font-display font-black text-white mb-6 leading-tight">Sẵn sàng bứt phá <br/> điểm số của bạn?</h2>
              <p className="text-slate-400 text-lg font-medium mb-8 max-w-xl">
                 Tham gia cùng 10,000+ sinh viên VNU đang sử dụng ExamBank mỗi ngày. Đăng ký ngay hôm nay để nhận trọn bộ tính năng Premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2">
                    Tạo tài khoản miễn phí <ArrowRight className="w-5 h-5" />
                 </button>
                 <button className="px-8 py-4 bg-transparent border border-slate-700 text-white font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    Xem Demo
                 </button>
              </div>
            </div>
            
            {/* 3D-ish Card Visual */}
            <motion.div 
               style={{ y: y1 }}
               className="relative w-full max-w-md"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2.5rem] rotate-6 opacity-30 blur-2xl"></div>
               <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                           <span className="text-white font-bold">N</span>
                        </div>
                        <div>
                           <div className="h-2 w-24 bg-slate-600 rounded-full mb-1"></div>
                           <div className="h-2 w-16 bg-slate-700 rounded-full"></div>
                        </div>
                     </div>
                     <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">Passing</div>
                  </div>
                  <div className="space-y-4">
                     <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/5"></div>
                     <div className="h-4 w-3/4 bg-slate-700 rounded-full"></div>
                     <div className="h-4 w-1/2 bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-sm font-medium text-slate-400">
                     <span>Tiến độ</span>
                     <span className="text-white">85%</span>
                  </div>
               </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer Minimal */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-slate-900 font-display font-black text-xl">ExamBank.</div>
           <div className="text-slate-500 text-sm font-medium">© 2026 Designed with <span className="text-red-500">♥</span> by Group 1 VNU.</div>
           <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors"><span className="sr-only">Facebook</span>FB</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors"><span className="sr-only">Twitter</span>TW</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors"><span className="sr-only">GitHub</span>GH</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
