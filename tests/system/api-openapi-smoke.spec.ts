import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAllOpenApiOperations, type OpenApiOperation } from './helpers/openapi-ops';
import { buildSystemTestContext } from './helpers/system-config';
import { assertServiceReachable } from './helpers/service-health';

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const SYSTEM_TEST_DIR = path.dirname(CURRENT_FILE_PATH);
const EXAM_WEB_DIR = path.resolve(SYSTEM_TEST_DIR, '..', '..');
const WORKSPACE_ROOT = path.resolve(EXAM_WEB_DIR, '..');

const systemContext = buildSystemTestContext();
const operations = loadAllOpenApiOperations(WORKSPACE_ROOT);

type RequestBody = Record<string, unknown> | undefined;

type PathContext = {
  userId: number;
  adminId: number;
};

const OPERATION_TIMEOUT_MS = Number(process.env.E2E_OPERATION_TIMEOUT_MS ?? 12_000);

const replacePathParams = (rawPath: string, context: PathContext): string => {
  return rawPath.replace(/\{([^}]+)\}/g, (_matched, token: string) => {
    const normalized = token.toLowerCase();
    if (normalized === 'userid') {
      return String(context.userId);
    }
    if (normalized === 'id') {
      return '1';
    }
    if (normalized === 'role') {
      return 'USER';
    }
    if (normalized === 'code') {
      return 'STREAK_DAYS_5';
    }
    if (normalized.includes('attempt')) {
      return '1';
    }
    if (normalized.includes('exam')) {
      return '1';
    }
    if (normalized.includes('question')) {
      return '1';
    }
    if (normalized.includes('subscription')) {
      return '1';
    }
    return String(context.adminId);
  });
};

const resolveBaseUrlAndSuffix = (apiPath: string): { baseUrl: string; suffixPath: string } => {
  if (apiPath.startsWith('/api/v1/auth')) {
    return {
      baseUrl: systemContext.authBaseUrl,
      suffixPath: apiPath.replace('/api/v1/auth', '') || '/',
    };
  }
  if (apiPath.startsWith('/api/v1/exam')) {
    return {
      baseUrl: systemContext.examBaseUrl,
      suffixPath: apiPath.replace('/api/v1/exam', '') || '/',
    };
  }
  if (apiPath.startsWith('/api/v1/study')) {
    return {
      baseUrl: systemContext.studyBaseUrl,
      suffixPath: apiPath.replace('/api/v1/study', '') || '/',
    };
  }
  if (apiPath.startsWith('/api/v1/community')) {
    return {
      baseUrl: systemContext.communityBaseUrl,
      suffixPath: apiPath.replace('/api/v1/community', '') || '/',
    };
  }

  throw new Error(`Unsupported OpenAPI path prefix: ${apiPath}`);
};

const buildRequestBody = (operation: OpenApiOperation): RequestBody => {
  const method = operation.method;
  const pathValue = operation.path;
  if (method === 'get' || method === 'delete') {
    return undefined;
  }

  if (pathValue.endsWith('/login')) {
    return {
      email: 'invalid-email',
      password: '',
    };
  }

  if (pathValue.endsWith('/register')) {
    return {
      email: 'invalid-email',
      password: 'short',
      fullName: '',
    };
  }

  if (pathValue.endsWith('/refresh')) {
    return { refreshToken: 'invalid-refresh-token' };
  }

  if (pathValue.endsWith('/oauth2/exchange')) {
    return { code: 'invalid-exchange-code' };
  }

  if (pathValue.endsWith('/forgot-password') || pathValue.endsWith('/forgot-password/resend')) {
    return { email: 'invalid-email' };
  }

  if (pathValue.endsWith('/forgot-password/verify-otp')) {
    return { email: 'invalid-email', otp: '000000' };
  }

  if (pathValue.endsWith('/register/verify-email')) {
    return { email: 'invalid-email', otp: '000000' };
  }

  if (pathValue.endsWith('/reset-password')) {
    return { resetToken: 'invalid-token', newPassword: 'Password@123' };
  }

  if (pathValue.endsWith('/attempts')) {
    return { examId: -1 };
  }

  if (pathValue.includes('/answers/batch')) {
    return {
      answers: [
        {
          questionId: -1,
          selectedOptionIds: [],
          responseTimeMs: 0,
          answerChangeCount: 0,
        },
      ],
    };
  }

  if (pathValue.includes('/answers')) {
    return {
      questionId: -1,
      selectedOptionIds: [],
      responseTimeMs: 0,
      answerChangeCount: 0,
    };
  }

  if (pathValue === '/api/v1/community/comments') {
    return {
      userId: systemContext.userIdentity.userId,
      targetId: -1,
      content: '',
    };
  }

  if (pathValue.includes('/comments/') && pathValue.endsWith('/vote')) {
    return { voteType: 'UP' };
  }

  if (pathValue.includes('/comments/') && pathValue.endsWith('/pin')) {
    return { pinned: true };
  }

  return {};
};

const shouldAttachAuthHeader = (operation: OpenApiOperation): boolean => {
  const authFreePrefixes = [
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/oauth2/exchange',
  ];

  return !authFreePrefixes.some((prefix) => operation.path.startsWith(prefix));
};

const resolveToken = (operation: OpenApiOperation): string => {
  if (operation.path.includes('/admin/')) {
    return systemContext.adminToken;
  }
  return systemContext.userToken;
};

test.describe('System OpenAPI smoke - no 5xx policy', () => {
  test.beforeAll(async ({ request }) => {
    await assertServiceReachable(request, 'auth_service', systemContext.authBaseUrl);
    await assertServiceReachable(request, 'exam_service', systemContext.examBaseUrl);
    await assertServiceReachable(request, 'study_service', systemContext.studyBaseUrl);
    await assertServiceReachable(request, 'community_service', systemContext.communityBaseUrl);
  });

  test(`loads operations from generated OpenAPI files`, async () => {
    expect(operations.length).toBeGreaterThan(0);
  });

  for (const operation of operations) {
    test(`[${operation.source}] ${operation.method.toUpperCase()} ${operation.path}`, async ({ request }) => {
      const resolvedPath = replacePathParams(operation.path, {
        userId: systemContext.userIdentity.userId,
        adminId: systemContext.adminIdentity.userId,
      });
      const { baseUrl, suffixPath } = resolveBaseUrlAndSuffix(resolvedPath);

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (shouldAttachAuthHeader(operation)) {
        headers.Authorization = `Bearer ${resolveToken(operation)}`;
      }

      const requestBody = buildRequestBody(operation);
      const requestOptions = {
        headers,
        data: requestBody,
        timeout: OPERATION_TIMEOUT_MS,
        failOnStatusCode: false,
      };

      const response =
        operation.method === 'get'
          ? await request.get(`${baseUrl}${suffixPath}`, requestOptions)
          : operation.method === 'post'
            ? await request.post(`${baseUrl}${suffixPath}`, requestOptions)
            : operation.method === 'put'
              ? await request.put(`${baseUrl}${suffixPath}`, requestOptions)
              : operation.method === 'patch'
                ? await request.patch(`${baseUrl}${suffixPath}`, requestOptions)
                : await request.delete(`${baseUrl}${suffixPath}`, requestOptions);

      expect(
        response.status(),
        `Unexpected 5xx for ${operation.method.toUpperCase()} ${resolvedPath} from ${operation.source}`,
      ).toBeLessThan(500);
    });
  }
});
