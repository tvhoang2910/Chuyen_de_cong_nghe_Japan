import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự').max(72, 'Mật khẩu quá dài'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!resetToken) {
      toast.error('Thiếu reset token hợp lệ. Vui lòng xác thực OTP lại.');
      navigate('/forgot-password');
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosClient.post('/reset-password', {
        resetToken,
        newPassword: data.newPassword,
      });
      toast.success('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Reset password failed:', error);
      toast.error('Reset token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link to={email ? `/forgot-password/verify?email=${encodeURIComponent(email)}` : '/forgot-password'} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại xác thực OTP
        </Link>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt mật khẩu mới</h1>
          <p className="text-sm text-slate-500 mt-2">Nhập mật khẩu mới để hoàn tất quá trình khôi phục tài khoản.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(handleResetPassword)}>
          <div>
            <label htmlFor="new-password-input" className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
            <input
              id="new-password-input"
              {...register('newPassword')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Ít nhất 8 ký tự"
            />
            {errors.newPassword && <p className="text-red-500 text-sm mt-1.5">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm-password-input" className="block text-sm font-medium text-slate-700 mb-1.5">Nhập lại mật khẩu mới</label>
            <input
              id="confirm-password-input"
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Nhập lại mật khẩu"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          <button
            id="reset-password-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-70"
          >
            {isSubmitting ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang cập nhật...</> : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
