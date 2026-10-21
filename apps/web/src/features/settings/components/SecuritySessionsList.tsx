import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { type SessionData, fetchActiveSessions, revokeSession } from '../../../services/settings-api';
import { Shield, Key, Laptop, Trash2, Loader2 } from 'lucide-react';

interface SecuritySessionsListProps {
  role: 'Owner' | 'Client';
  mfaEnforced: boolean;
}

export const SecuritySessionsList: React.FC<SecuritySessionsListProps> = ({
  role,
  mfaEnforced,
}) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await fetchActiveSessions();
        setSessions(data);
      } catch (err) {
        console.error('Failed to load active sessions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  const isOwner = role === 'Owner';

  return (
    <div className="space-y-6">
      {/* MFA Security Policy Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Authentication & Multi-Factor Security</CardTitle>
                <CardDescription>
                  {isOwner
                    ? 'Owner privileges require mandatory multi-factor authentication (MFA)'
                    : 'Optional two-factor authentication to protect your client portal access'}
                </CardDescription>
              </div>
            </div>

            <Badge
              variant={mfaEnforced ? 'success' : isOwner ? 'danger' : 'neutral'}
              size="sm"
            >
              {mfaEnforced
                ? 'MFA Active'
                : isOwner
                ? 'Mandatory Setup Required'
                : 'MFA Optional'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-left">
          <p className="text-xs text-[var(--muted-text)] leading-relaxed">
            Identity credentials, password reset flows, and TOTP authentication are secured directly through Clerk.
            {isOwner
              ? ' Owner accounts require verified MFA credentials for all administrative operations.'
              : ' Clients may enroll in MFA at any time for added account safety.'}
          </p>

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Key className="w-4 h-4" />}
              onClick={() => {
                window.alert('Redirecting to Clerk security configuration.');
              }}
            >
              Manage Credentials & Passwords
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Active Devices & Sessions</CardTitle>
              <CardDescription>Manage active browser logins and revoke unverified sessions</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="text-left">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center text-[var(--muted-text)] text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-[var(--muted-text)] py-4">No other active sessions detected.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Laptop className="w-5 h-5 text-[var(--muted-text)] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text)]">{sess.device}</span>
                        {sess.isCurrent && (
                          <Badge variant="success" size="sm">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-text)] mt-0.5">
                        Status: {sess.status} • Last active:{' '}
                        {new Date(sess.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(sess.id)}
                      isLoading={revokingId === sess.id}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--danger)]" />}
                      className="text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
