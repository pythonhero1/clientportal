import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Initialize Clerk if publishable key is present
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (clerkPubKey && typeof window !== 'undefined') {
  const existingScript = document.querySelector('script[data-clerk-publishable-key]');
  if (!existingScript) {
    const script = document.createElement('script');
    script.setAttribute('data-clerk-publishable-key', clerkPubKey);
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
    script.onload = () => {
      if ((window as any).Clerk) {
        (window as any).Clerk.load().catch((err: any) => console.warn('Clerk load:', err));
      }
    };
    document.head.appendChild(script);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
