import type { APIRequestContext } from '@playwright/test';

const HEALTH_TIMEOUT_MS = Number(process.env.E2E_HEALTH_TIMEOUT_MS ?? 8_000);

export const assertServiceReachable = async (
  request: APIRequestContext,
  serviceName: string,
  baseUrl: string,
): Promise<void> => {
  const healthUrl = `${baseUrl}/actuator/health`;

  try {
    const response = await request.get(healthUrl, {
      failOnStatusCode: false,
      timeout: HEALTH_TIMEOUT_MS,
    });

    if (response.status() === 404) {
      throw new Error(`[${serviceName}] health endpoint not found at ${healthUrl}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`[${serviceName}] service is not reachable at ${healthUrl}. ${message}`);
  }
};
