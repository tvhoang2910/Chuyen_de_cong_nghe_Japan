/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_EXAM_API_BASE_URL: string;
  readonly VITE_COMMUNITY_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
