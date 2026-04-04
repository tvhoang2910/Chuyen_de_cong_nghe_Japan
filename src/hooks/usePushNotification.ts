import { useCallback } from 'react';
import { fetchVapidPublicKey, subscribePush, unsubscribePush } from '@/api/pushNotification';

const isSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export function usePushNotification() {
  /**
   * Registers the service worker and subscribes the browser to push notifications.
   * Call this once after login when the user is authenticated.
   * Safe to call multiple times — checks existing subscription before re-subscribing.
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;

    let permission: NotificationPermission = 'default';
    try {
      permission = Notification.permission;
    } catch {
      return false;
    }

    if (permission !== 'granted') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Re-sync any existing browser subscription to backend on each login.
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await subscribePush(existing.toJSON());
        return true;
      }

      const publicKey = await fetchVapidPublicKey();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await subscribePush(subscription.toJSON());
      return true;
    } catch (err) {
      console.error('[usePushNotification] subscribe failed:', err);
      return false;
    }
  }, []);

  /**
   * Unsubscribes the browser from push notifications.
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
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

  return { subscribe, unsubscribe, isSupported };
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