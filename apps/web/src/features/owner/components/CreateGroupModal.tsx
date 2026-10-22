import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { fetchOwnerProjects } from '../../../services/projects-api';
import { messagesApi } from '../../../services/messages-api';
import { useToast } from '../../../hooks/useToast';

interface ProjectOption {
  id: string;
  name: string;
}

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      fetchOwnerProjects()
        .then((list: any) => {
          const arr = Array.isArray(list) ? list : [];
          setProjects(arr);
          if (arr.length > 0 && !projectId) {
            setProjectId(arr[0].id);
          }
        })
        .catch(() => {
          setProjects([]);
        });
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setIsSubmitting(true);
    try {
      await messagesApi.createConversation({
        type: 'GROUP',
        title: title.trim(),
        projectId,
        participantUserIds: [], // Will populate assigned project members
      });
      toast.success('Group conversation created successfully.');
      onCreated();
      onOpenChange(false);
      setTitle('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group conversation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Project Group Channel"
      description="Create a project-scoped group conversation. Cross-client exposure is strictly blocked."
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label className="block text-xs font-semibold text-[var(--text)] mb-1">
            Channel Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text)] mb-1">
            Target Project Scope
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-[0.625rem] text-[var(--muted-text)] mt-1">
            Only collaborators explicitly assigned to this project can be added.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
            isLoading={isSubmitting}
            disabled={!title.trim() || !projectId}
          >
            Create Channel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
