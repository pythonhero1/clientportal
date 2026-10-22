import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { setAuthToken } from '../../../services/api-client';
import { loadClerk } from '../../../services/clerk-client';
import { determineAuthenticatedRedirect } from '../../../services/auth-routing';

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-Factor Authentication states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStrategy, setMfaStrategy] = useState('totp');
  const [mfaNotice, setMfaNotice] = useState('');

  // Check if an active authenticated Clerk session already exists
  useEffect(() => {
    let isMounted = true;
    loadClerk()
      .then(async (clerk) => {
        if (!isMounted || !clerk || !clerk.user || !clerk.session) return;
        setIsCheckingSession(true);
        const token = await clerk.session.getToken();
        if (token) {
          setAuthToken(token);
        }
        const redirectUrl = await determineAuthenticatedRedirect(token);
        if (isMounted) {
          window.location.href = redirectUrl;
        }
      })
      .catch((err) => {
        console.warn('[SignInPage] Session check error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCompleteSignIn = async (clerk: any, attempt: any) => {
    await clerk.setActive({ session: attempt.createdSessionId });
    const token = await clerk.session?.getToken();
    if (token) {
      setAuthToken(token);
    }

    const redirectUrl = await determineAuthenticatedRedirect(token);
    window.location.href = redirectUrl;
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!mfaCode.trim()) {
        setError('Please enter the 6-digit verification code.');
        setIsLoading(false);
        return;
      }

      const clerk = await loadClerk();
      const secondFactorResult = await clerk.client.signIn.attemptSecondFactor({
        strategy: mfaStrategy,
        code: mfaCode.trim(),
      });

      if (secondFactorResult.status === 'complete') {
        await handleCompleteSignIn(clerk, secondFactorResult);
        return;
      } else {
        setError('Verification code is incorrect or expired.');
      }
    } catch (err: any) {
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        'Verification code incorrect. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaRequired) {
      return handleMfaSubmit(e);
    }

    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      // Initialize Clerk SDK
      let clerk: any = null;
      try {
        clerk = await loadClerk();
      } catch (loadErr: any) {
        console.error('Failed to load Clerk:', loadErr);
        setError('Authentication service is currently loading or unreachable. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      if (!clerk || !clerk.client) {
        setError('Authentication system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      // Authenticate strictly against Clerk
      let signInAttempt: any = null;
      try {
        signInAttempt = await clerk.client.signIn.create({
          identifier: email.trim(),
          password: password,
        });
      } catch (clerkErr: any) {
        const msg =
          clerkErr.errors?.[0]?.longMessage ||
          clerkErr.errors?.[0]?.message ||
          'Invalid email address or password.';
        setError(msg);
        setIsLoading(false);
        return;
      }

      if (signInAttempt && signInAttempt.status === 'complete') {
        await handleCompleteSignIn(clerk, signInAttempt);
        return;
      } else if (signInAttempt && signInAttempt.status === 'needs_second_factor') {
        const factors = signInAttempt.supportedSecondFactors || [];
        const hasEmail = factors.some((f: any) => f.strategy === 'email_code');
        const hasTotp = factors.some((f: any) => f.strategy === 'totp');
        const hasPhone = factors.some((f: any) => f.strategy === 'phone_code');

        let chosenStrategy = 'totp';
        if (hasEmail) {
          chosenStrategy = 'email_code';
          try {
            await clerk.client.signIn.prepareSecondFactor({ strategy: 'email_code' });
            setMfaNotice('A 6-digit verification code has been sent to your email.');
          } catch (prepErr) {
            console.warn('Could not prepare email code second factor:', prepErr);
          }
        } else if (hasTotp) {
          chosenStrategy = 'totp';
          setMfaNotice('Please enter the 6-digit code from your authenticator app.');
        } else if (hasPhone) {
          chosenStrategy = 'phone_code';
          try {
            await clerk.client.signIn.prepareSecondFactor({ strategy: 'phone_code' });
            setMfaNotice('A verification code was sent to your phone.');
          } catch {}
        } else {
          setMfaNotice('Please enter your two-factor verification code.');
        }

        setMfaStrategy(chosenStrategy);
        setMfaRequired(true);
        setIsLoading(false);
        return;
      } else {
        setError('Additional verification is required to complete sign in.');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Unable to sign in. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <AuthLayout
        tag="AUTHENTICATION"
        title="Redirecting to your workspace"
        subtitle="Active session detected. Please wait a moment..."
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tag={mfaRequired ? 'SECURITY VERIFICATION' : 'CLIENT WORKSPACE'}
      title={mfaRequired ? 'Two-factor verification' : 'Welcome back'}
      subtitle={
        mfaRequired
          ? mfaNotice || 'Enter your 6-digit code to complete sign-in.'
          : 'Sign in to view active projects, files, invoices and updates.'
      }
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {mfaRequired ? (
          <>
            <div style={fieldGroupStyle}>
              <label htmlFor="mfaCode" style={labelStyle}>
                6-digit verification code
              </label>
              <input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                required
                autoFocus
                style={{ ...inputStyle, letterSpacing: '0.2em', fontSize: '1.25rem', textAlign: 'center' }}
              />
            </div>

            <button type="submit" disabled={isLoading} style={submitButtonStyle}>
              {isLoading ? 'Verifying code...' : 'Confirm & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaRequired(false);
                setError(null);
                setMfaCode('');
              }}
              style={{ ...signUpLinkStyle, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
            >
              &larr; Back to sign in
            </button>
          </>
        ) : (
          <>
            <div style={fieldGroupStyle}>
              <label htmlFor="email" style={labelStyle}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
          </>
        )}
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
