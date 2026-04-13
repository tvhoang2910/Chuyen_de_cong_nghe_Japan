const DEFAULT_AUTH_API_BASE_URL = "http://localhost:8080/api/v1/auth";

export const authApiBaseUrl =
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AUTH_BASE_URL ||
  DEFAULT_AUTH_API_BASE_URL;

export const buildGoogleOAuthAuthorizationUrl = (): string => {
  const baseAuthorizationUrl = `${authApiBaseUrl}/oauth2/authorization/google`;
  const currentOrigin = globalThis.location?.origin;

  if (!currentOrigin) {
    return baseAuthorizationUrl;
  }

  const redirectUri = `${currentOrigin}/oauth2/success`;
  return `${baseAuthorizationUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
};
