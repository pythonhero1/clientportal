import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type {
  TicketItem,
  HelpArticleItem,
  HelpCategoryItem,
} from '../../../services/support-api';
import {
  fetchOwnerTicketQueue,
  fetchAdminHelpArticles,
  fetchHelpCategories,
} from '../../../services/support-api';
import { OwnerTicketTriageModal } from '../components/OwnerTicketTriageModal';
import { ManageHelpArticleModal } from '../components/ManageHelpArticleModal';
import {
  LifeBuoy,
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  User,
  Edit2,
} from 'lucide-react';

export const OwnerSupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'kb'>('tickets');

  // Support Tickets State
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Knowledge Base State
  const [articles, setArticles] = useState<HelpArticleItem[]>([]);
  const [categories, setCategories] = useState<HelpCategoryItem[]>([]);
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('ALL');
  const [kbSearch, setKbSearch] = useState<string>('');
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [editingArticle, setEditingArticle] = useState<HelpArticleItem | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  // Load Support Queue
  const loadTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const data = await fetchOwnerTicketQueue({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets queue:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  // Load KB Articles & Categories
  const loadArticles = async () => {
    try {
      setIsLoadingArticles(true);
      const [cats, arts] = await Promise.all([
        fetchHelpCategories().catch(() => []),
        fetchAdminHelpArticles(
          kbCategoryFilter === 'ALL' ? undefined : kbCategoryFilter,
          kbSearch.trim() || undefined,
        ).catch(() => []),
      ]);
      setCategories(cats);
      setArticles(arts);
    } catch (err) {
      console.error('Failed to load KB articles:', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kb') {
      loadArticles();
    }
  }, [activeTab, kbCategoryFilter, kbSearch]);

  const getStatusBadge = (status: TicketItem['status']) => {
    switch (status) {
      case 'WAITING_FOR_OWNER':
        return <Badge variant="danger" size="sm">Action Required</Badge>;
      case 'OPEN':
        return <Badge variant="accent" size="sm">Open</Badge>;
      case 'WAITING_FOR_CLIENT':
        return <Badge variant="warning" size="sm">Awaiting Client</Badge>;
      case 'RESOLVED':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral" size="sm">Closed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: TicketItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger" size="sm">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'NORMAL':
        return <Badge variant="neutral" size="sm">Normal</Badge>;
      case 'LOW':
        return <Badge variant="neutral" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Client Support & Knowledge Base
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Triage client tickets, answer technical inquiries, and publish guides for your clients.
          </p>
        </div>

        {activeTab === 'kb' && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              setEditingArticle(null);
              setIsArticleModalOpen(true);
            }}
          >
            New Article
          </Button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--border)] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tickets'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-text)] hover:text-[var(--text)]'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets Queue</span>
          {tickets.filter((t) => t.status === 'WAITING_FOR_OWNER').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-mono">
              {tickets.filter((t) => t.status === 'WAITING_FOR_OWNER').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kb')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'kb'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-text)] hover:text-[var(--text)]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base Management</span>
        </button>
      </div>

      {/* TAB 1: Support Tickets Queue */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--muted-text)] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Action Needed', value: 'WAITING_FOR_OWNER' },
                { label: 'Open', value: 'OPEN' },
                { label: 'Awaiting Client', value: 'WAITING_FOR_CLIENT' },
                { label: 'Resolved', value: 'RESOLVED' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted-text)]">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          {isLoadingTickets ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-[var(--surface-raised)] animate-pulse border border-[var(--border)]"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface-raised)]/50 border border-[var(--border)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[var(--text)]">Queue clear!</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                No tickets match the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="p-4 hover:border-[var(--primary)]/50 transition-all cursor-pointer"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--muted-text)]">
                          {ticket.ticketNumber}
                        </span>
                        <span className="font-bold text-sm text-[var(--text)]">
                          {ticket.subject}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--muted-text)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {ticket.client?.name || ticket.client?.email || 'Client'}
                        </span>
                        {ticket.project && (
                          <span>Project: <strong className="text-[var(--text)]">{ticket.project.name}</strong></span>
                        )}
                        <span>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                        {ticket._count && (
                          <span>{ticket._count.messages} messages</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicketId(ticket.id);
                        }}
                      >
                        Triage & Reply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Knowledge Base Management */}
      {activeTab === 'kb' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setKbCategoryFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  kbCategoryFilter === 'ALL'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setKbCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    kbCategoryFilter === cat.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
              <input
                type="text"
                placeholder="Search articles..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Articles Table / Cards */}
          {isLoadingArticles ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-[var(--surface-raised)] animate-pulse border border-[var(--border)]"
                />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface-raised)]/50 border border-[var(--border)]">
              <BookOpen className="w-10 h-10 text-[var(--muted-text)] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--text)]">No articles created yet</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                Click "New Article" above to create your first client help guide.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((art) => (
                <Card key={art.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[var(--text)]">
                        {art.title}
                      </span>
                      {art.category && (
                        <Badge variant="accent" size="sm">
                          {art.category.name}
                        </Badge>
                      )}
                      <Badge
                        variant={art.isPublished ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {art.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    {art.excerpt && (
                      <p className="text-xs text-[var(--muted-text)] line-clamp-1">
                        {art.excerpt}
                      </p>
                    )}
                    <span className="text-[11px] text-[var(--muted-text)] block">
                      Slug: <span className="font-mono">{art.slug}</span> • Updated:{' '}
                      {new Date(art.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setEditingArticle(art);
                      setIsArticleModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <OwnerTicketTriageModal
        ticketId={selectedTicketId}
        isOpen={Boolean(selectedTicketId)}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={loadTickets}
      />

      <ManageHelpArticleModal
        article={editingArticle}
        categories={categories}
        isOpen={isArticleModalOpen}
        onClose={() => {
          setIsArticleModalOpen(false);
          setEditingArticle(null);
        }}
        onSaved={loadArticles}
        onDeleted={loadArticles}
      />
    </div>
  );
};
