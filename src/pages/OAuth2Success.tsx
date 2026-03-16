import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { persistAuthSession } from '../api/axiosClient';

const OAuth2Success: React.FC = () => {
  const [searchParameters] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParameters.get('accessToken') ?? searchParameters.get('token');
    const refreshToken = searchParameters.get('refreshToken');
    const email = searchParameters.get('email');
    const role = searchParameters.get('role');

    if (accessToken) {
      persistAuthSession({
        accessToken,
        refreshToken: refreshToken || undefined,
        email: email || undefined,
        role: role || undefined,
      });

      let targetPath = '/dashboard';
      if (role === 'ADMIN') {
        targetPath = '/admin/users';
      } else if (role === 'CONTRIBUTOR') {
        targetPath = '/contributor';
      }
      
      navigate(targetPath);
    } else {
      navigate('/login');
    }
  }, [searchParameters, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-600 font-bold animate-pulse">Đang xác thực tài khoản...</p>
    </div>
  );
};

export default OAuth2Success;
