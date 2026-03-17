import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Zap, 
  Shield, 
  Users, 
  Star, 
  CheckCircle2, 
  GitBranch,
  Send,
  ArrowRight,
  Globe,
  Award,
  MousePointer2,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';

const Home: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const features = [
    {
      title: 'Ngân hàng đề thi khổng lồ',
      description: 'Hàng ngàn đề thi từ các trường đại học hàng đầu, được cập nhật liên tục bởi cộng đồng giáo viên.',
      icon: BookOpen,
      color: 'blue',
      delay: 0.1
    },
    {
      title: 'Thuật toán SM-2 thông minh',
      description: 'Tối ưu hóa việc ghi nhớ thông qua kỹ thuật Spaced Repetition, giúp bạn nhớ kiến thức lâu hơn.',
      icon: Zap,
      color: 'amber',
      delay: 0.2
    },
    {
      title: 'Bảo mật & Tin cậy',
      description: 'Hệ thống xác thực đa lớp, đảm bảo dữ liệu học tập và thông tin cá nhân của bạn luôn an toàn.',
      icon: Shield,
      color: 'emerald',
      delay: 0.3
    },
    {
      title: 'Cộng đồng học tập',
      description: 'Kết nối với hàng ngàn sinh viên khác, cùng nhau thảo luận và giải đáp thắc mắc.',
      icon: Users,
      color: 'indigo',
      delay: 0.4
    }
  ];

  const stats = [
    { label: 'Người dùng', value: '10,000+', icon: Users },
    { label: 'Đề thi', value: '50,000+', icon: BookOpen },
    { label: 'Tỉ lệ đỗ', value: '95%', icon: Award },
    { label: 'Quốc gia', value: '5+', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <PublicHeader active="home" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -120, 0],
              x: [0, -40, 0],
              y: [0, 60, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-400/10 blur-[120px] rounded-full"
          />
        </div>

        <motion.div 
          style={{ opacity, scale }}
          className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div className="text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-sm font-bold mb-8"
            >
              <Star className="w-4 h-4 fill-blue-700 animate-pulse" />
              <span>Nền tảng học tập số 1 cho sinh viên</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]"
            >
              Chinh phục <br />
              <span className="text-gradient">Mọi kỳ thi.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl text-slate-600 max-w-xl mb-12 leading-relaxed font-medium"
            >
              Hệ thống ngân hàng đề thi thông minh tích hợp công nghệ ghi nhớ <span className="text-blue-600 font-bold">SM-2</span> giúp bạn tối ưu hóa 100% thời gian học tập.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link 
                to="/register" 
                className="group px-8 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
              >
                Bắt đầu miễn phí <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/about" 
                className="px-8 py-5 bg-white text-slate-700 font-black rounded-2xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all w-full sm:w-auto justify-center flex items-center gap-2 shadow-sm"
              >
                Tìm hiểu thêm
              </Link>
            </motion.div>

            {/* Micro Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i + 15}`} className="w-10 h-10 rounded-full border-2 border-white" alt="User" />
                ))}
              </div>
              <p className="text-sm text-slate-500 font-bold">
                <span className="text-slate-900">1,200+</span> sinh viên tham gia hôm nay
              </p>
            </motion.div>
          </div>

          {/* Interactive Hero Element */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full animate-pulse" />
            <div className="relative glass p-4 rounded-[3rem] shadow-2xl border-white/50 overflow-hidden">
               <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-video relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 mix-blend-overlay group-hover:opacity-50 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                        <Zap className="w-8 h-8 text-white fill-white" />
                     </div>
                  </div>
                  {/* Floating UI Elements */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-8 left-8 glass p-4 rounded-2xl shadow-xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Tiến độ</p>
                      <p className="text-sm font-black text-slate-900">89% Hoàn thành</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute bottom-8 right-8 glass p-4 rounded-2xl shadow-xl flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Kỹ năng</p>
                      <p className="text-sm font-black text-slate-900">Master Level</p>
                    </div>
                  </motion.div>
               </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-2xl mb-4 group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                  <stat.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">{stat.value}</h3>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50/50 skew-y-3 -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-blue-600/20"
            >
              Tại sao chọn chúng tôi?
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
            >
              Giải pháp học tập <br /> dựa trên <span className="text-blue-600">Khoa học.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-600 text-lg font-medium leading-relaxed"
            >
              Chúng tôi không chỉ cung cấp đề thi, chúng tôi cung cấp một giải pháp học tập toàn diện giúp bạn ghi nhớ kiến thức mãi mãi.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <motion.div 
                key={feature.title} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                  <feature.icon className="w-24 h-24" />
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm mb-6">{feature.description}</p>
                <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  Khám phá ngay <MousePointer2 className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/5"
           >
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                 <div>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-[0.9] tracking-tighter">Gia nhập <br /> cộng đồng <br /><span className="text-blue-500">Kỷ lục gia.</span></h2>
                    <div className="space-y-8">
                       {[
                         'Tiếp cận kho tài liệu khổng lồ từ mọi chuyên ngành.',
                         'Cập nhật xu hướng đề thi mới nhất từ giảng viên.',
                         'Công nghệ AI phân tích điểm yếu tức thì.'
                       ].map((text, i) => (
                         <motion.div 
                          key={text}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-start gap-5"
                         >
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-600/20">
                               <CheckCircle2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed">{text}</p>
                         </motion.div>
                       ))}
                    </div>
                 </div>

                 <div className="glass-dark border-white/10 rounded-[3rem] p-10 md:p-12 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 blur-3xl rounded-full" />
                    <div className="flex items-center gap-6 mb-10">
                       <div className="flex -space-x-5">
                          {[21, 22, 23, 24].map(imgId => (
                             <img key={imgId} src={`https://i.pravatar.cc/100?img=${imgId}`} className="w-14 h-14 rounded-full border-4 border-slate-900 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${(imgId - 20) * 100}ms` }} alt="Student" />
                          ))}
                       </div>
                       <div>
                          <p className="text-3xl font-black text-white tracking-tighter">4.9/5</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Sự hài lòng tuyệt đối</p>
                       </div>
                    </div>
                    <p className="text-slate-300 text-xl font-medium italic mb-10 leading-relaxed relative">
                      <span className="text-6xl text-blue-600/20 absolute -top-8 -left-4 font-serif">&quot;</span>{' '}
                      ExamBank thực sự đã thay đổi cách mình ôn thi. Thuật toán nhắc nhở học tập SM-2 giúp mình không còn tình trạng học trước quên sau nữa. Kết quả GPA của mình đã tăng từ 2.8 lên 3.7!
                    </p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-blue-600/40">TH</div>
                       <div>
                          <p className="text-lg font-black text-white">Trần Thu Hà</p>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sinh viên ĐH Bách Khoa</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-20 text-center relative z-10">
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-4 px-12 py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-500 hover:shadow-[0_0_50px_rgba(37,99,235,0.4)] transition-all active:scale-95"
                >
                  Bắt đầu ngay bây giờ <ArrowRight className="w-6 h-6" />
                </Link>
              </div>
           </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-8 group">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg">
                  <BookOpen className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">ExamBank</span>
              </Link>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                Nền tảng quản lý ngân hàng đề thi và hỗ trợ học tập thông minh dựa trên khoa học ghi nhớ hiện đại nhất.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/exam-bank" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <GitBranch className="w-5 h-5" />
                </a>
                <a href="https://twitter.com/exambank" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Send className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase text-[10px] tracking-[0.2em] opacity-50">Sản phẩm</h4>
              <ul className="space-y-5">
                <li><Link to="/features" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Tính năng chính</Link></li>
                <li><Link to="/pricing" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Bảng giá</Link></li>
                <li><Link to="/about" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Về chúng tôi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase text-[10px] tracking-[0.2em] opacity-50">Hỗ trợ</h4>
              <ul className="space-y-5">
                <li><Link to="/docs" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Tài liệu</Link></li>
                <li><Link to="/community" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Cộng đồng</Link></li>
                <li><Link to="/contact" className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 mb-8 uppercase text-[10px] tracking-[0.2em] opacity-50">Bản tin</h4>
              <p className="text-slate-500 font-medium text-sm mb-6">Nhận thông báo về các tính năng mới nhất.</p>
              <form className="relative">
                <input 
                  type="email" 
                  placeholder="Email của bạn"
                  className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium"
                />
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">© 2026 ExamBank Project. Senior Staff Engineer Standards.</p>
            <div className="flex gap-10">
               <Link to="/privacy" className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">Bảo mật</Link>
               <Link to="/terms" className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] transition-colors">Điều khoản</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
