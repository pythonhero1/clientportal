import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { loadClerk } from './services/clerk-client';

// Pre-initialize Clerk SDK
if (typeof window !== 'undefined') {
  loadClerk().catch((err) => console.warn('[Clerk] Pre-init note:', err.message));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
