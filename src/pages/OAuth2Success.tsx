import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { exchangeOAuth2Code, persistAuthSession } from '../api/axiosClient';

const OAuth2Success: React.FC = () => {
  const [searchParameters] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const code = searchParameters.get('code');

    if (!code) {
      navigate('/login', { replace: true });
      return () => {
        active = false;
      };
    }

    const completeOAuth2Login = async () => {
      try {
        const authSession = await exchangeOAuth2Code(code);
        if (!active) {
          return;
        }

        persistAuthSession(authSession);

        let targetPath = '/dashboard';
        if (authSession.role === 'ADMIN') {
          targetPath = '/admin/users';
        } else if (authSession.role === 'CONTRIBUTOR') {
          targetPath = '/contributor';
        }

        navigate(targetPath, { replace: true });
      } catch {
        if (active) {
          navigate('/login', { replace: true });
        }
      }
    };

    void completeOAuth2Login();

    return () => {
      active = false;
    };
  }, [searchParameters, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-600 font-bold animate-pulse">Đang xác thực tài khoản...</p>
    </div>
  );
};

export default OAuth2Success;
