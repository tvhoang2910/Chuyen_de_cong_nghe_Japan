import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { usePushNotification } from '@/hooks/usePushNotification';
import { Toaster } from 'react-hot-toast';
import { AUTH_SESSION_CHANGED_EVENT, getCurrentSessionRole } from './api/axiosClient';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyRegisterEmail = lazy(() => import('./pages/VerifyRegisterEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ForgotPasswordVerifyOtp = lazy(() => import('./pages/ForgotPasswordVerifyOtp'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OAuth2Success = lazy(() => import('./pages/OAuth2Success'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAchievements = lazy(() => import('./pages/AdminAchievements'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const ExamManagement = lazy(() => import('./pages/ExamManagement'));
const PublicExams = lazy(() => import('./pages/PublicExams'));
const ExamStart = lazy(() => import('./pages/ExamStart'));
const ExamAttempt = lazy(() => import('./pages/ExamAttempt'));
const ExamResult = lazy(() => import('./pages/ExamResult'));
const SpacedRepetition = lazy(() => import('./pages/SpacedRepetition.tsx'));
const SpacedRepetitionPractice = lazy(() => import('./pages/SpacedRepetitionPractice.tsx'));
const Gamification = lazy(() => import('./pages/Gamification'));
const SubscriptionPayments = lazy(() => import('./pages/SubscriptionPayments'));
const SubscriptionReviewQueue = lazy(() => import('./pages/SubscriptionReviewQueue'));
const PremiumPlanManagement = lazy(() => import('./pages/PremiumPlanManagement'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const CommentsPage = lazy(() => import('./pages/CommentsPage'));

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

const ProtectedRoute = ({ children, allowedRoles, isAuthenticated, userRole, defaultPath }: ProtectedRouteProps) => {
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(userRole || '')) return <Navigate to={defaultPath} />;
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [role, setRole] = useState(() => getCurrentSessionRole());
  
  const hasTokenInStorage = Boolean(localStorage.getItem('access_token'));
  const effectiveIsAuthenticated = isAuthenticated || hasTokenInStorage;
  const effectiveRole = role ?? getCurrentSessionRole();
  
  let defaultAuthenticatedPath = '/dashboard';
  if (effectiveRole === 'ADMIN') {
    defaultAuthenticatedPath = '/admin/users';
  } else if (effectiveRole === 'CONTRIBUTOR') {
    defaultAuthenticatedPath = '/contributor';
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

  const { subscribe, unsubscribe } = usePushNotification();
  const prevAuth = useRef(false);

  useEffect(() => {
    if (effectiveIsAuthenticated && !prevAuth.current) {
      // User just logged in — subscribe to push notifications
      void subscribe();
    }
    if (!effectiveIsAuthenticated && prevAuth.current) {
      // User just logged out — remove stale browser subscription binding
      void unsubscribe();
    }
    prevAuth.current = effectiveIsAuthenticated;
  }, [effectiveIsAuthenticated, subscribe, unsubscribe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <Toaster
          position="top-right"
          containerStyle={{ pointerEvents: 'none' }}
          toastOptions={{
            style: {
              pointerEvents: 'none',
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
              element={effectiveIsAuthenticated ? <Navigate to={defaultAuthenticatedPath} /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={effectiveIsAuthenticated ? <Navigate to={defaultAuthenticatedPath} /> : <Register />} 
            />
            <Route path="/register/verify-email" element={<VerifyRegisterEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password/verify" element={<ForgotPasswordVerifyOtp />} />
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
                >
                  <SubscriptionPayments />
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER']}
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
                  allowedRoles={['USER', 'ADMIN', 'CONTRIBUTOR', 'TEACHER']}
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
                  allowedRoles={['CONTRIBUTOR']}
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
                  allowedRoles={['CONTRIBUTOR']}
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
                  allowedRoles={['CONTRIBUTOR']}
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
                  allowedRoles={['CONTRIBUTOR']}
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
                  allowedRoles={['CONTRIBUTOR']}
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
                  allowedRoles={['ADMIN']}
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
                  allowedRoles={['ADMIN']}
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
                  allowedRoles={['ADMIN']}
                >
                  <AdminAchievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute
                  isAuthenticated={effectiveIsAuthenticated}
                  userRole={effectiveRole}
                  defaultPath={defaultAuthenticatedPath}
                  allowedRoles={['ADMIN']}
                >
                  <AuditLogPage />
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
                  allowedRoles={['ADMIN']}
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
                  allowedRoles={['ADMIN']}
                >
                  <SubscriptionReviewQueue mode="admin" />
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
                  allowedRoles={['ADMIN']}
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
                  allowedRoles={['ADMIN']}
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
                  allowedRoles={['ADMIN', 'CONTRIBUTOR']}
                >
                  {effectiveRole === 'ADMIN' ? <AdminReports mode="admin" /> : <AdminReports mode="contributor" />}
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/users" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
