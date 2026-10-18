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
