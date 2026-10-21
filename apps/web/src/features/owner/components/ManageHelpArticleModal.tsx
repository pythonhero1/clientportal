import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import type { HelpArticleItem, HelpCategoryItem } from '../../../services/support-api';
import {
  createAdminHelpArticle,
  updateAdminHelpArticle,
  deleteAdminHelpArticle,
} from '../../../services/support-api';
import { X, BookOpen, Trash2, AlertCircle } from 'lucide-react';

interface ManageHelpArticleModalProps {
  article: HelpArticleItem | null;
  categories: HelpCategoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

export const ManageHelpArticleModal: React.FC<ManageHelpArticleModalProps> = ({
  article,
  categories,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(article);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCategoryId(article.categoryId);
      setExcerpt(article.excerpt || '');
      setContent(article.content);
      setIsPublished(article.isPublished);
    } else {
      setTitle('');
      setCategoryId(categories[0]?.id || '');
      setExcerpt('');
      setContent('');
      setIsPublished(true);
    }
    setError(null);
  }, [article, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      setError('Please provide a title, category, and article content.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && article) {
        await updateAdminHelpArticle(article.id, {
          title: title.trim(),
          categoryId,
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          isPublished,
        });
      } else {
        await createAdminHelpArticle({
          title: title.trim(),
          categoryId,
          excerpt: excerpt.trim() || undefined,
          content: content.trim(),
          isPublished,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save help article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!window.confirm(`Are you sure you want to delete "${article.title}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteAdminHelpArticle(article.id);
      if (onDeleted) onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between gap-4 bg-[var(--surface-raised)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
                {isEditing ? 'Edit Knowledge Base Article' : 'Create Knowledge Base Article'}
              </h2>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                {isEditing
                  ? 'Update guides and self-service documentation for your clients.'
                  : 'Add a new reference guide, FAQ, or deliverable instructions for clients.'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1.5">
              Article Title *
            </label>
            <input
              type="text"
              placeholder="e.g. How to Submit Feedback on Deliverables"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
              </label>
              <span className="text-xs font-semibold text-[var(--text)]">
                {isPublished ? 'Published (visible to clients)' : 'Draft (hidden)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1.5">
              Summary / Excerpt (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief description visible in search and preview cards..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)] mb-1.5">
              Article Content *
            </label>
            <textarea
              rows={8}
              placeholder="Write the article content, step-by-step instructions, or policy clarification..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
            {isEditing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 hover:border-red-500/40"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Article'}
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Article'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
