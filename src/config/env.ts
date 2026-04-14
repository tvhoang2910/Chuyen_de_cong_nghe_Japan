// Centralized API base URL configuration.
// ALL API clients MUST import from here — no duplicate base URL definitions.
// Both dev and deploy use RELATIVE paths (/api/v1/*).
// Dev: Vite dev server proxies to localhost:8080/8082/etc.
// Deploy: Nginx proxies to Docker service names.
// Browser only ever sees the same-origin frontend URL.

const DEFAULT_AUTH_API = "/api/v1/auth";
const DEFAULT_EXAM_API = "/api/v1/exam";
const DEFAULT_STUDY_API = "/api/v1/study";
const DEFAULT_COMMUNITY_API = "/api/v1/community";
const DEFAULT_ANALYTICS_API = "/api/v1/analytics";

// authApiBaseUrl is used by axiosClient.ts (auth service)
export const authApiBaseUrl =
 import.meta.env.VITE_AUTH_API_BASE_URL || DEFAULT_AUTH_API;

// examApiBaseUrl is used by examClient.ts and reportClient.ts (exam service)
export const examApiBaseUrl =
 import.meta.env.VITE_EXAM_API_BASE_URL || DEFAULT_EXAM_API;

// studyApiBaseUrl is used by studyClient.ts (study service)
export const studyApiBaseUrl =
 import.meta.env.VITE_STUDY_API_BASE_URL || DEFAULT_STUDY_API;

// communityApiBaseUrl is used by commentClient.ts (community service)
export const communityApiBaseUrl =
 import.meta.env.VITE_COMMUNITY_API_BASE_URL || DEFAULT_COMMUNITY_API;

// analyticsApiBaseUrl is used by questionAnalytics.ts
// Note: Nginx rewrites /api/v1/analytics/ to /api/v1/exam/analytics/
// In dev, Vite proxy handles the same rewrite.
export const analyticsApiBaseUrl =
 import.meta.env.VITE_ANALYTICS_API_BASE_URL || DEFAULT_ANALYTICS_API;

export const buildGoogleOAuthAuthorizationUrl = (): string => {
 const baseAuthorizationUrl = `${authApiBaseUrl}/oauth2/authorization/google`;
 const currentOrigin = globalThis.location?.origin;
 if (!currentOrigin) return baseAuthorizationUrl;
 const redirectUri = `${currentOrigin}/oauth2/success`;
 return `${baseAuthorizationUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
};
