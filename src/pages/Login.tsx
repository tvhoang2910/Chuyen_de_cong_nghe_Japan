import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  BookOpen,
  Loader2,
  Sparkles,
  Orbit,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import axiosClient, {
  fetchCurrentUserProfile,
  persistAuthSession,
} from "../api/axiosClient";
import { buildGoogleOAuthAuthorizationUrl } from "../config/env";

const GoogleIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.8H12z"
    />
    <path
      fill="#34A853"
      d="M3.7 7.7l3.2 2.3C7.8 8.1 9.7 6.6 12 6.6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 8.4 2.4 5.2 4.4 3.7 7.7z"
    />
    <path
      fill="#FBBC05"
      d="M2.6 11.8c0 1.5.4 2.9 1.1 4.1l3.6-2.8c-.2-.5-.3-.9-.3-1.3 0-.5.1-1 .3-1.4L3.7 7.7c-.7 1.2-1.1 2.6-1.1 4.1z"
    />
    <path
      fill="#4285F4"
      d="M12 21.2c2.7 0 4.9-.9 6.5-2.4L15.5 16c-.8.6-1.9 1-3.5 1-2.3 0-4.2-1.5-4.9-3.6l-3.6 2.8c1.5 3.3 4.7 5 8.5 5z"
    />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleLogin = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosClient.post("/login", formData);
      persistAuthSession(response.data);

      let userRole = response.data.role as string | undefined;
      if (!userRole) {
        const profile = await fetchCurrentUserProfile();
        userRole = profile.role;
        persistAuthSession({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          email: response.data.email,
          role: profile.role,
        });
      }

      let targetPath = "/dashboard";
      if (userRole === "ADMIN") {
        targetPath = "/admin/users";
      } else if (userRole === "AUDIT") {
        targetPath = "/admin/audit/vip";
      } else if (userRole === "CONTRIBUTOR") {
        targetPath = "/contributor";
      }

      toast.success("Đăng nhập thành công!");
      navigate(targetPath);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const backendMessage = axiosError.response?.data?.message;
      if (backendMessage === "Email is not verified") {
        const normalizedEmail = formData.email.trim().toLowerCase();
        toast.error(
          "Email chưa xác thực. Vui lòng xác thực OTP để kích hoạt tài khoản.",
        );
        if (normalizedEmail) {
          navigate(
            `/register/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
          );
        }
      } else {
        toast.error(
          backendMessage || "Đăng nhập thất bại. Vui lòng kiểm tra lại.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    globalThis.location.href = buildGoogleOAuthAuthorizationUrl();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,#2563eb55_0%,transparent_38%),radial-gradient(circle_at_88%_14%,#22d3ee3f_0%,transparent_30%),radial-gradient(circle_at_40%_90%,#7c3aed3d_0%,transparent_35%)]" />
      <div className="absolute inset-0 bg-noise opacity-30" />
      <motion.div
        className="auth-orb auth-orb-one"
        animate={{ x: [0, 18, -12, 0], y: [0, -18, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="auth-orb auth-orb-two"
        animate={{ x: [0, -16, 20, 0], y: [0, 16, -16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex items-center justify-center p-14 xl:p-20">
          <div className="auth-perspective w-full max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 24, rotateX: 12 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8 }}
              className="auth-tilt-card rounded-[2rem] border border-white/20 bg-white/10 p-8 backdrop-blur-xl"
            >
              <Link to="/" className="mb-8 inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/40 bg-cyan-300/20">
                  <BookOpen className="h-6 w-6 text-cyan-100" />
                </div>
                <span className="text-2xl font-black tracking-tight">
                  ExamBank
                </span>
              </Link>

              <h2 className="text-5xl font-black leading-tight">
                Chào mừng trở lại
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-200">
                Kích hoạt lại nhịp học tập của bạn với dashboard thông minh, lộ
                trình bám sát tiến độ và kho đề thi liên tục cập nhật.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: Orbit, label: "SM-2 Engine", value: "92% nhớ lâu" },
                  {
                    icon: Sparkles,
                    label: "Smart Insights",
                    value: "AI gợi ý đề",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Secure Login",
                    value: "JWT + Refresh",
                  },
                  {
                    icon: BookOpen,
                    label: "Question Bank",
                    value: "10k+ câu hỏi",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/15 bg-slate-900/30 p-4"
                  >
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-300">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-xl rounded-[2rem] border border-white/25 bg-white/90 p-7 text-slate-900 shadow-[0_30px_100px_-30px_rgba(14,116,144,0.65)] backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  Đăng nhập
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Sẵn sàng quay lại guồng học tập chưa?
                </p>
              </div>
              <Link
                to="/"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:border-cyan-200 hover:text-cyan-700"
              >
                Home
              </Link>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email-input"
                  className="mb-2 ml-1 block text-xs font-black uppercase tracking-[0.14em] text-slate-500"
                >
                  Địa chỉ Email
                </label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
                  <input
                    id="email-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@university.edu"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 ml-1 flex items-center justify-between">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500"
                  >
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-black uppercase tracking-[0.1em] text-cyan-700 hover:text-cyan-800"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
                  <input
                    id="password-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-black text-white shadow-lg shadow-slate-900/25 transition-all hover:bg-cyan-700 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Xác nhận đăng nhập"
                )}
                {!isLoading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <span className="bg-white px-4">Hoặc tiếp tục với</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/60 hover:text-cyan-800"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>

            <p className="mt-8 text-center text-sm font-semibold text-slate-500">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-black text-cyan-700 underline decoration-2 underline-offset-4 hover:text-cyan-800"
              >
                Đăng ký ngay
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
