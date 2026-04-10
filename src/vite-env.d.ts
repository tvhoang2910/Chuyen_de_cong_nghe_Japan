/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_EXAM_API_BASE_URL?: string;
  readonly VITE_COMMUNITY_API_BASE_URL?: string;
  readonly VITE_STUDY_API_BASE_URL?: string;
  readonly VITE_ANALYTICS_API_BASE_URL?: string;
  readonly VITE_EXAM_SERVICE_URL?: string;
  readonly VITE_GET_CACHE_TTL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
