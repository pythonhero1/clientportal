import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Switch } from '../../../components/ui/Switch';
import {
  type NotificationPreferencesData,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/settings-api';
import { Bell, Check, Loader2 } from 'lucide-react';

export const NotificationPreferencesForm: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNotificationPreferences();
        setPreferences(data);
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async (key: keyof NotificationPreferencesData, value: boolean) => {
    if (!preferences) return;

    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateNotificationPreferences({ [key]: value });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update preference:', err);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center text-[var(--muted-text)] text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading notification preferences...
        </CardContent>
      </Card>
    );
  }

  if (!preferences) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure in-app center updates and browser push delivery</CardDescription>
            </div>
          </div>

          {isSaving ? (
            <span className="text-xs text-[var(--muted-text)] flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          ) : saveSuccess ? (
            <span className="text-xs text-[var(--success-text)] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-left">
        {/* In-App Center */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] border-b border-[var(--border)] pb-1.5">
            In-App Notification Center
          </h4>

          <Switch
            label="Deliverable Reviews & Feedback"
            description="Receive alerts when new designs are uploaded or feedback is requested."
            checked={preferences.inAppDeliverables}
            onCheckedChange={(val) => handleToggle('inAppDeliverables', val)}
          />

          <Switch
            label="Portal Messages & Discussions"
            description="Receive notifications for new messages in conversation channels."
            checked={preferences.inAppMessages}
            onCheckedChange={(val) => handleToggle('inAppMessages', val)}
          />

          <Switch
            label="Invoices & Billing Statements"
            description="Receive notices when new invoices are issued or payments confirmed."
            checked={preferences.inAppInvoices}
            onCheckedChange={(val) => handleToggle('inAppInvoices', val)}
          />

          <Switch
            label="Project Milestones & Meetings"
            description="Get notified when milestone statuses change or meetings are scheduled."
            checked={preferences.inAppMilestones}
            onCheckedChange={(val) => handleToggle('inAppMilestones', val)}
          />

          <Switch
            label="Support Ticket Updates"
            description="Receive notices when Stephen replies to your assistance tickets."
            checked={preferences.inAppSupport}
            onCheckedChange={(val) => handleToggle('inAppSupport', val)}
          />
        </div>

        {/* Browser Push */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Browser Web Push (VAPID)
            </h4>
            <span className="text-[0.6875rem] text-[var(--muted-text)]">
              Minimal lock-screen payload
            </span>
          </div>

          <Switch
            label="Enable Browser Push Channel"
            description="Allow over-the-air push alerts on this browser when you are away from the portal."
            checked={preferences.pushEnabled}
            onCheckedChange={(val) => handleToggle('pushEnabled', val)}
          />

          {preferences.pushEnabled && (
            <div className="pl-4 border-l-2 border-[var(--border)] space-y-3 pt-1">
              <Switch
                label="Push on Deliverables"
                description="Instant browser alert on file review requests."
                checked={preferences.pushDeliverables}
                onCheckedChange={(val) => handleToggle('pushDeliverables', val)}
              />

              <Switch
                label="Push on Messages"
                description="Instant browser alert for incoming portal messages."
                checked={preferences.pushMessages}
                onCheckedChange={(val) => handleToggle('pushMessages', val)}
              />

              <Switch
                label="Push on Invoices"
                description="Instant browser alert when billing invoices are issued."
                checked={preferences.pushInvoices}
                onCheckedChange={(val) => handleToggle('pushInvoices', val)}
              />

              <Switch
                label="Push on Support Replies"
                description="Instant browser alert when Stephen replies to your ticket."
                checked={preferences.pushSupport}
                onCheckedChange={(val) => handleToggle('pushSupport', val)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
