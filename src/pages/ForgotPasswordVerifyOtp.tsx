import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const verifyOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP phải gồm đúng 6 chữ số'),
});

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

const ForgotPasswordVerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = useMemo(() => (searchParams.get('email') || '').trim().toLowerCase(), [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  const handleVerifyOtp = async (data: VerifyOtpFormData) => {
    if (!email) {
      toast.error('Thiếu email để xác thực OTP. Vui lòng nhập lại email.');
      navigate('/forgot-password');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axiosClient.post('/forgot-password/verify-otp', {
        email,
        otp: data.otp,
      });

      const resetToken = response.data?.resetToken as string | undefined;
      if (!resetToken) {
        toast.error('Không nhận được reset token hợp lệ.');
        return;
      }

      toast.success('Xác thực OTP thành công. Vui lòng đặt mật khẩu mới.');
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('OTP verification failed:', error);
      toast.error('OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Thiếu email để gửi lại OTP. Vui lòng nhập lại email.');
      navigate('/forgot-password');
      return;
    }

    try {
      setIsResending(true);
      await axiosClient.post('/forgot-password/resend', { email });
      toast.success('Nếu email tồn tại, OTP mới đã được gửi.');
    } catch (error) {
      console.error('OTP resend failed:', error);
      toast.error('Không thể gửi lại OTP lúc này. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại nhập email
        </Link>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Xác thực OTP</h1>
          <p className="text-sm text-slate-500 mt-2">
            OTP đã được gửi đến email: <span className="font-semibold text-slate-700">{email || 'không xác định'}</span>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(handleVerifyOtp)}>
          <div>
            <label htmlFor="otp-input" className="block text-sm font-medium text-slate-700 mb-1.5">Mã OTP (6 chữ số)</label>
            <input
              id="otp-input"
              {...register('otp')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Nhập OTP"
            />
            {errors.otp && <p className="text-red-500 text-sm mt-1.5">{errors.otp.message}</p>}
          </div>

          <button
            id="verify-otp-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-70"
          >
            {isSubmitting ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Đang xác thực...</> : 'Xác thực OTP'}
          </button>
        </form>

        <button
          id="resend-otp-button"
          type="button"
          disabled={isResending}
          onClick={handleResendOtp}
          className="w-full mt-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
        >
          {isResending ? 'Đang gửi lại...' : 'Gửi lại OTP nếu chưa nhận được'}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordVerifyOtp;
