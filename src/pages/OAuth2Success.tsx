import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clearAuthSession, persistAuthSession } from '../api/axiosClient';

const OAuth2Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const email = searchParams.get('email');

    if (token) {
      persistAuthSession({
        accessToken: token,
        refreshToken: refreshToken || undefined,
        email: email || undefined,
      });
      toast.success('Đăng nhập Google thành công!');
      navigate('/dashboard', { replace: true });
      return;
    }

    clearAuthSession();
    toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    navigate('/login', { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm text-center">
        <p className="text-slate-700 font-semibold">Đang hoàn tất đăng nhập Google...</p>
      </div>
    </div>
  );
};

export default OAuth2Success;
