import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { API_BASE_URL, setAuthToken } from '../../../services/api-client';
import { loadClerk } from '../../../services/clerk-client';
import { determineAuthenticatedRedirect } from '../../../services/auth-routing';

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

  const handleResend = async () => {
    if (!canResend) return;
    setError(null);
    try {
      const clerk = await loadClerk();
      if (clerk?.client?.signUp) {
        await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setCountdown(60);
      } else {
        setError('Verification session not found. Please start registration from /sign-up.');
      }
    } catch (err: any) {
      console.warn('[VerifyEmailPage] Resend code error:', err);
      setError(err?.errors?.[0]?.message || 'Failed to resend verification code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const clerk = await loadClerk();
      if (!clerk?.client?.signUp) {
        setError('No active registration session found in your browser. Please register at /sign-up.');
        setIsLoading(false);
        return;
      }

      const completeSignUp = await clerk.client.signUp.attemptEmailAddressVerification({ code: code.trim() });
      let finalSignUp = completeSignUp;

      const emailVerif = finalSignUp.verifications?.emailAddress;
      const unverified = finalSignUp.unverifiedFields || [];
      if (unverified.includes('email_address') || (emailVerif && emailVerif.status !== 'verified')) {
        const verifyError =
          emailVerif?.error?.longMessage ||
          emailVerif?.error?.message ||
          'The verification code is incorrect or expired. Please check your email and try again.';
        setError(verifyError);
        setIsLoading(false);
        return;
      }

      if (finalSignUp.status === 'missing_requirements') {
        const missing = finalSignUp.missingFields || [];
        if (missing.length > 0) {
          const updatePayload: any = {};
          if (missing.includes('username')) {
            const cleanUser = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            updatePayload.username = cleanUser.length >= 4 ? cleanUser : `${cleanUser}_${Date.now().toString().slice(-4)}`;
          }
          try {
            finalSignUp = await clerk.client.signUp.update(updatePayload);
          } catch {}
        }
      }

      if (finalSignUp?.status === 'complete' && finalSignUp.createdSessionId) {
        await clerk.setActive({ session: finalSignUp.createdSessionId });
        const token = await clerk.session?.getToken();
        if (token) setAuthToken(token);
        const verifiedClerkUserId = finalSignUp.createdUserId || clerk.user?.id;
        const verifiedName = clerk.user?.fullName;

        // Synchronously register in backend database
        if (email && email !== 'your email address') {
          try {
            await fetch(`${API_BASE_URL}/api/auth/register-client`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email.trim(),
                clerkUserId: verifiedClerkUserId,
                name: verifiedName,
              }),
            });
          } catch (regErr) {
            console.warn('[VerifyEmailPage] register-client notify error:', regErr);
          }
        }

        const redirectUrl = await determineAuthenticatedRedirect(token);
        window.location.href = redirectUrl;
        return;
      } else {
        const details = [
          ...(finalSignUp.missingFields ? [`Missing: ${finalSignUp.missingFields.join(', ')}`] : []),
          ...(finalSignUp.unverifiedFields ? [`Unverified: ${finalSignUp.unverifiedFields.join(', ')}`] : []),
        ].join('; ');
        setError(details || 'Verification could not be completed. Please check your code or click Resend.');
      }
    } catch (clerkErr: any) {
      const msg =
        clerkErr.errors?.[0]?.longMessage ||
        clerkErr.errors?.[0]?.message ||
        'Verification failed. The code may be incorrect or expired.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      tag="IDENTITY VERIFICATION"
      title="Verify your email"
      subtitle={`We sent a 6-digit confirmation code to ${email}.`}
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        <div style={fieldGroupStyle}>
          <label htmlFor="code" style={labelStyle}>
            Verification code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
            style={inputStyle}
          />
        </div>

        <div style={resendRowStyle}>
          <span style={resendTextStyle}>Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            style={resendButtonStyle}
          >
            {canResend ? 'Resend code' : `Resend in ${countdown}s`}
          </button>
        </div>

        <button type="submit" disabled={isLoading} style={submitButtonStyle}>
          {isLoading ? 'Verifying...' : 'Verify code'}
        </button>

        <div style={footerLinkContainerStyle}>
          <a href="/sign-in" style={returnLinkStyle}>
            Back to sign in &rarr;
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
  fontSize: '0.9375rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  textAlign: 'left',
  letterSpacing: '0.15em',
};

const resendRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '-0.25rem',
};

const resendTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
};

const resendButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-link)',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 500,
  padding: 0,
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
