import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

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
      // Direct sign-in verification
      if (!email || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      // Check account status against portal backend
      const res = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 403) {
        const data = await res.json();
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

      // Default redirect for local simulation
      window.location.href = '/overview';
    } catch {
      setError('Unable to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your client portal to access your projects and deliverables."
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email Address
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
          <div style={passwordHeaderStyle}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <a href="/forgot-password" style={forgotLinkStyle}>
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={inputStyle}
          />
        </div>

        <div style={checkboxContainerStyle}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={checkboxStyle}
          />
          <label htmlFor="rememberMe" style={checkboxLabelStyle}>
            Remember this device for 30 days
          </label>
        </div>

        <button type="submit" disabled={isLoading} style={submitButtonStyle}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <div style={footerLinkContainerStyle}>
          <span style={footerTextStyle}>Don't have an account? </span>
          <a href="/sign-up" style={signUpLinkStyle}>
            Sign up
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
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid var(--danger-text)',
  color: 'var(--danger-text)',
  padding: '0.75rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text)',
};

const passwordHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const forgotLinkStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--primary-link)',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '0.75rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const checkboxStyle: React.CSSProperties = {
  accentColor: 'var(--primary)',
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  cursor: 'pointer',
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  marginTop: '0.5rem',
};

const footerLinkContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.5rem',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
};

const signUpLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--primary-link)',
};
