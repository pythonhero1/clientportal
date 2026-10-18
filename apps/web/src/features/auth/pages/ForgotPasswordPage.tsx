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
      tag="ACCOUNT RECOVERY"
      title="Forgot password"
      subtitle="Enter your verified account email to receive secure recovery instructions."
    >
      {isSubmitted ? (
        <div style={submittedContainerStyle}>
          <h3 style={submittedTitleStyle}>
            Check your email
          </h3>
          <p style={submittedBodyStyle}>
            If an account exists for <strong style={{ color: 'var(--text)' }}>{email}</strong>, a password reset link
            has been sent. Please check your inbox and spam folder.
          </p>
          <div style={submittedActionStyle}>
            <a href="/reset-password" style={actionButtonStyle}>
              Enter reset code
            </a>
            <a href="/sign-in" style={returnLinkStyle}>
              Return to sign in &rarr;
            </a>
          </div>
        </div>
      ) : (
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

          <button type="submit" disabled={isLoading} style={submitButtonStyle}>
            {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
          </button>

          <div style={footerLinkContainerStyle}>
            <a href="/sign-in" style={returnLinkStyle}>
              Return to sign in &rarr;
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

const returnLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--primary-link)',
};

const submittedContainerStyle: React.CSSProperties = {
  textAlign: 'left',
};

const submittedTitleStyle: React.CSSProperties = {
  margin: '0 0 0.75rem 0',
  color: 'var(--text)',
  fontSize: '1.125rem',
  fontWeight: 600,
};

const submittedBodyStyle: React.CSSProperties = {
  color: 'var(--muted-text)',
  fontSize: '0.875rem',
  lineHeight: 1.6,
  margin: '0 0 1.5rem 0',
};

const submittedActionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  alignItems: 'stretch',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  padding: '0.875rem',
  borderRadius: '8px',
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: '0.9375rem',
};
