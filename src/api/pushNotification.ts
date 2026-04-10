import { authApiBaseUrl } from '../config/env';

const buildAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAccessToken = (): string | null => localStorage.getItem('access_token');

interface PushSubscriptionRequestPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const toPushSubscriptionRequestPayload = (
  subscription: PushSubscriptionJSON,
): PushSubscriptionRequestPayload => {
  const endpoint = subscription.endpoint ?? '';
  const p256dh = subscription.keys?.p256dh ?? '';
  const auth = subscription.keys?.auth ?? '';

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription payload');
  }

  return { endpoint, p256dh, auth };
};

export const fetchVapidPublicKey = async (): Promise<string> => {
  const res = await fetch(`${authApiBaseUrl}/push-subscription/vapid-public-key`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const data = (await res.json()) as { publicKey: string };
  return data.publicKey;
};

export const subscribePush = async (subscription: PushSubscriptionJSON): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    return;
  }
  const payload = toPushSubscriptionRequestPayload(subscription);
  const res = await fetch(`${authApiBaseUrl}/push-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return;
    }
    throw new Error('Failed to subscribe push notification');
  }
};

export const unsubscribePush = async (endpoint: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    return;
  }
  const res = await fetch(`${authApiBaseUrl}/push-subscription`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok && res.status !== 401 && res.status !== 403) {
    throw new Error('Failed to unsubscribe push notification');
  }
};
