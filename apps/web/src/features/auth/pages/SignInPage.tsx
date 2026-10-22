import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { setAuthToken, API_BASE_URL } from '../../../services/api-client';

declare global {
  interface Window {
    Clerk?: any;
  }
}

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      // 1. Authenticate with Clerk if available
      if (typeof window !== 'undefined' && window.Clerk && window.Clerk.client) {
        try {
          const signInAttempt = await window.Clerk.client.signIn.create({
            identifier: email,
            password: password,
          });

          if (signInAttempt.status === 'complete') {
            await window.Clerk.setActive({ session: signInAttempt.createdSessionId });
            const token = await window.Clerk.session?.getToken();
            setAuthToken(token);

            // Verify account status with backend
            try {
              const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (res.status === 403) {
                const data = await res.json().catch(() => ({}));
                if (data.code === 'ACCOUNT_PENDING_APPROVAL') {
                  window.location.href = '/pending-approval';
                  return;
                }
                window.location.href = '/access-denied';
                return;
              }
            } catch {
              // Proceed if status check is non-blocking
            }

            window.location.href = '/overview';
            return;
          } else {
            setError('Additional verification is required (MFA). Please check your authentication app or email.');
            setIsLoading(false);
            return;
          }
        } catch (clerkErr: any) {
          const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Invalid email or password.';
          setError(msg);
          setIsLoading(false);
          return;
        }
      }

      // 2. If Clerk is not yet loaded, verify against backend
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        setError('Invalid credentials. Please enter your authorized email and password.');
        setIsLoading(false);
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.code === 'ACCOUNT_PENDING_APPROVAL') {
          window.location.href = '/pending-approval';
          return;
        }
        window.location.href = '/access-denied';
        return;
      }

      if (res.ok) {
        window.location.href = '/overview';
        return;
      }

      setError('Invalid email or password. Please verify your credentials.');
    } catch {
      setError('Unable to authenticate. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      tag="CLIENT WORKSPACE"
      title="Welcome back"
      subtitle="Sign in to view active projects, files, invoices and updates."
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            style={inputStyle}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            style={inputStyle}
          />
        </div>

        <div style={rememberForgotRowStyle}>
          <label style={checkboxContainerStyle}>
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={checkboxStyle}
            />
            <span style={checkboxLabelStyle}>Remember me</span>
          </label>
          <a href="/forgot-password" style={forgotLinkStyle}>
            Forgot password?
          </a>
        </div>

        <button type="submit" disabled={isLoading} style={submitButtonStyle}>
          {isLoading ? 'Signing in...' : 'Sign in to portal'}
        </button>

        <div style={footerLinkContainerStyle}>
          <span style={footerTextStyle}>New client? </span>
          <a href="/sign-up" style={signUpLinkStyle}>
            Create your account &rarr;
          </a>
        </div>
      </form>
    </AuthLayout>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  textAlign: 'left',
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: 'var(--danger-text)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontSize: '0.8125rem',
  textAlign: 'left',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--muted-text)',
  textAlign: 'left',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text)',
  padding: '0.85rem 1rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  textAlign: 'left',
  transition: 'border-color 0.15s ease',
};

const rememberForgotRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '-0.25rem',
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  accentColor: 'var(--primary)',
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  cursor: 'pointer',
  userSelect: 'none',
};

const forgotLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--primary-link)',
  textDecoration: 'none',
  fontWeight: 500,
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '0.875rem',
  fontWeight: 600,
  fontSize: '0.9375rem',
  cursor: 'pointer',
  width: '100%',
  marginTop: '0.5rem',
  transition: 'background-color 0.15s ease',
};

const footerLinkContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.75rem',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
};

const signUpLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--primary-link)',
};
