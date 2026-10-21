import { useState, useEffect, useCallback } from 'react';
import {
  fetchPushPublicKey,
  subscribePush,
  unsubscribePush,
} from '../../../services/notifications-api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  const checkSubscription = useCallback(async () => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    try {
      setPermission(Notification.permission);
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (err: any) {
      console.warn('Could not check push subscription:', err);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Request browser permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Push permission was not granted.');
        return false;
      }

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // 3. Fetch server VAPID public key
      const publicKey = await fetchPushPublicKey();
      if (!publicKey) {
        throw new Error('VAPID public key is not available on the server.');
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // 4. Negotiate push subscription with browser push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Incomplete subscription payload returned by push service.');
      }

      // 5. Send subscription to portal backend
      await subscribePush({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to enable push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    try {
      setIsLoading(true);
      setError(null);

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribePush(subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}
