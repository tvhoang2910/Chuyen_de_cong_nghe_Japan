const DEFAULT_AUTH_API_BASE_URL = "http://localhost:8080/api/v1/auth";

export const authApiBaseUrl =
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AUTH_BASE_URL ||
  DEFAULT_AUTH_API_BASE_URL;
