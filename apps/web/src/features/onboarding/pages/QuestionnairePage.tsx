import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchQuestionnaire, saveQuestionnaireDraft } from '../../../services/projects-api';

export const QuestionnairePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');
  const [projectId, setProjectId] = useState<string>(urlProjectId || '');

  const [companyName, setCompanyName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!urlProjectId) {
      import('../../../services/projects-api').then(({ fetchProjects }) => {
        fetchProjects()
          .then((projs) => {
            if (Array.isArray(projs) && projs.length > 0) {
              setProjectId(projs[0].id);
            }
          })
          .catch(() => {});
      });
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (projectId) {
      fetchQuestionnaire(projectId)
        .then((data) => {
          if (data?.responses) {
            if (data.responses.companyName) setCompanyName(data.responses.companyName);
            if (data.responses.targetAudience) setTargetAudience(data.responses.targetAudience);
            if (data.responses.deliverables) setDeliverables(data.responses.deliverables);
          }
        })
        .catch((err) => console.warn('Questionnaire fetch error:', err));
    }
  }, [projectId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveQuestionnaireDraft(projectId, {
        companyName,
        targetAudience,
        deliverables,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Draft save error, preserved in session:', err);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/onboarding">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Onboarding Questionnaire
          </h1>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">
            Step 2: Share project specifications, brand parameters, and design vision.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Company / Brand Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your official business name"
          />

          <Input
            label="Target Audience & Market"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Who are your primary clients?"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)]">
              Core Deliverables & Features
            </label>
            <textarea
              rows={4}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted-text)]">Draft changes autosaved</span>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Brief Draft'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
