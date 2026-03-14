import React from 'react';
import { Link } from 'react-router-dom';
import { Target, GraduationCap, ShieldCheck, Rocket } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const values = [
  {
    icon: Target,
    title: 'Học đúng trọng tâm',
    description: 'Tập trung vào câu hỏi quan trọng, giảm thời gian ôn dàn trải và tăng hiệu quả.',
  },
  {
    icon: GraduationCap,
    title: 'Dành cho sinh viên thật',
    description: 'Thiết kế theo hành vi học tập thực tế tại đại học, không chỉ là demo lý thuyết.',
  },
  {
    icon: ShieldCheck,
    title: 'An toàn và đáng tin cậy',
    description: 'Hệ thống xác thực hiện đại với quản lý phiên đăng nhập rõ ràng và bảo mật.',
  },
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader active="about" />

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-blue-900 text-white p-10 md:p-14 mb-10">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full mb-4">
              <Rocket className="w-4 h-4" /> About ExamBank
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5">Xây nền tảng ôn thi hiện đại cho sinh viên Việt Nam</h1>
            <p className="text-slate-200 text-lg leading-relaxed">
              ExamBank giúp bạn học thông minh hơn bằng cách kết hợp ngân hàng đề thi, theo dõi tiến độ, và nhắc ôn tập đúng thời điểm để tăng khả năng ghi nhớ dài hạn.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">{value.title}</h2>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </article>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold mb-3">Sứ mệnh</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Mục tiêu của chúng tôi là giúp mỗi sinh viên có một lộ trình ôn thi rõ ràng, đo lường được và bền vững. Không học vẹt, không học dồn phút cuối, chỉ còn cách học có chiến lược.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
              Tạo tài khoản miễn phí
            </Link>
            <Link to="/features" className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
              Xem toàn bộ tính năng
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
