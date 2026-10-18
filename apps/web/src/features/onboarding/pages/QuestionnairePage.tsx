import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuestionnairePage: React.FC = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 text-left max-w-3xl mx-auto">
      <FixtureBadge phase="P03" />

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
            defaultValue="Acme Retail Co."
            placeholder="Your official business name"
          />

          <Input
            label="Target Audience & Market"
            defaultValue="Direct-to-consumer lifestyle and luxury accessories"
            placeholder="Who are your primary clients?"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)]">
              Core Deliverables & Features
            </label>
            <textarea
              rows={4}
              defaultValue="Modern responsive e-commerce storefront, Shopify or custom headless integration, customer portal for order tracking."
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted-text)]">Draft changes autosaved locally</span>
            <Button
              type="submit"
              variant="primary"
              leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {saved ? 'Saved Successfully' : 'Save Brief Draft'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
