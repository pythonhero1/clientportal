import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { HelpArticleItem } from '../../../services/support-api';
import { X, BookOpen, Calendar } from 'lucide-react';

interface HelpArticleModalProps {
  article: HelpArticleItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HelpArticleModal: React.FC<HelpArticleModalProps> = ({
  article,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between gap-4 bg-[var(--surface-raised)]/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {article.category && (
                  <Badge variant="accent" size="sm">
                    {article.category.name}
                  </Badge>
                )}
                <span className="text-xs text-[var(--muted-text)] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(article.publishedAt || article.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
                {article.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {article.excerpt && (
            <p className="text-base text-[var(--muted-text)] font-medium leading-relaxed italic border-l-2 border-[var(--primary)] pl-3">
              {article.excerpt}
            </p>
          )}

          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">
            {article.content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]/30">
          <span className="text-xs text-[var(--muted-text)]">
            Article reference: {article.slug}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
