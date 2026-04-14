import { useCallback } from 'react';
import { fetchVapidPublicKey, subscribePush, unsubscribePush } from '@/api/pushNotification';

const isSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export type BrowserPushState = {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
};

export type SubscribePushOptions = {
  requestPermissionIfNeeded?: boolean;
  forceRefreshExisting?: boolean;
};

export function usePushNotification() {
  const getBrowserPushState = useCallback(async (): Promise<BrowserPushState> => {
    if (!isSupported()) {
      return {
        supported: false,
        permission: 'unsupported',
        subscribed: false,
      };
    }

    try {
      const permission = Notification.permission;
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return {
          supported: true,
          permission,
          subscribed: false,
        };
      }

      const subscription = await registration.pushManager.getSubscription();
      return {
        supported: true,
        permission,
        subscribed: Boolean(subscription),
      };
    } catch {
      return {
        supported: true,
        permission: 'default',
        subscribed: false,
      };
    }
  }, []);

  const resolveServiceWorkerRegistration = useCallback(async () => {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return existing;
    }

    return navigator.serviceWorker.register('/sw.js');
  }, []);

  /**
   * Registers the service worker and subscribes the browser to push notifications.
   * Call this once after login when the user is authenticated.
   * Safe to call multiple times — checks existing subscription before re-subscribing.
   */
  const subscribe = useCallback(async (options: SubscribePushOptions = {}): Promise<boolean> => {
    if (!isSupported()) return false;

    let permission: NotificationPermission = 'default';
    try {
      permission = Notification.permission;
    } catch {
      return false;
    }

    if (permission !== 'granted') {
      if (!options.requestPermissionIfNeeded) {
        return false;
      }

      try {
        permission = await Notification.requestPermission();
      } catch {
        return false;
      }

      if (permission !== 'granted') {
        return false;
      }
    }

    try {
      const registration = await resolveServiceWorkerRegistration();
      const publicKey = await fetchVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Re-sync any existing browser subscription to backend on each login.
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const existingApplicationServerKey = existing.options?.applicationServerKey;
        const hasMatchingKey = isSameApplicationServerKey(existingApplicationServerKey, applicationServerKey);

        if (hasMatchingKey && !options.forceRefreshExisting) {
          await subscribePush(existing.toJSON());
          return true;
        }

        // Refresh existing browser subscription so the backend receives a fresh endpoint.
        try {
          await unsubscribePush(existing.endpoint);
        } catch {
          // Best-effort cleanup only.
        }

        try {
          await existing.unsubscribe();
        } catch {
          // Continue creating a fresh subscription even if local cleanup fails.
        }
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      await subscribePush(subscription.toJSON());
      return true;
    } catch (err) {
      console.error('[usePushNotification] subscribe failed:', err);
      return false;
    }
  }, [resolveServiceWorkerRegistration]);

  /**
   * Unsubscribes the browser from push notifications.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return true;
      }

      const sub = await registration.pushManager.getSubscription();
      if (!sub) return true; // already unsubscribed

      await unsubscribePush(sub.endpoint);
      await sub.unsubscribe();
      return true;
    } catch (err) {
      console.error('[usePushNotification] unsubscribe failed:', err);
      return false;
    }
  }, []);

  return { subscribe, unsubscribe, isSupported, getBrowserPushState };
}

function isSameApplicationServerKey(
  existingKey: ArrayBuffer | null | undefined,
  expectedKey: Uint8Array,
): boolean {
  if (!existingKey) {
    return false;
  }

  const actual = new Uint8Array(existingKey);
  if (actual.length !== expectedKey.length) {
    return false;
  }

  for (let index = 0; index < actual.length; index += 1) {
    if (actual[index] !== expectedKey[index]) {
      return false;
    }
  }

  return true;
}

/** Converts a VAPID public key (base64url) to Uint8Array for PushManager */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + padding);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer;
}