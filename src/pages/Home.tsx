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
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const Home: React.FC = () => {
  const features = [
    {
      title: 'Ngân hàng đề thi khổng lồ',
      description: 'Hàng ngàn đề thi từ các trường đại học hàng đầu, được cập nhật liên tục bởi cộng đồng giáo viên.',
      icon: BookOpen,
      color: 'blue'
    },
    {
      title: 'Thuật toán SM-2 thông minh',
      description: 'Tối ưu hóa việc ghi nhớ thông qua kỹ thuật Spaced Repetition, giúp bạn nhớ kiến thức lâu hơn.',
      icon: Zap,
      color: 'amber'
    },
    {
      title: 'Bảo mật & Tin cậy',
      description: 'Hệ thống xác thực đa lớp, đảm bảo dữ liệu học tập và thông tin cá nhân của bạn luôn an toàn.',
      icon: Shield,
      color: 'emerald'
    },
    {
      title: 'Cộng đồng học tập',
      description: 'Kết nối với hàng ngàn sinh viên khác, cùng nhau thảo luận và giải đáp thắc mắc.',
      icon: Users,
      color: 'indigo'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader active="home" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold mb-8 animate-fade-in">
             <Star className="w-4 h-4 fill-blue-700" />
             <span>Nền tảng học tập số 1 cho sinh viên</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
            Chinh phục mọi kỳ thi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dễ dàng hơn bao giờ hết</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Hệ thống ngân hàng đề thi thông minh tích hợp công nghệ ghi nhớ SM-2 giúp bạn tối ưu hóa thời gian học tập và đạt kết quả cao nhất.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Bắt đầu miễn phí <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/about" 
              className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all w-full sm:w-auto justify-center flex"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Tại sao chọn ExamBank?</h2>
            <p className="text-slate-600">Chúng tôi không chỉ cung cấp đề thi, chúng tôi cung cấp một giải pháp học tập toàn diện dựa trên khoa học não bộ.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">Gia nhập cộng đồng <br />hơn 10,000 sinh viên</h2>
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-600/20">
                             <CheckCircle2 className="w-6 h-6 text-blue-400" />
                          </div>
                          <p className="text-slate-400 leading-relaxed">Tiếp cận kho tài liệu khổng lồ từ mọi chuyên ngành.</p>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0 border border-blue-600/20">
                             <CheckCircle2 className="w-6 h-6 text-blue-400" />
                          </div>
                          <p className="text-slate-400 leading-relaxed">Cập nhật xu hướng đề thi mới nhất từ các giảng viên uy tín.</p>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="flex -space-x-4">
                          {[1, 2, 3, 4].map(i => (
                             <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-12 h-12 rounded-full border-4 border-slate-900" alt="Student" />
                          ))}
                       </div>
                       <div className="text-white">
                          <p className="text-xl font-bold">4.9/5</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đánh giá từ người dùng</p>
                       </div>
                    </div>
                    <p className="text-slate-300 italic mb-8 leading-relaxed">
                      "ExamBank thực sự đã thay đổi cách mình ôn thi. Thuật toán nhắc nhở học tập SM-2 giúp mình không còn tình trạng học trước quên sau nữa."
                    </p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">TH</div>
                       <div>
                          <p className="text-sm font-bold text-white">Trần Thu Hà</p>
                          <p className="text-xs text-slate-500 font-medium">Sinh viên ĐH Bách Khoa</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-slate-900">ExamBank</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Nền tảng quản lý ngân hàng đề thi và hỗ trợ học tập thông minh dựa trên khoa học ghi nhớ.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/exam-bank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Github">
                  <GitBranch className="w-5 h-5" />
                </a>
                <a href="https://twitter.com/exambank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Twitter">
                  <Send className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Sản phẩm</h4>
              <ul className="space-y-4">
                <li><Link to="/features" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Tính năng</Link></li>
                <li><Link to="/pricing" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Giá cả</Link></li>
                <li><Link to="/about" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Về chúng tôi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Hỗ trợ</h4>
              <ul className="space-y-4">
                <li><Link to="/docs" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Tài liệu hướng dẫn</Link></li>
                <li><Link to="/community" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Cộng đồng</Link></li>
                <li><Link to="/contact" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Bản tin</h4>
              <p className="text-slate-500 text-sm mb-6">Đăng ký để nhận thông tin mới nhất.</p>
              <form className="relative group">
                <input 
                  type="email" 
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" aria-label="Subscribe">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">© 2026 ExamBank Project. Senior Staff Engineer Standards.</p>
            <div className="flex gap-8">
               <Link to="/privacy" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Bảo mật</Link>
               <Link to="/terms" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Điều khoản</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
