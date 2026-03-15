import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:8080/api/v1/auth'}/oauth2/authorization/google`;

const registerSchema = z.object({
  fullName: z.string().min(3, 'Họ tên phải có ít nhất 3 ký tự'),
  email: z.email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
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
        toast.success('Tạo tài khoản thành công! Đang chuyển hướng...', { icon: '🚀' });
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error('Email này đã được sử dụng. Vui lòng thử email khác.');
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
      {/* Left Pane */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900"></div>
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }}></div>
        
        <div className="relative z-10 p-16 max-w-xl text-white">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/20"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-6xl font-black mb-8 leading-[1.1] tracking-tight">Gia nhập cộng đồng học tập thông minh.</h1>
          <p className="text-blue-100 text-xl leading-relaxed font-medium mb-12">
            Hàng ngàn sinh viên VNU đang sử dụng ExamBank để tối ưu hóa thời gian ôn luyện và đạt kết quả cao nhất.
          </p>

          <div className="space-y-6">
             {[
               "Kho đề thi khổng lồ từ các học phần VNU",
               "Thuật toán SM-2 giúp ghi nhớ lâu bền",
               "Phân tích năng lực cá nhân bằng AI"
             ].map((text, i) => (
               <motion.div 
                 key={i}
                 initial={{ x: -20, opacity: 0 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.5 + i * 0.1 }}
                 className="flex items-center gap-4"
               >
                 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-bold text-white/90">{text}</span>
               </motion.div>
             ))}
          </div>
        </div>
      </div>

      {/* Right Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang chủ
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-slate-500 font-medium">Bắt đầu hành trình học tập của bạn hoàn toàn miễn phí.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm mb-8"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.6-.1-1.2-.2-1.8H12z" />
              <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3-2.3c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.3l-3.1 2.4C4.7 18.8 8.1 21 12 21z" />
              <path fill="#FBBC05" d="M6.3 12.9c0-.7.1-1.3.3-1.9L3.5 8.6C2.9 9.9 2.5 11.4 2.5 12.9c0 1.5.4 3 1 4.3l3.1-2.4c-.2-.6-.3-1.2-.3-1.9z" />
              <path fill="#4285F4" d="M12 8.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 5.7 14.6 4.8 12 4.8c-3.9 0-7.3 2.2-8.9 5.4L6.2 12c.8-2.5 3.1-3.4 5.8-3.4z" />
            </svg>
            Tiếp tục với Google
          </motion.button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="px-4 bg-slate-50">Hoặc đăng ký bằng Email</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email sinh viên</label>
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
              <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  {...register('password')}
                  type="password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-base font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all disabled:opacity-70 shadow-xl shadow-blue-600/20"
              >
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang tạo tài khoản...</> : 'Bắt đầu ngay bây giờ'}
              </motion.button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-black text-blue-600 hover:text-blue-700 underline underline-offset-4">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
