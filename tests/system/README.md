# System E2E Suite

This folder contains production-like system E2E tests for the full Exam Bank platform.

## Coverage

- `api-openapi-smoke.spec.ts`
  - Loads all operations from generated OpenAPI specs:
    - `openapi-auth.generated.yaml`
    - `openapi-exam.generated.yaml`
    - `openapi-study.generated.yaml`
    - `openapi-community.generated.yaml`
  - Executes each endpoint with safe test payloads.
  - Fails immediately on any HTTP `5xx` response.

- `end-user-platform-flow.spec.ts`
  - Runs a cross-service end-user journey:
    1. Ensure a published exam exists (create/publish with admin token if needed)
    2. Load attempt view
    3. Start attempt
    4. Save answer batch
    5. Submit attempt
    6. Fetch result
    7. Verify study analytics/gamification endpoints
    8. Create comment and vote in community service

- `deploy-end-user-ui-smoke.spec.ts`
  - Runs a real browser + real API smoke flow for demo readiness:
    1. Provision a fresh USER account via admin API
    2. Upload avatar and verify returned URL stays on app domain (no MinIO direct URL)
    3. Create/fetch subscription request with bill image
    4. Login from UI and open "Xem bill đã tải lên"
    5. Assert bill is previewed in modal (blob URL), not external MinIO navigation
    6. Assert no mixed-content/minio browser warnings and no gamification 502 response
    7. Verify notification center endpoints return healthy responses

## Run

```bash
npm run test:e2e:system
```

Run specifically against deploy/ngrok domain:

```bash
$env:E2E_WEB_BASE_URL='https://your-domain.ngrok-free.dev'; \
$env:E2E_AUTH_BASE_URL='https://your-domain.ngrok-free.dev/api/v1/auth'; \
$env:E2E_EXAM_BASE_URL='https://your-domain.ngrok-free.dev/api/v1/exam'; \
$env:E2E_STUDY_BASE_URL='https://your-domain.ngrok-free.dev/api/v1/study'; \
$env:E2E_COMMUNITY_BASE_URL='https://your-domain.ngrok-free.dev/api/v1/community'; \
npm run test:e2e:system -- tests/system/deploy-end-user-ui-smoke.spec.ts
```

## Required services

Before running this suite, ensure the following services are reachable:

- auth_service (`http://localhost:8080/api/v1/auth`)
- exam_service (`http://localhost:8082/api/v1/exam`)
- study_service (`http://localhost:8085/api/v1/study`)
- community_service (`http://localhost:8084/api/v1/community`)

## Environment variables

- `E2E_JWT_SECRET_BASE64` (recommended)
- `JWT_SECRET` (fallback)
- `E2E_JWT_ISSUER` (default: `auth_service`)
- `E2E_AUTH_BASE_URL`
- `E2E_EXAM_BASE_URL`
- `E2E_STUDY_BASE_URL`
- `E2E_COMMUNITY_BASE_URL`

If no JWT secret is provided, the suite uses local dev default secret for convenience.
