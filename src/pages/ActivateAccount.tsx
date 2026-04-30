import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserCheck, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const activateAccountSchema = z.object({
  otp: z.string().min(6, 'Mã OTP phải có 6 ký tự').max(6, 'Mã OTP phải có 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').max(72, 'Mật khẩu quá dài'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'Mật khẩu nhập lại không khớp',
  path: ['confirmPassword'],
});

type ActivateAccountFormData = z.infer<typeof activateAccountSchema>;

const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailParam = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const otpParam = useMemo(() => searchParams.get('otp') || '', [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<ActivateAccountFormData>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: {
      otp: otpParam
    }
  });

  const handleActivateAccount = async (data: ActivateAccountFormData) => {
    if (!emailParam) {
      toast.error('Đường dẫn không hợp lệ (thiếu email).');
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosClient.post('/activate', {
        email: emailParam,
        otp: data.otp,
        password: data.newPassword,
      });
      toast.success('Kích hoạt tài khoản thành công. Vui lòng đăng nhập.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('Account activation failed:', error);
      const msg = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
            <UserCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kích hoạt tài khoản</h1>
          <p className="text-sm text-slate-500 mt-2">
            Vui lòng nhập mã OTP được gửi đến email <strong>{emailParam}</strong> và thiết lập mật khẩu của bạn.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(handleActivateAccount)}>
          <div>
            <label htmlFor="otp-input" className="block text-sm font-medium text-slate-700 mb-1.5">Mã OTP</label>
            <input
              id="otp-input"
              {...register('otp')}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-center tracking-widest text-lg font-bold uppercase"
              placeholder="XXXXXX"
              maxLength={6}
            />
            {errors.otp && <p className="text-red-500 text-sm mt-1.5">{errors.otp.message}</p>}
          </div>

          <div>
            <label htmlFor="new-password-input" className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
            <input
              id="new-password-input"
              {...register('newPassword')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
              placeholder="Ít nhất 6 ký tự"
            />
            {errors.newPassword && <p className="text-red-500 text-sm mt-1.5">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm-password-input" className="block text-sm font-medium text-slate-700 mb-1.5">Nhập lại mật khẩu mới</label>
            <input
              id="confirm-password-input"
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
              placeholder="Nhập lại mật khẩu"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-70 mt-4"
          >
            {isSubmitting ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang kích hoạt...</> : 'Kích hoạt tài khoản'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors">
              Quay lại đăng nhập
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivateAccount;
