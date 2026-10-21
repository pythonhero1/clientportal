import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { type UserProfileData, updateUserProfile } from '../../../services/settings-api';
import { CheckCircle2, UserCheck } from 'lucide-react';

interface ProfileFormProps {
  initialProfile: UserProfileData;
  onProfileUpdated?: (updated: UserProfileData) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [companyName, setCompanyName] = useState(initialProfile.profile?.companyName || '');
  const [phone, setPhone] = useState(initialProfile.profile?.phone || '');
  const [timezone, setTimezone] = useState(initialProfile.profile?.timezone || 'Africa/Lagos');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateUserProfile({
        name,
        companyName,
        phone,
        timezone,
      });

      setSuccessMessage('Profile details updated successfully.');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...initialProfile,
          name,
          profile: {
            ...initialProfile.profile!,
            companyName,
            phone,
            timezone,
          },
        });
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Contact Profile</CardTitle>
            <CardDescription>Official contact and company profile registered with Stephen</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {successMessage && (
            <div className="p-3 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] text-xs text-[var(--success-text)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stephen Oderinde"
              required
            />

            <Input
              label="Email Address"
              value={initialProfile.email}
              disabled
              helperText="Managed via Clerk authentication. Cannot be modified directly."
            />

            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Studio"
            />

            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +234 800 000 0000"
            />

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text)] mb-1">
                Preferred Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT+0 / BST)</option>
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST / PDT)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
            >
              Update Profile Details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
