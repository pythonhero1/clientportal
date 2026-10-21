import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Meeting } from '../../../services/meetings-api';

export interface AssignMeetingProjectModalProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meetingId: string, projectId: string, description?: string) => Promise<any>;
}

export const AssignMeetingProjectModal: React.FC<AssignMeetingProjectModalProps> = ({
  meeting,
  open,
  onOpenChange,
  onSave,
}) => {
  const [projectId, setProjectId] = useState<string>(meeting?.projectId || 'proj_1');
  const [description, setDescription] = useState<string>(meeting?.description || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!meeting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(meeting.id, projectId, description);
      onOpenChange(false);
    } catch {
      // error handled in caller
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign Meeting to Project"
      description={`Link Cal.com session "${meeting.title}" to a client project.`}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text)] mb-1">
            Target Project ID
          </label>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="e.g. proj_1"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text)] mb-1">
            Session Agenda / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional notes or discussion points..."
            className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
          >
            Save Assignment
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
