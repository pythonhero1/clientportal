import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Bell, BellRing, AlertCircle } from 'lucide-react';
import { useWebPush } from '../hooks/useWebPush';

export const PushBanner: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = useWebPush();

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <Card className="border-l-4 border-l-[var(--warning-text)] bg-[var(--surface-raised)] py-3 px-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--warning-text)] shrink-0" />
          <div className="text-left text-xs text-[var(--muted-text)]">
            <span className="font-semibold text-[var(--text)]">Browser Push Blocked: </span>
            You previously denied notification permissions. You can unblock notifications in your browser site settings.
          </div>
        </div>
      </Card>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs">
        <div className="flex items-center gap-2 text-[var(--muted-text)]">
          <BellRing className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
          <span>Browser push notifications are enabled on this device.</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={unsubscribe}
          isLoading={isLoading}
          className="text-xs h-7 px-2 text-[var(--muted-text)] hover:text-[var(--danger)]"
        >
          Disable
        </Button>
      </div>
    );
  }

  return (
    <Card className="border border-[var(--border)] bg-gradient-to-r from-[var(--surface-raised)] to-[var(--surface)] p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text)]">
              Enable Instant Push Notifications
            </h4>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Receive timely alerts for new file deliverables, messages, and project updates directly in your browser.
            </p>
            {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={subscribe}
          isLoading={isLoading}
          leftIcon={<BellRing className="w-4 h-4" />}
          className="shrink-0"
        >
          Enable Push
        </Button>
      </div>
    </Card>
  );
};
