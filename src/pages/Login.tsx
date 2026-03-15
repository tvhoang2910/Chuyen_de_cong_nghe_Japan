import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axiosClient, { persistAuthSession } from '../api/axiosClient';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8080/api/v1/auth'}/oauth2/authorization/google`;

const loginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    globalThis.location.href = GOOGLE_AUTH_URL;
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setLockMessage(null);
      const res = await axiosClient.post('/login', data);
      if (res.status === 200 && res.data.accessToken) {
        const nextPath = res.data.role === 'ADMIN' ? '/admin/users' : '/dashboard';
        persistAuthSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          email: res.data.email,
          role: res.data.role,
        });
        toast.success('Chào mừng bạn quay trở lại!', { icon: '✨' });
        setTimeout(() => {
          navigate(nextPath);
        }, 500);
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const messageFromServer =
          typeof err.response.data?.message === 'string'
            ? err.response.data.message
            : 'Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau 30 phút.';
        setLockMessage(messageFromServer);
        toast.error(messageFromServer);
      } else {
        toast.error('Email hoặc mật khẩu không chính xác.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex bg-white font-sans overflow-hidden"
    >
      {/* Left Pane - Premium Graphic */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3b82f6,transparent_50%)] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#6366f1,transparent_50%)] opacity-20"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-float"></div>
        
        <div className="relative z-10 p-16 max-w-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-blue-600/40"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-black text-white mb-8 leading-[1.1] tracking-tight"
          >
            Hành trình chinh phục <br /> <span className="text-blue-500">tri thức VNU.</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-xl leading-relaxed font-medium"
          >
            Đăng nhập để tiếp tục lộ trình ôn tập cá nhân hóa và vượt qua mọi kỳ thi với kết quả xuất sắc nhất.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex items-center gap-4 p-4 glass border-white/5 rounded-2xl"
          >
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
               <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
               <p className="text-white font-bold">SM-2 Algorithm Active</p>
               <p className="text-slate-400 text-sm">Tối ưu hóa khả năng ghi nhớ của bạn.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang chủ
            </Link>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Chào mừng trở lại</h2>
            <p className="text-slate-500 font-medium">Bắt đầu phiên học tập mới của bạn ngay bây giờ.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm mb-8"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z" />
              <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.3l-3.1 2.4C4.7 18.8 8.1 21 12 21z" />
              <path fill="#FBBC05" d="M6.3 12.9c0-.7.1-1.3.3-1.9L3.5 8.6C2.9 9.9 2.5 11.4 2.5 12.9c0 1.5.4 3 1 4.3l3.1-2.4c-.2-.6-.3-1.2-.3-1.9z" />
              <path fill="#4285F4" d="M12 8.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 5.7 14.6 4.8 12 4.8c-3.9 0-7.3 2.2-8.9 5.4L6.2 12c.8-2.5 3.1-3.4 5.8-3.4z" />
            </svg>
            Đăng nhập với Google
          </motion.button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="px-4 bg-slate-50">Hoặc sử dụng Email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email của bạn</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                  placeholder="name@student.vnu.edu.vn"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('password')}
                  type="password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              {lockMessage && (
                <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 font-bold flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {lockMessage}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-base font-black text-white bg-slate-900 hover:bg-blue-600 focus:outline-none transition-all disabled:opacity-70 shadow-xl shadow-slate-900/10"
              >
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang xác thực...</> : 'Đăng nhập ngay'}
              </motion.button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500">
            Bạn là thành viên mới?{' '}
            <Link to="/register" className="font-black text-blue-600 hover:text-blue-700 underline underline-offset-4">
              Tạo tài khoản miễn phí
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
