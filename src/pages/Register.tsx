import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, User, Mail, Lock, CheckCircle2, Rocket, Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8080/api/v1/auth'}/oauth2/authorization/google`;

const registerSchema = z.object({
  fullName: z.string().min(3, 'Họ tên phải có ít nhất 3 ký tự'),
  email: z.email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
  confirmPassword: z.string().min(8, 'Xác nhận mật khẩu phải từ 8 ký tự trở lên'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu xác nhận không khớp',
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = () => {
    globalThis.location.href = GOOGLE_AUTH_URL;
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const payload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: 'USER',
      };
      const res = await axiosClient.post('/register', payload);
      if (res.status === 201) {
        toast.success('Đăng ký thành công. Vui lòng xác thực email để kích hoạt tài khoản.');
        navigate(`/register/verify-email?email=${encodeURIComponent(data.email.trim().toLowerCase())}`);
      }
    } catch {
      toast.error('Email này đã được sử dụng. Vui lòng thử email khác.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,#0ea5e94d_0%,transparent_35%),radial-gradient(circle_at_85%_10%,#6366f14d_0%,transparent_30%),radial-gradient(circle_at_50%_85%,#22c55e33_0%,transparent_40%)]" />
      <div className="absolute inset-0 bg-noise opacity-35" />

      <motion.div className="auth-orb auth-orb-three" animate={{ x: [0, 12, -16, 0], y: [0, -16, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="hidden w-1/2 items-center justify-center p-12 lg:flex xl:p-16">
          <div className="auth-perspective w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, rotateX: 10, y: 24 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 0.8 }}
              className="auth-tilt-card rounded-[2rem] border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/40 bg-emerald-300/20">
                  <Rocket className="h-6 w-6 text-emerald-100" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-200">Launch New Account</p>
              </div>

              <h1 className="mt-7 text-5xl font-black leading-tight">Gia nhập cộng đồng học tập thông minh.</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
                Tạo tài khoản trong vài giây để dùng kho đề thi lớn, hệ thống ôn tập cá nhân hóa và lộ trình ghi nhớ dài hạn.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, title: 'Fast Start', value: '30s đăng ký' },
                  { icon: Layers, title: 'Deep Practice', value: 'Nhiều chế độ' },
                  { icon: CheckCircle2, title: 'Progress', value: 'Theo dõi realtime' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/15 bg-slate-900/30 p-4">
                    <item.icon className="h-5 w-5 text-emerald-200" />
                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">{item.title}</p>
                    <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-white/90 p-7 text-slate-900 shadow-[0_30px_100px_-30px_rgba(6,182,212,0.65)] backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 hover:border-emerald-200 hover:text-emerald-700">
                <ArrowLeft className="h-4 w-4" />
                Trang chủ
              </Link>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                <BookOpen className="h-4 w-4" />
                ExamBank
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-black tracking-tight">Tạo tài khoản mới</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Thiết lập hồ sơ học tập của bạn và bắt đầu ngay.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleGoogleSignup}
              className="mb-7 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z" />
                <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.3l-3.1 2.4C4.7 18.8 8.1 21 12 21z" />
                <path fill="#FBBC05" d="M6.3 12.9c0-.7.1-1.3.3-1.9L3.5 8.6C2.9 9.9 2.5 11.4 2.5 12.9c0 1.5.4 3 1 4.3l3.1-2.4c-.2-.6-.3-1.2-.3-1.9z" />
                <path fill="#4285F4" d="M12 8.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 5.7 14.6 4.8 12 4.8c-3.9 0-7.3 2.2-8.9 5.4L6.2 12c.8-2.5 3.1-3.4 5.8-3.4z" />
              </svg>
              Tiếp tục với Google
            </motion.button>

            <div className="relative mb-7">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                <span className="bg-white px-4">Hoặc đăng ký bằng Email</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label htmlFor="register-fullname" className="ml-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-fullname"
                    {...register('fullName')}
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                {errors.fullName && <p className="ml-1 mt-1 text-xs font-bold text-rose-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className="ml-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Email sinh viên</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-email"
                    {...register('email')}
                    type="email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="name@student.vnu.edu.vn"
                  />
                </div>
                {errors.email && <p className="ml-1 mt-1 text-xs font-bold text-rose-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="ml-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-password"
                    {...register('password')}
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>
                {errors.password && <p className="ml-1 mt-1 text-xs font-bold text-rose-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className="ml-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Nhập lại mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-confirm-password"
                    {...register('confirmPassword')}
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
                {errors.confirmPassword && <p className="ml-1 mt-1 text-xs font-bold text-rose-500">{errors.confirmPassword.message}</p>}
              </div>

              <div className="pt-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-base font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-70"
                >
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tạo tài khoản...</> : 'Bắt đầu ngay bây giờ'}
                </motion.button>
              </div>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-slate-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-black text-emerald-700 underline decoration-2 underline-offset-4 hover:text-emerald-800">
                Đăng nhập
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
