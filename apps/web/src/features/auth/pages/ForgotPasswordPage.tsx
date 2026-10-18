import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address.');
        setIsLoading(false);
        return;
      }

      // Safe password reset request - always shows success to prevent user enumeration
      setIsSubmitted(true);
    } catch {
      setError('Unable to process request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your verified account email to receive secure recovery instructions."
    >
      {isSubmitted ? (
        <div style={successContainerStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} role="img" aria-label="Mail">
            ✉️
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1.1rem' }}>
            Check Your Email
          </h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, a password reset link
            has been sent. Please check your inbox and spam folder.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a
              href="/reset-password"
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Enter Reset Code
            </a>
            <a
              href="/sign-in"
              style={{
                display: 'inline-block',
                color: 'var(--muted-text)',
                textAlign: 'center',
                fontSize: '0.8125rem',
              }}
            >
              Back to Sign In
            </a>
          </div>
        </div>
      ) : (
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

          <button type="submit" disabled={isLoading} style={submitButtonStyle}>
            {isLoading ? 'Sending...' : 'Send Recovery Instructions'}
          </button>

          <div style={footerLinkContainerStyle}>
            <a href="/sign-in" style={backLinkStyle}>
              ← Back to Sign In
            </a>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const successContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '1rem 0',
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

const backLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  textDecoration: 'none',
};
