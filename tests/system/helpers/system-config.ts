import { signHs256Jwt, type JwtIdentity } from './jwt';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_DEV_JWT_SECRET_BASE64 =
  'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZg==';

type ServiceTargets = {
  authBaseUrl: string;
  examBaseUrl: string;
  studyBaseUrl: string;
  communityBaseUrl: string;
};

export type SystemTestContext = ServiceTargets & {
  issuer: string;
  userIdentity: JwtIdentity;
  adminIdentity: JwtIdentity;
  userToken: string;
  adminToken: string;
  adminLoginEmail: string;
  adminLoginPassword: string;
};

let cachedDotEnvValues: Record<string, string> | null = null;

const parseDotEnv = (filePath: string): Record<string, string> => {
  const output: Record<string, string> = {};
  const contents = readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const delimiterIndex = line.indexOf('=');
    if (delimiterIndex <= 0) {
      continue;
    }

    const key = line.slice(0, delimiterIndex).trim();
    let value = line.slice(delimiterIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
};

const loadDotEnvFallback = (): Record<string, string> => {
  if (cachedDotEnvValues) {
    return cachedDotEnvValues;
  }

  const candidatePaths = [
    process.env.E2E_ENV_FILE,
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) {
      continue;
    }
    cachedDotEnvValues = parseDotEnv(candidatePath);
    return cachedDotEnvValues;
  }

  cachedDotEnvValues = {};
  return cachedDotEnvValues;
};

const getConfigValue = (...keys: string[]): string | undefined => {
  const dotEnvValues = loadDotEnvFallback();

  for (const key of keys) {
    const processValue = process.env[key];
    if (processValue && processValue.trim()) {
      return processValue;
    }

    const dotEnvValue = dotEnvValues[key];
    if (dotEnvValue && dotEnvValue.trim()) {
      return dotEnvValue;
    }
  }

  return undefined;
};

const getNumber = (raw: string | undefined, fallbackValue: number): number => {
  if (!raw) {
    return fallbackValue;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
};

const getRequiredJwtSecret = (): string => {
  const secret = getConfigValue('E2E_JWT_SECRET_BASE64', 'JWT_SECRET');
  return secret && secret.trim() ? secret : DEFAULT_DEV_JWT_SECRET_BASE64;
};

const normalizeBaseUrl = (raw: string, fallbackValue: string): string => {
  const value = (raw || fallbackValue).trim();
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const buildSystemTestContext = (): SystemTestContext => {
  const secretBase64 = getRequiredJwtSecret();
  const issuer = getConfigValue('E2E_JWT_ISSUER', 'JWT_ISSUER') ?? 'auth_service';

  const authBaseUrl = normalizeBaseUrl(
    getConfigValue('E2E_AUTH_BASE_URL', 'VITE_AUTH_API_BASE_URL') ?? '',
    'http://localhost:8080/api/v1/auth',
  );
  const examBaseUrl = normalizeBaseUrl(
    getConfigValue('E2E_EXAM_BASE_URL', 'VITE_EXAM_API_BASE_URL') ?? '',
    'http://localhost:8082/api/v1/exam',
  );
  const studyBaseUrl = normalizeBaseUrl(
    getConfigValue('E2E_STUDY_BASE_URL', 'VITE_STUDY_API_BASE_URL') ?? '',
    'http://localhost:8085/api/v1/study',
  );
  const communityBaseUrl = normalizeBaseUrl(
    getConfigValue('E2E_COMMUNITY_BASE_URL', 'VITE_COMMUNITY_API_BASE_URL') ?? '',
    'http://localhost:8084/api/v1/community',
  );

  const userIdentity: JwtIdentity = {
    userId: getNumber(getConfigValue('E2E_USER_ID'), 3),
    email: getConfigValue('E2E_USER_EMAIL') ?? 'e2e-user@exam-bank.local',
    role: 'USER',
  };

  const adminIdentity: JwtIdentity = {
    userId: getNumber(getConfigValue('E2E_ADMIN_USER_ID'), 1),
    email: getConfigValue('E2E_ADMIN_EMAIL') ?? 'admin@exam-bank.local',
    role: 'ADMIN',
  };

  const adminLoginEmail =
    getConfigValue('E2E_ADMIN_LOGIN_EMAIL', 'AUTH_BOOTSTRAP_ADMIN_EMAIL') ?? 'admin@exam-bank.local';
  const adminLoginPassword =
    getConfigValue('E2E_ADMIN_LOGIN_PASSWORD', 'AUTH_BOOTSTRAP_ADMIN_PASSWORD') ?? 'Admin@123456';

  const userToken = signHs256Jwt(userIdentity, secretBase64, issuer);
  const adminToken = signHs256Jwt(adminIdentity, secretBase64, issuer);

  return {
    authBaseUrl,
    examBaseUrl,
    studyBaseUrl,
    communityBaseUrl,
    issuer,
    userIdentity,
    adminIdentity,
    userToken,
    adminToken,
    adminLoginEmail,
    adminLoginPassword,
  };
};
