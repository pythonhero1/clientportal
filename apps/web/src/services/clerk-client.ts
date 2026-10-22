/**
 * Authoritative Clerk Client Loader & Singleton for Vite / React
 */

let clerkPromise: Promise<any> | null = null;

export const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_YW11c2VkLWNyYXdkYWQtMTg0NS5jbGVyay5hY2NvdW50cy5kZXYk';

export async function loadClerk(): Promise<any> {
  if (typeof window === 'undefined') return null;

  const win = window as any;

  // If already loaded and ready
  if (win.Clerk && win.Clerk.loaded) {
    return win.Clerk;
  }

  if (clerkPromise) return clerkPromise;

  clerkPromise = new Promise((resolve, reject) => {
    const pubKey = CLERK_PUBLISHABLE_KEY;
    if (!pubKey) {
      return reject(new Error('VITE_CLERK_PUBLISHABLE_KEY is missing.'));
    }

    const initInstance = async () => {
      try {
        const clerk = win.Clerk;
        if (!clerk) {
          throw new Error('Clerk SDK script loaded but window.Clerk is undefined.');
        }
        if (!clerk.loaded) {
          await clerk.load();
        }
        resolve(clerk);
      } catch (err) {
        clerkPromise = null;
        reject(err);
      }
    };

    let script = document.querySelector('script[data-clerk-publishable-key]') as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.setAttribute('data-clerk-publishable-key', pubKey);
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
      script.onload = () => initInstance();
      script.onerror = () => {
        clerkPromise = null;
        reject(new Error('Failed to load Clerk JavaScript SDK from CDN.'));
      };
      document.head.appendChild(script);
    } else if (win.Clerk) {
      initInstance();
    } else {
      script.addEventListener('load', () => initInstance());
      script.addEventListener('error', () => {
        clerkPromise = null;
        reject(new Error('Failed to load Clerk script.'));
      });
    }
  });

  return clerkPromise;
}
