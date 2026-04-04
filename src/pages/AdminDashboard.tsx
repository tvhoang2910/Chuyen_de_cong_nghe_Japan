import React from 'react';
import {
  Users,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Globe,
  Zap,
} from 'lucide-react';
import { usePresenceSSE } from '@/hooks/usePresenceSSE';
import { useExamEventsSSE } from '@/hooks/useExamEventsSSE';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

const data = [
  { name: 'Thứ 2', users: 400, exams: 240 },
  { name: 'Thứ 3', users: 300, exams: 139 },
  { name: 'Thứ 4', users: 200, exams: 980 },
  { name: 'Thứ 5', users: 278, exams: 390 },
  { name: 'Thứ 6', users: 189, exams: 480 },
  { name: 'Thứ 7', users: 239, exams: 380 },
  { name: 'Chủ nhật', users: 349, exams: 430 },
];

const subjectData = [
  { name: 'Toán', count: 120, color: '#06b6d4' },
  { name: 'Lý', count: 80, color: '#3b82f6' },
  { name: 'Hóa', count: 45, color: '#8b5cf6' },
  { name: 'Anh', count: 150, color: '#ec4899' },
  { name: 'Sinh', count: 30, color: '#f59e0b' },
];

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
  onClick?: () => void;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue, color, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-cyan-300 transition-all"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div
        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
        }`}
      >
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trendValue}
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-semibold">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </button>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('access_token');
  const { onlineCount } = usePresenceSSE(accessToken);
  const { activeAttempts, submissionsToday } = useExamEventsSSE(accessToken);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hệ thống Tổng quan</h1>
            <p className="text-slate-500 mt-1">Dữ liệu hoạt động toàn hệ thống trong 7 ngày qua.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Tổng người dùng" value={onlineCount > 0 ? onlineCount.toLocaleString() : '...'} icon={Users} trend="up" trendValue="Live" color="bg-cyan-500" />
          <StatCard
            title="Đề thi đã tạo"
            value={submissionsToday > 0 ? submissionsToday.toLocaleString() : '...'}
            icon={BookOpen}
            trend="up"
            trendValue="Live"
            color="bg-blue-500"
            onClick={() => navigate('/admin/exams')}
          />
          <StatCard title="Lượt làm bài" value={activeAttempts > 0 ? activeAttempts.toLocaleString() : '...'} icon={Zap} trend="down" trendValue="Live" color="bg-amber-500" />
          <StatCard title="Báo cáo lỗi" value="08" icon={ShieldCheck} trend="down" trendValue="-40%" color="bg-rose-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">Tương tác người dùng</h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full" /> Người dùng
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" /> Đề thi
                </span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="exams" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExams)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Môn học phổ biến</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }}
                    width={50}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {subjectData.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium text-slate-600">{s.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{s.count} đề</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative shadow-xl shadow-slate-900/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Hệ thống ổn định
              </div>
              <h2 className="text-3xl font-bold">Trạng thái máy chủ</h2>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Tất cả các dịch vụ đang hoạt động bình thường. Độ trễ trung bình của API là 45ms. Không có sự cố nào được ghi nhận trong 24h qua.
              </p>
              <div className="flex gap-4 pt-2">
                <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm min-w-[100px]">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">CPU Load</p>
                  <p className="text-xl font-bold text-cyan-400">12%</p>
                </div>
                <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm min-w-[100px]">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">RAM Used</p>
                  <p className="text-xl font-bold text-cyan-400">2.4GB</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" /> Log hệ thống
              </button>
              <button className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700">
                Cấu hình tài nguyên
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
