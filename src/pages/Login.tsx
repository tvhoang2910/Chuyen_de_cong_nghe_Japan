import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
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
        persistAuthSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          email: res.data.email,
        });
        toast.success('Đăng nhập thành công!', { icon: '👋' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const messageFromServer =
          typeof err.response.data?.message === 'string'
            ? err.response.data.message
            : 'Tài khoản đang bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 30 phút.';
        setLockMessage(messageFromServer);
        toast.error(messageFromServer);
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Pane - Abstract Graphic */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center">
        {/* Gradient Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/50 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/50 rounded-full blur-[100px] mix-blend-multiply"></div>
        
        {/* Content */}
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">Hành trình tới điểm tối đa bắt đầu từ đây.</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            "Chìa khóa của trí nhớ không nằm ở việc học nhiều, mà là học đúng lúc." - Hệ thống Spaced Repetition của chúng tôi sẽ chứng minh điều đó.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white w-4 h-4" />
              </div>
              ExamBank
            </Link>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Chào mừng trở lại</h2>
            <p className="text-slate-500">Đăng nhập vào tài khoản của bạn để tiếp tục ôn tập.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z" />
              <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.3l-3.1 2.4C4.7 18.8 8.1 21 12 21z" />
              <path fill="#FBBC05" d="M6.3 12.9c0-.7.1-1.3.3-1.9L3.5 8.6C2.9 9.9 2.5 11.4 2.5 12.9c0 1.5.4 3 1 4.3l3.1-2.4c-.2-.6-.3-1.2-.3-1.9z" />
              <path fill="#4285F4" d="M12 8.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 5.7 14.6 4.8 12 4.8c-3.9 0-7.3 2.2-8.9 5.4L6.2 12c.8-2.5 3.1-3.4 5.8-3.4z" />
            </svg>
            Đăng nhập bằng Google
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-50 text-slate-400">Hoặc tiếp tục với email</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email-input">Email</label>
              <input
                id="email-input"
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                placeholder="name@student.vnu.edu.vn"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="password-input">Mật khẩu</label>
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">Quên mật khẩu?</Link>
              </div>
              <input
                id="password-input"
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              {lockMessage && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                  {lockMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 shadow-md shadow-blue-600/20"
              >
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang đăng nhập...</> : 'Đăng nhập'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
