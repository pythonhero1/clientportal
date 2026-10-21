import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { useTheme } from '../../../hooks/useTheme';
import { fetchUserProfile, type UserProfileData } from '../../../services/settings-api';
import { ProfileForm } from '../components/ProfileForm';
import { NotificationPreferencesForm } from '../components/NotificationPreferencesForm';
import { SecuritySessionsList } from '../components/SecuritySessionsList';
import { Sun, Moon, Monitor, Palette, Loader2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUserProfile();
        setUserProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
          Account & Security Settings
        </h1>
        <p className="text-sm text-[var(--muted-text)] mt-1">
          Manage your contact profile, interface theme, notification delivery, and authentication security.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center text-[var(--muted-text)]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading account details...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
          {error}
        </div>
      ) : userProfile ? (
        <>
          {/* Profile Form */}
          <ProfileForm
            initialProfile={userProfile}
            onProfileUpdated={setUserProfile}
          />

          {/* Theme Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Theme Appearance</CardTitle>
                  <CardDescription>Select high-contrast dark mode, clean light mode, or follow system OS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === 'dark'
                      ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
                  }`}
                >
                  <Moon className="w-5 h-5 text-[var(--primary)] mb-2" />
                  <p className="text-sm font-bold text-[var(--text)]">Dark Mode</p>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">High-contrast dark canvas</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === 'light'
                      ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
                  }`}
                >
                  <Sun className="w-5 h-5 text-[var(--primary)] mb-2" />
                  <p className="text-sm font-bold text-[var(--text)]">Light Mode</p>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">Crisp light backgrounds</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === 'system'
                      ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-[var(--primary)] mb-2" />
                  <p className="text-sm font-bold text-[var(--text)]">System Default</p>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">Matches OS preference</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <NotificationPreferencesForm />

          {/* Security & Sessions */}
          <SecuritySessionsList
            role={userProfile.role}
            mfaEnforced={userProfile.mfaEnforced}
          />
        </>
      ) : null}
    </div>
  );
};
