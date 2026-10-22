import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { setAuthToken, API_BASE_URL } from '../../../services/api-client';
import { loadClerk } from '../../../services/clerk-client';
import { determineAuthenticatedRedirect } from '../../../services/auth-routing';

export const SignUpPage: React.FC = () => {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [invitationToken] = useState(() => {
    return new URLSearchParams(window.location.search).get('token') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        console.warn('[SignUpPage] Session check error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer for code resend during verification step
  useEffect(() => {
    if (step === 'verify' && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    try {
      const clerk = await loadClerk();
      if (clerk?.client?.signUp) {
        await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setCountdown(60);
      } else {
        setError('Verification session expired. Please re-enter your details.');
        setStep('form');
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.message || 'Failed to resend code. Please try again.';
      setError(msg);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!fullName.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        setIsLoading(false);
        return;
      }

      if (email.trim().toLowerCase() === 'stephenoderinde@gmail.com') {
        setError('stephenoderinde@gmail.com is the Administrator account. Please use the Admin login at portal.oderindestephen.com/admin.');
        setIsLoading(false);
        return;
      }

      let clerk: any = null;
      try {
        clerk = await loadClerk();
      } catch (loadErr: any) {
        console.error('Failed to load Clerk:', loadErr);
        setError('Authentication service is currently loading. Please refresh and try again.');
        setIsLoading(false);
        return;
      }

      if (!clerk || !clerk.client) {
        setError('Authentication service is not ready yet. Please wait a moment.');
        setIsLoading(false);
        return;
      }

      const names = fullName.trim().split(' ');
      const firstName = names[0] || 'Client';
      const lastName = names.slice(1).join(' ') || firstName;
      const baseUsername = email.trim().split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

      try {
        const createPayload: any = {
          emailAddress: email.trim(),
          password: password,
          firstName,
          lastName,
        };

        const signUpResult = await clerk.client.signUp.create(createPayload);

        if (signUpResult.missingFields && signUpResult.missingFields.length > 0) {
          const updatePayload: any = {};
          if (signUpResult.missingFields.includes('username')) {
            updatePayload.username = baseUsername.length >= 4 ? baseUsername : `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
          }
          if (signUpResult.missingFields.includes('first_name')) {
            updatePayload.first_name = firstName;
          }
          if (signUpResult.missingFields.includes('last_name')) {
            updatePayload.last_name = lastName;
          }
          if (Object.keys(updatePayload).length > 0) {
            await clerk.client.signUp.update(updatePayload).catch(() => {});
          }
        }

        if (signUpResult.status === 'complete' && signUpResult.createdSessionId) {
          await clerk.setActive({ session: signUpResult.createdSessionId });
          const token = await clerk.session?.getToken();
          if (token) setAuthToken(token);
          const realClerkUserId = signUpResult.createdUserId || clerk.user?.id;

          await fetch(`${API_BASE_URL}/api/auth/register-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              name: fullName.trim(),
              clerkUserId: realClerkUserId,
            }),
          }).catch(() => {});

          const redirectUrl = await determineAuthenticatedRedirect(token);
          window.location.href = redirectUrl;
          return;
        }

        try {
          await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        } catch (prepErr: any) {
          console.warn('[SignUpPage] prepareEmailAddressVerification notice:', prepErr?.message);
        }

        setStep('verify');
        setCountdown(60);
      } catch (clerkErr: any) {
        const msg =
          clerkErr.errors?.[0]?.longMessage ||
          clerkErr.errors?.[0]?.message ||
          'Registration failed.';
        setError(msg);
      }
    } catch {
      setError('Unable to register. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!verificationCode.trim()) {
      setError('Please enter the 6-digit confirmation code.');
      setIsLoading(false);
      return;
    }

    try {
      const clerk = await loadClerk();
      if (!clerk?.client?.signUp) {
        setError('Registration session not found. Please re-enter your details.');
        setStep('form');
        setIsLoading(false);
        return;
      }

      const completeSignUp = await clerk.client.signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      let finalSignUp = completeSignUp;

      // 1. Check if email verification code was invalid or unverified
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

      // 2. If email was verified but Clerk status remains 'missing_requirements', satisfy missing fields automatically
      if (finalSignUp.status === 'missing_requirements') {
        const missing = finalSignUp.missingFields || [];
        if (missing.length > 0) {
          const names = fullName.trim().split(' ');
          const fName = names[0] || 'Client';
          const lName = names.slice(1).join(' ') || fName;
          const updatePayload: any = {};

          if (missing.includes('first_name') || missing.includes('firstName')) {
            updatePayload.firstName = fName;
            updatePayload.first_name = fName;
          }
          if (missing.includes('last_name') || missing.includes('lastName')) {
            updatePayload.lastName = lName;
            updatePayload.last_name = lName;
          }
          if (missing.includes('password')) {
            updatePayload.password = password;
          }
          if (missing.includes('username')) {
            const cleanUser = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
            updatePayload.username = cleanUser.length >= 4 ? cleanUser : `${cleanUser}_${Date.now().toString().slice(-4)}`;
          }

          try {
            finalSignUp = await clerk.client.signUp.update(updatePayload);
          } catch (updateErr: any) {
            console.warn('[SignUpPage] Error satisfying missing fields:', updateErr);
            const msg = updateErr.errors?.[0]?.message || 'Additional profile details required to complete registration.';
            setError(msg);
            setIsLoading(false);
            return;
          }
        }
      }

      if (finalSignUp.status === 'complete' && finalSignUp.createdSessionId) {
        await clerk.setActive({ session: finalSignUp.createdSessionId });
        const token = await clerk.session?.getToken();
        if (token) setAuthToken(token);
        const realClerkUserId = finalSignUp.createdUserId || clerk.user?.id;

        // Synchronously register in PostgreSQL portal database
        try {
          await fetch(`${API_BASE_URL}/api/auth/register-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              name: fullName.trim(),
              clerkUserId: realClerkUserId,
            }),
          });
        } catch (regErr) {
          console.warn('[SignUpPage] register-client notify error:', regErr);
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
    } catch (verifyErr: any) {
      const msg =
        verifyErr.errors?.[0]?.longMessage ||
        verifyErr.errors?.[0]?.message ||
        'Verification code incorrect or expired. Please check your email and try again.';
      setError(msg);
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

  if (step === 'verify') {
    return (
      <AuthLayout
        tag="IDENTITY VERIFICATION"
        title="Verify your email"
        subtitle={`We sent a 6-digit confirmation code to ${email}. Enter the code below to complete registration.`}
      >
        <form onSubmit={handleVerifySubmit} style={formStyle}>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div style={fieldGroupStyle}>
            <label htmlFor="verificationCode" style={labelStyle}>
              Verification code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              placeholder="123456"
              autoFocus
              required
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em' }}
            />
          </div>

          <div style={resendRowStyle}>
            <span style={resendTextStyle}>Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              style={resendButtonStyle}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>

          <button type="submit" disabled={isLoading} style={submitButtonStyle}>
            {isLoading ? 'Verifying...' : 'Verify & complete registration'}
          </button>

          <div style={footerLinkContainerStyle}>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError(null);
              }}
              style={backButtonStyle}
            >
              &larr; Back to edit details
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tag="CLIENT WORKSPACE"
      title="Create your account"
      subtitle="Join your dedicated client workspace to view active projects, files, and deliverables."
    >
      <form onSubmit={handleFormSubmit} style={formStyle}>
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

const resendRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.8125rem',
};

const resendTextStyle: React.CSSProperties = {
  color: 'var(--muted-text)',
};

const resendButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-link)',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.8125rem',
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

const footerTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
};

const signInLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--primary-link)',
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-link)',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.8125rem',
  padding: 0,
};
