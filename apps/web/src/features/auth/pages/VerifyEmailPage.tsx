import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const VerifyEmailPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [email] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || 'your email address';
  });
  const [countdown, setCountdown] = useState(60);
  const canResend = countdown === 0;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(60);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError('Please enter the verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate email verification completion
      window.location.href = '/pending-approval';
    } catch {
      setError('Verification failed. The code may be incorrect or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We sent a 6-digit confirmation code to ${email}.`}
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="code" style={labelStyle}>
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
            style={{ ...inputStyle, textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em' }}
          />
        </div>

        <button type="submit" disabled={isLoading} style={submitButtonStyle}>
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div style={resendContainerStyle}>
          {canResend ? (
            <button type="button" onClick={handleResend} style={resendButtonStyle}>
              Resend Code
            </button>
          ) : (
            <span style={countdownTextStyle}>
              Resend code in {countdown}s
            </span>
          )}
        </div>

        <div style={footerLinkContainerStyle}>
          <a href="/sign-up" style={changeEmailLinkStyle}>
            Change email address
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

const resendContainerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const resendButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-link)',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 500,
};

const countdownTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
};

const footerLinkContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.5rem',
};

const changeEmailLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  textDecoration: 'none',
};
