import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type {
  HelpCategoryItem,
  HelpArticleItem,
  TicketItem,
} from '../../../services/support-api';
import {
  fetchHelpCategories,
  fetchHelpArticles,
  fetchMyTickets,
} from '../../../services/support-api';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { TicketThreadModal } from '../components/TicketThreadModal';
import { HelpArticleModal } from '../components/HelpArticleModal';
import {
  Search,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

export const SupportHelpPage: React.FC = () => {
  // Knowledge Base State
  const [categories, setCategories] = useState<HelpCategoryItem[]>([]);
  const [articles, setArticles] = useState<HelpArticleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticleItem | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load Categories & Articles
  useEffect(() => {
    async function loadHelp() {
      try {
        setIsLoadingArticles(true);
        const [cats, arts] = await Promise.all([
          fetchHelpCategories().catch(() => []),
          fetchHelpArticles(
            selectedCategory === 'ALL' ? undefined : selectedCategory,
            searchQuery.trim() || undefined,
          ).catch(() => []),
        ]);
        setCategories(cats);
        setArticles(arts);
      } catch (err) {
        console.error('Failed to load help center:', err);
      } finally {
        setIsLoadingArticles(false);
      }
    }
    loadHelp();
  }, [selectedCategory, searchQuery]);

  // Load Tickets
  const loadTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const data = await fetchMyTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleTicketCreated = (newTicket: TicketItem) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const getStatusBadge = (status: TicketItem['status']) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="accent" size="sm">Open</Badge>;
      case 'WAITING_FOR_OWNER':
        return <Badge variant="warning" size="sm">Pending Owner Review</Badge>;
      case 'WAITING_FOR_CLIENT':
        return <Badge variant="warning" size="sm">Awaiting Your Reply</Badge>;
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

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'ACTIVE') {
      return t.status === 'OPEN' || t.status === 'WAITING_FOR_OWNER' || t.status === 'WAITING_FOR_CLIENT';
    }
    if (ticketFilter === 'RESOLVED') {
      return t.status === 'RESOLVED' || t.status === 'CLOSED';
    }
    return true;
  });

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Help Center & Support
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Browse knowledge base guides or submit a direct assistance ticket directly to Stephen.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Open New Ticket
        </Button>
      </div>

      {/* Section 1: Knowledge Base */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              Knowledge Base & Guides
            </h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Self-service documentation for deliverable approvals, revisions, billing, and portal features.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-[var(--surface-raised)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Articles List / Grid */}
        {isLoadingArticles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--surface-raised)] animate-pulse border border-[var(--border)]"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--surface-raised)]/50 border border-[var(--border)]">
            <HelpCircle className="w-8 h-8 text-[var(--muted-text)] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[var(--text)]">No articles found</p>
            <p className="text-xs text-[var(--muted-text)] mt-1">
              Try adjusting your search terms or select another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((art) => (
              <Card
                key={art.id}
                className="p-5 hover:border-[var(--primary)]/50 transition-all cursor-pointer flex flex-col justify-between group"
                onClick={() => setSelectedArticle(art)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {art.category ? (
                      <Badge variant="accent" size="sm">
                        {art.category.name}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] text-[var(--muted-text)]">
                      {new Date(art.publishedAt || art.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                  {art.excerpt && (
                    <p className="text-xs text-[var(--muted-text)] line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs text-[var(--primary)] font-semibold">
                  <span>Read Article</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Support Tickets */}
      <section className="space-y-4 pt-6 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
              Your Support Tickets
            </h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Direct communication thread with Stephen for project questions, technical inquiries, or billing support.
            </p>
          </div>

          {/* Ticket Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setTicketFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                ticketFilter === 'ALL'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--text)]'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setTicketFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                ticketFilter === 'ACTIVE'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--text)]'
              }`}
            >
              Active (
              {
                tickets.filter(
                  (t) =>
                    t.status === 'OPEN' ||
                    t.status === 'WAITING_FOR_OWNER' ||
                    t.status === 'WAITING_FOR_CLIENT',
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setTicketFilter('RESOLVED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                ticketFilter === 'RESOLVED'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--muted-text)] hover:text-[var(--text)]'
              }`}
            >
              Resolved (
              {
                tickets.filter(
                  (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
                ).length
              }
              )
            </button>
          </div>
        </div>

        {/* Ticket List */}
        {isLoadingTickets ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-[var(--surface-raised)] animate-pulse border border-[var(--border)]"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--surface-raised)]/50 border border-[var(--border)]">
            <MessageSquare className="w-8 h-8 text-[var(--muted-text)] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[var(--text)]">No support tickets found</p>
            <p className="text-xs text-[var(--muted-text)] mt-1">
              {ticketFilter !== 'ALL'
                ? `You have no ${ticketFilter.toLowerCase()} support tickets.`
                : 'Need help? Click "Open New Ticket" above to reach Stephen directly.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-5 hover:border-[var(--primary)]/50 transition-all cursor-pointer"
                onClick={() => setActiveTicketId(ticket.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[var(--text)]">
                        {ticket.subject}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted-text)] flex-wrap">
                      <span className="font-mono">{ticket.ticketNumber}</span>
                      {ticket.project && (
                        <span>Project: <strong className="text-[var(--text)]">{ticket.project.name}</strong></span>
                      )}
                      <span>Opened: {new Date(ticket.createdAt).toLocaleDateString()}</span>
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
                        setActiveTicketId(ticket.id);
                      }}
                    >
                      View Thread
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <TicketThreadModal
        ticketId={activeTicketId}
        isOpen={Boolean(activeTicketId)}
        onClose={() => setActiveTicketId(null)}
        onTicketUpdated={loadTickets}
      />

      <HelpArticleModal
        article={selectedArticle}
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};
