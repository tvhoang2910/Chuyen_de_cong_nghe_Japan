# Exam Web (exam_bank)

Tai lieu nay mo ta module frontend exam-web theo source code hien tai.

## 1. Tong quan

Exam Web la SPA cho he thong Exam Bank, bao gom:

- Auth flow: login/register/verify email/forgot password/reset password/OAuth2 success.
- User dashboard: public exams, start attempt, attempt result.
- Study features: spaced repetition + gamification.
- Community comments theo exam.
- Admin/Contributor workspaces: exam management, reports, subscription reviews, premium plans, audit logs, user management.

Frontend chay voi React Router va giao tiep toi nhieu backend services (auth/exam/study/community).

## 2. Tech stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Axios
- React Hook Form + Zod
- Recharts
- Framer Motion
- Vitest + Testing Library
- Playwright E2E

## 3. Runtime requirements

- Node.js 20+
- npm 10+

Can backend services dang chay de test full flow:

- auth_service
- exam_service
- study_service
- community_service

## 4. Chay local

### 4.1 Cai dependency

```bash
npm install
```

### 4.2 Tao file .env (goi y)

```bash
VITE_AUTH_API_BASE_URL=http://localhost:8080/api/v1/auth
VITE_EXAM_API_BASE_URL=http://localhost:8082/api/v1/exam
VITE_STUDY_API_BASE_URL=http://localhost:8085/api/v1/study
VITE_COMMUNITY_API_BASE_URL=http://localhost:8084/api/v1/community

# Neu can tach endpoint analytics rieng
VITE_ANALYTICS_API_BASE_URL=http://localhost:8082/api/v1/exam/analytics

# Optional: TTL cache GET requests o auth axios client
VITE_GET_CACHE_TTL_MS=5000
```

Luu y:

- authApiBaseUrl trong frontend fallback theo thu tu:
  - VITE_AUTH_API_BASE_URL
  - VITE_API_BASE_URL
  - VITE_AUTH_BASE_URL
  - mac dinh: http://localhost:8080/api/v1/auth

### 4.3 Run dev server

```bash
npm run dev
```

Mac dinh app se chay tai:

- http://localhost:5173

### 4.4 Build production

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## 5. Scripts

- npm run dev: chay local dev server
- npm run build: type-check + bundle production
- npm run lint: lint source
- npm run preview: preview bundle da build
- npm run test: vitest watch mode
- npm run test:run: vitest run one-shot
- npm run test:ui: vitest UI

## 6. E2E tests (Playwright)

Run E2E:

```bash
npx playwright test
```

Mac dinh Playwright:

- Base URL: http://localhost:5173
- Tu dong start web server bang npm run dev (co the tat bang PLAYWRIGHT_USE_LOCAL_SERVER=false)

Co the override:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:4173
PLAYWRIGHT_USE_LOCAL_SERVER=false
```

Test files hien co:

- tests/comment-flow.spec.ts
- tests/spaced-repetition.spec.ts
- tests/spaced-repetition-professional.spec.ts

## 7. Route map chinh

Public routes:

- /
- /features
- /pricing
- /about
- /login
- /register
- /register/verify-email
- /forgot-password
- /forgot-password/verify
- /reset-password
- /oauth2/success

User routes:

- /dashboard
- /dashboard/subscription-payments
- /dashboard/exams
- /dashboard/exams/:examId
- /dashboard/exams/:examId/attempt
- /dashboard/attempts/:attemptId/result
- /dashboard/spaced-repetition
- /dashboard/spaced-repetition/:examId/practice
- /dashboard/gamification
- /dashboard/exams/:examId/comments

Contributor routes:

- /contributor
- /contributor/exams
- /contributor/subscription-reviews
- /contributor/premium-plans
- /contributor/reports

Admin routes:

- /admin/users
- /admin/dashboard
- /admin/audit-logs
- /admin/exams
- /admin/subscription-reviews
- /admin/premium-plans
- /admin/reports

## 8. API integration map

- Auth API:
  - src/config/env.ts
  - src/api/axiosClient.ts
  - src/api/pushNotification.ts
- Exam API:
  - src/api/examClient.ts
  - src/api/reportClient.ts
- Study API:
  - src/api/studyClient.ts
- Community API:
  - src/api/commentClient.ts
- Analytics API:
  - src/api/questionAnalytics.ts

## 9. Push notification + PWA notes

- Service worker duoc register trong src/main.tsx tu file public/sw.js.
- Frontend su dung usePushNotification hook de subscribe/unsubscribe khi user login/logout.
- VAPID public key lay tu auth_service endpoint /push-subscription/vapid-public-key.

## 10. Thu muc quan trong

- src/pages: page-level UI theo route
- src/components: reusable UI components
- src/hooks: reusable hooks (SSE, push, ...)
- src/api: API clients + payload types
- src/config: env resolver
- src/__tests__: unit/integration tests cho frontend
- tests: Playwright E2E tests

## 11. Troubleshooting nhanh

- Loi 401/403 sau login:
  - Kiem tra access token trong localStorage.
  - Kiem tra JWT secret/issuer cua cac backend service co dong bo auth_service khong.
- Loi CORS:
  - Kiem tra CORS_ALLOWED_ORIGINS o auth_service/exam_service.
  - Kiem tra community_service/study_service CORS config (mac dinh localhost:5173).
- Loi API URL:
  - In console ra gia tri env va xac nhan VITE_* variables da duoc nap dung.

