import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Trophy, BarChart3, Crown, BookOpen } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <PublicHeader active="home" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Background decorations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-400/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6 border border-blue-100">
              🚀 Nền tảng EdTech hàng đầu VNU
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl">
            Ôn thi thông minh. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Tối ưu trí nhớ. Đạt điểm tối đa.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl leading-relaxed">
            Hệ thống quản lý đề thi và ôn tập cá nhân hóa sử dụng thuật toán Spaced Repetition (SM-2) giúp bạn ghi nhớ lâu dài và tự tin vượt qua mọi kỳ thi.
          </motion.p>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl relative group">
            <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-xl group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2">
              <Search className="w-6 h-6 text-slate-400 ml-4" />
              <input 
                type="text" 
                placeholder="Tìm kiếm môn học, mã học phần, tên đề thi..." 
                className="w-full px-4 py-3 text-lg bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-sm font-medium mr-2">
                <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">K</kbd>
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                Tìm kiếm
              </button>
            </div>
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tính năng đột phá</h2>
            <p className="text-slate-600">Được thiết kế để tối đa hóa hiệu suất học tập của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Spaced Repetition (Large Span) */}
            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl shadow-blue-900/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
              <Brain className="w-12 h-12 text-blue-200 mb-6" />
              <h3 className="text-3xl font-bold mb-4">Thuật toán Spaced Repetition (SM-2)</h3>
              <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                Hệ thống tự động phân tích lịch sử làm bài và lên lịch ôn tập cho các câu hỏi bạn dễ quên, giúp chuyển kiến thức vào trí nhớ dài hạn.
              </p>
            </div>

            {/* Gamification */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Gamification</h3>
              <p className="text-slate-600">Tích lũy Points và duy trì Streaks mỗi ngày. Biến việc học thành một hành trình thú vị.</p>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Phân tích chuyên sâu</h3>
              <p className="text-slate-600">Radar charts và báo cáo chi tiết năng lực theo từng môn học, giúp bạn biết điểm yếu để cải thiện.</p>
            </div>

            {/* Premium */}
            <div className="md:col-span-3 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-xl relative overflow-hidden">
               <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-32 bg-amber-500/20 blur-[80px] -z-10"></div>
               <div className="mb-6 md:mb-0 max-w-2xl z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className="w-8 h-8 text-amber-400" />
                    <h3 className="text-2xl font-bold text-white">Freemium Accounts</h3>
                  </div>
                  <p className="text-slate-400 text-lg">Miễn phí trọn đời cho sinh viên với bộ tính năng tiêu chuẩn. Nâng cấp Premium để mở khóa không giới hạn số lượng câu hỏi và phân tích AI.</p>
               </div>
               <button className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform z-10 shadow-lg shadow-amber-500/25">
                  Khám phá gói Premium
               </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
           <div className="flex items-center gap-2 mb-4 md:mb-0">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
               <BookOpen className="text-white w-4 h-4" />
             </div>
             <span className="text-xl font-bold text-slate-900">ExamBank</span>
           </div>
           <p className="text-slate-500 text-center md:text-right font-medium">
             © 2026 ExamBank. Phát triển bởi Nhóm 1 - ĐHQGHN.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
