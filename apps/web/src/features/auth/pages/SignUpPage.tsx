import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { API_BASE_URL } from '../../../services/api-client';

declare global {
  interface Window {
    Clerk?: any;
  }
}

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

      if (typeof window !== 'undefined' && window.Clerk && window.Clerk.client) {
        try {
          const names = fullName.trim().split(' ');
          const firstName = names[0];
          const lastName = names.slice(1).join(' ') || undefined;

          await window.Clerk.client.signUp.create({
            emailAddress: email,
            password: password,
            firstName,
            lastName,
          });

          await window.Clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
          return;
        } catch (clerkErr: any) {
          const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || 'Registration failed.';
          setError(msg);
          setIsLoading(false);
          return;
        }
      }

      // If invitation token exists, accept invitation after signup
      if (invitationToken) {
        const acceptRes = await fetch(`${API_BASE_URL}/api/invitations/accept`, {
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
      tag="CLIENT WORKSPACE"
      title="Create your account"
      subtitle="Join your dedicated client workspace to view active projects, files, and deliverables."
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="fullName" style={labelStyle}>
            Full name
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
            placeholder="Minimum 8 characters"
            minLength={8}
            required
            style={inputStyle}
          />
        </div>

        {invitationToken && (
          <div style={fieldGroupStyle}>
            <label htmlFor="invitationToken" style={labelStyle}>
              Invitation code
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
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>

        <div style={footerLinkContainerStyle}>
          <span style={footerTextStyle}>Already have an account? </span>
          <a href="/sign-in" style={signInLinkStyle}>
            Sign in &rarr;
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

const signInLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--primary-link)',
};
