import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8080/api/v1/auth'}/oauth2/authorization/google`;

const registerSchema = z.object({
  fullName: z.string().min(3, 'Họ tên phải có ít nhất 3 ký tự'),
  email: z.email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên (tối đa 72)'),
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
      const payload = { ...data, role: "USER" };
      const res = await axiosClient.post('/register', payload);
      if (res.status === 201) {
        toast.success('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Pane */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]"></div>
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">Gia nhập cộng đồng sinh viên ưu tú.</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Hàng ngàn sinh viên đã cải thiện điểm số thông qua các công cụ phân tích và ôn tập thông minh của ExamBank.
          </p>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white w-4 h-4" />
              </div>
              ExamBank
            </Link>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-slate-500">Bắt đầu hành trình học tập của bạn miễn phí.</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="mb-6 w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z" />
              <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.3l-3.1 2.4C4.7 18.8 8.1 21 12 21z" />
              <path fill="#FBBC05" d="M6.3 12.9c0-.7.1-1.3.3-1.9L3.5 8.6C2.9 9.9 2.5 11.4 2.5 12.9c0 1.5.4 3 1 4.3l3.1-2.4c-.2-.6-.3-1.2-.3-1.9z" />
              <path fill="#4285F4" d="M12 8.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 5.7 14.6 4.8 12 4.8c-3.9 0-7.3 2.2-8.9 5.4L6.2 12c.8-2.5 3.1-3.4 5.8-3.4z" />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-50 text-slate-400">hoặc đăng ký bằng email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullname-input">Họ và tên</label>
              <input
                id="fullname-input"
                {...register('fullName')}
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email-reg-input">Email</label>
              <input
                id="email-reg-input"
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                placeholder="name@student.vnu.edu.vn"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password-reg-input">Mật khẩu</label>
              <input
                id="password-reg-input"
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                placeholder="Tạo mật khẩu an toàn"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 shadow-md shadow-blue-600/20"
              >
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang tạo tài khoản...</> : 'Tạo tài khoản'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
