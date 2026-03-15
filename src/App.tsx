import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ForgotPasswordVerifyOtp from './pages/ForgotPasswordVerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import OAuth2Success from './pages/OAuth2Success';
import AdminUsers from './pages/AdminUsers';
import { AUTH_SESSION_CHANGED_EVENT, getCurrentSessionRole } from './api/axiosClient';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [role, setRole] = useState(() => getCurrentSessionRole());
  const hasTokenInStorage = Boolean(localStorage.getItem('access_token'));
  const effectiveIsAuthenticated = isAuthenticated || hasTokenInStorage;
  const effectiveRole = role ?? getCurrentSessionRole();
  const defaultAuthenticatedPath = effectiveRole === 'ADMIN' ? '/admin/users' : '/dashboard';

  let adminUsersElement = <Navigate to="/login" />;
  if (effectiveIsAuthenticated && effectiveRole === 'ADMIN') {
    adminUsersElement = <AdminUsers />;
  }
  if (effectiveIsAuthenticated && effectiveRole !== 'ADMIN') {
    adminUsersElement = <Navigate to="/dashboard" />;
  }

  let dashboardElement = <Navigate to="/login" />;
  if (effectiveIsAuthenticated && effectiveRole === 'ADMIN') {
    dashboardElement = <Navigate to="/admin/users" />;
  }
  if (effectiveIsAuthenticated && effectiveRole !== 'ADMIN') {
    dashboardElement = <Dashboard />;
  }

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem('access_token')));
      setRole(getCurrentSessionRole());
    };

    globalThis.addEventListener('storage', syncAuthState);
    globalThis.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);

    return () => {
      globalThis.removeEventListener('storage', syncAuthState);
      globalThis.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={effectiveIsAuthenticated ? <Navigate to={defaultAuthenticatedPath} /> : <Login />} />
          <Route path="/register" element={effectiveIsAuthenticated ? <Navigate to={defaultAuthenticatedPath} /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/forgot-password/verify" element={<ForgotPasswordVerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth2/success" element={<OAuth2Success />} />
          <Route path="/dashboard" element={dashboardElement} />
          <Route path="/admin/users" element={adminUsersElement} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
