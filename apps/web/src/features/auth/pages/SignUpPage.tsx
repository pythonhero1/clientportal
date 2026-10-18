import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationToken] = useState(() => {
    return new URLSearchParams(window.location.search).get('token') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!fullName || !email || !password) {
        setError('Please fill in all required fields.');
        setIsLoading(false);
        return;
      }

      // If invitation token exists, accept invitation after signup
      if (invitationToken) {
        const acceptRes = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: invitationToken }),
        });

        if (acceptRes.ok) {
          window.location.href = '/overview';
          return;
        }
      }

      // Uninvited public signup routes to pending approval
      window.location.href = '/pending-approval';
    } catch {
      setError('Unable to register. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join the Oderinde Stephen Client Portal to collaborate on your projects."
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="fullName" style={labelStyle}>
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            style={inputStyle}
          />
        </div>

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
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
            style={inputStyle}
          />
        </div>

        {invitationToken && (
          <div style={fieldGroupStyle}>
            <label htmlFor="invitationToken" style={labelStyle}>
              Invitation Code
            </label>
            <input
              id="invitationToken"
              type="text"
              value={invitationToken}
              readOnly
              style={{ ...inputStyle, opacity: 0.8 }}
            />
          </div>
        )}

        <button type="submit" disabled={isLoading} style={submitButtonStyle}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div style={footerLinkContainerStyle}>
          <span style={footerTextStyle}>Already have an account? </span>
          <a href="/sign-in" style={signInLinkStyle}>
            Sign in
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

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
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

const signInLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--primary-link)',
};
