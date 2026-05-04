import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  fetchCurrentUserProfile,
  getCurrentSessionRole,
} from "./api/axiosClient";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyRegisterEmail = lazy(() => import("./pages/VerifyRegisterEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ForgotPasswordVerifyOtp = lazy(
  () => import("./pages/ForgotPasswordVerifyOtp"),
);
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OAuth2Success = lazy(() => import("./pages/OAuth2Success"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAchievements = lazy(() => import("./pages/AdminAchievements"));
const ExamManagement = lazy(() => import("./pages/ExamManagement"));
const PublicExams = lazy(() => import("./pages/PublicExams"));
const ExamStart = lazy(() => import("./pages/ExamStart"));
const ExamAttempt = lazy(() => import("./pages/ExamAttempt"));
const ExamResult = lazy(() => import("./pages/ExamResult"));
const SpacedRepetition = lazy(() => import("./pages/SpacedRepetition.tsx"));
const SpacedRepetitionPractice = lazy(
  () => import("./pages/SpacedRepetitionPractice.tsx"),
);
const Gamification = lazy(() => import("./pages/Gamification"));
const SubscriptionPayments = lazy(() => import("./pages/SubscriptionPayments"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const SubscriptionReviewQueue = lazy(
  () => import("./pages/SubscriptionReviewQueue"),
);
const PremiumPlanManagement = lazy(
  () => import("./pages/PremiumPlanManagement"),
);
const AuditVipApproval = lazy(() => import("./pages/audit/AuditVipApproval"));
const AuditPayments = lazy(() => import("./pages/audit/AuditPayments"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const CommentsPage = lazy(() => import("./pages/CommentsPage"));
const UserExamUpload = lazy(() => import("./pages/UserExamUpload"));
const MyExamUploads = lazy(() => import("./pages/MyExamUploads"));
const AdminUploadQueue = lazy(() => import("./pages/AdminUploadQueue"));

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-semibold italic animate-pulse">
    Đang tải hệ thống...
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  isAuthenticated: boolean;
  userRole: string | null;
  defaultPath: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  isAuthenticated,
  userRole,
  defaultPath,
}: ProtectedRouteProps) => {
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole || ""))
    return <Navigate to={defaultPath} />;
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("access_token")),
  );
  const [role, setRole] = useState(() => getCurrentSessionRole());

  const hasTokenInStorage = Boolean(localStorage.getItem("access_token"));
  const effectiveIsAuthenticated = isAuthenticated || hasTokenInStorage;
  const effectiveRole = role ?? getCurrentSessionRole();

  let defaultAuthenticatedPath = "/dashboard";
  if (effectiveRole === "ADMIN") {
    defaultAuthenticatedPath = "/admin/users";
  } else if (effectiveRole === "AUDIT") {
    defaultAuthenticatedPath = "/admin/audit/vip";
  } else if (effectiveRole === "CONTRIBUTOR") {
    defaultAuthenticatedPath = "/contributor";
  }

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
      setRole(getCurrentSessionRole());
    };

    globalThis.addEventListener("storage", syncAuthState);
    globalThis.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);

    return () => {
      globalThis.removeEventListener("storage", syncAuthState);
      globalThis.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthState);
    };
  }, []);

  useEffect(() => {
    if (!effectiveIsAuthenticated) {
      return undefined;
    }

    let cancelled = false;
    const verifyRole = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        if (cancelled) {
          return;
        }

        const backendRole = profile.role;
        const localRole = localStorage.getItem("user_role");

        if (!localRole && backendRole) {
          localStorage.setItem("user_role", backendRole);
          setRole(backendRole);
          return;
        }

        if (backendRole && localRole && backendRole !== localRole) {
          console.warn("[App] Role mismatch detected, clearing local session");
          clearAuthSession();
        }
      } catch {
        // Ignore transient network errors and retry on next interval.
      }
    };

    void verifyRole();
    const intervalId = globalThis.setInterval(verifyRole, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      globalThis.clearInterval(intervalId);
    };
  }, [effectiveIsAuthenticated]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <Toaster
          position="top-right"
          containerStyle={{ pointerEvents: "none" }}
          toastOptions={{
            style: {
              pointerEvents: "none",
            },
          }}
        />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/login"
              element={
                effectiveIsAuthenticated ? (
                  <Navigate to={defaultAuthenticatedPath} />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={
                effectiveIsAuthenticated ? (
                  <Navigate to={defaultAuthenticatedPath} />
                ) : (
                  <Register />
                )
              }
            />
            <Route
              path="/register/verify-email"
              element={<VerifyRegisterEmail />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/forgot-password/verify"
              element={<ForgotPasswordVerifyOtp />}
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth2/success" element={<OAuth2Success />} />

            {/* User/Contributor Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription-payments"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <SubscriptionPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <NotificationSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exams"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <PublicExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exams/:examId"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <ExamStart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exams/:examId/attempt"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <ExamAttempt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/spaced-repetition"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <SpacedRepetition />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/spaced-repetition/:examId/practice"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <SpacedRepetitionPractice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gamification"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <Gamification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/attempts/:attemptId/result"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER"]}
                >
                  <ExamResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exams/:examId/comments"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER", "ADMIN", "CONTRIBUTOR", "TEACHER"]}
                >
                  <CommentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR"]}
                >
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/exams"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR"]}
                >
                  <ExamManagement mode="CONTRIBUTOR" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/subscription-reviews"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR"]}
                >
                  <SubscriptionReviewQueue mode="contributor" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/premium-plans"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR"]}
                >
                  <PremiumPlanManagement mode="contributor" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/reports"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR"]}
                >
                  <AdminReports mode="contributor" />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/achievements"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <AdminAchievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <ExamManagement mode="ADMIN" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscription-reviews"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <SubscriptionReviewQueue mode="admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit/vip"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["AUDIT"]}
                >
                  <AuditVipApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit/payments"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["AUDIT"]}
                >
                  <AuditPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/premium-plans"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <PremiumPlanManagement mode="admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN"]}
                >
                  <AdminReports mode="admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN", "CONTRIBUTOR"]}
                >
                  {effectiveRole === "ADMIN" ? (
                    <AdminReports mode="admin" />
                  ) : (
                    <AdminReports mode="contributor" />
                  )}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                !effectiveIsAuthenticated ? (
                  <Navigate to="/login" />
                ) : (
                  <Navigate to={defaultAuthenticatedPath} />
                )
              }
            />

            {/* Exam Upload (shared) */}
            <Route
              path="/upload-exam"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER", "CONTRIBUTOR", "ADMIN"]}
                >
                  <UserExamUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-uploads"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["USER", "CONTRIBUTOR", "ADMIN"]}
                >
                  <MyExamUploads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upload-queue"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["ADMIN", "CONTRIBUTOR"]}
                >
                  <AdminUploadQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/upload-queue"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={["CONTRIBUTOR", "ADMIN"]}
                >
                  <AdminUploadQueue />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
