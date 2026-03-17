import React, { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const verifyEmailSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP phải gồm đúng 6 chữ số'),
});

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

const VerifyRegisterEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => (searchParams.get('email') || '').trim().toLowerCase(), [searchParams]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
  });

  const handleVerify = async (data: VerifyEmailFormData) => {
    if (!email) {
      toast.error('Thiếu email xác thực. Vui lòng đăng ký lại.');
      return;
    }

    try {
      setIsVerifying(true);
      await axiosClient.post('/register/verify-email', {
        email,
        otp: data.otp,
      });
      toast.success('Xác thực email thành công. Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Thiếu email xác thực. Vui lòng đăng ký lại.');
      return;
    }

    try {
      setIsResending(true);
      await axiosClient.post('/register/resend-verification', { email });
      toast.success('OTP mới đã được gửi tới email của bạn.');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Không thể gửi lại OTP lúc này.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/10 p-7 backdrop-blur-xl sm:p-10">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200 hover:border-cyan-200 hover:text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng ký
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20">
              <MailCheck className="h-6 w-6 text-cyan-200" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Xác thực email</h1>
              <p className="text-sm text-slate-300">Kích hoạt tài khoản trước khi đăng nhập</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-200/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
            OTP đã được gửi tới <span className="font-bold">{email || 'email chưa xác định'}</span>. Mã có hiệu lực trong vài phút.
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit(handleVerify)}>
            <div>
              <label htmlFor="register-verify-otp" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                OTP (6 chữ số)
              </label>
              <input
                id="register-verify-otp"
                {...register('otp')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-4 text-base font-bold tracking-[0.2em] outline-none transition-all focus:border-cyan-300"
              />
              {errors.otp && <p className="mt-2 text-sm font-semibold text-rose-300">{errors.otp.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition-all hover:bg-cyan-300 disabled:opacity-60"
            >
              {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              Xác thực email
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-5 py-3 font-black text-white transition-all hover:border-cyan-200 hover:text-cyan-100 disabled:opacity-60"
          >
            {isResending ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            Gửi lại OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyRegisterEmail;
