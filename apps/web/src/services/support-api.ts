import { getAuthHeaders } from './projects-api';
import { API_BASE_URL } from './api-client';

export interface TicketItem {
  id: string;
  ticketNumber: string;
  clientId: string;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  client?: { id: string; name: string | null; email: string };
  assignedTo?: { id: string; name: string | null; email: string } | null;
  subject: string;
  status: 'OPEN' | 'WAITING_FOR_OWNER' | 'WAITING_FOR_CLIENT' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  messages?: TicketMessageItem[];
  _count?: { messages: number };
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TicketRecord = TicketItem;

export interface TicketMessageItem {
  id: string;
  ticketId: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    role: 'Owner' | 'Client';
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HelpCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  orderIndex: number;
  _count?: { articles: number };
}

export interface HelpArticleItem {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

/* Client APIs */

export async function fetchMyTickets(status?: string): Promise<TicketItem[]> {
  const query = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE_URL}/api/support/tickets${query}`, {
    headers: getAuthHeaders(),
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    return [];
  }

  return res.json();
}

export async function createTicket(payload: {
  subject: string;
  description: string;
  priority?: string;
  projectId?: string;
}): Promise<TicketItem> {
  const res = await fetch(`${API_BASE_URL}/api/support/tickets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create support ticket');
  }

  return res.json();
}

export async function fetchTicketDetails(ticketId: string): Promise<TicketItem> {
  const res = await fetch(`${API_BASE_URL}/api/support/tickets/${ticketId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Ticket not found');
    }
    throw new Error('Failed to fetch ticket details');
  }

  return res.json();
}

export async function sendTicketMessage(
  ticketId: string,
  content: string,
): Promise<TicketMessageItem> {
  const res = await fetch(`${API_BASE_URL}/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error('Failed to post reply on ticket thread');
  }

  return res.json();
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
): Promise<TicketItem> {
  const res = await fetch(`${API_BASE_URL}/api/support/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Failed to update ticket status');
  }

  return res.json();
}

export async function fetchHelpCategories(): Promise<HelpCategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/support/help/categories`, {
      headers: getAuthHeaders(),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }

    return res.json();
  } catch {
    return [];
  }
}

export async function fetchHelpArticles(
  categoryId?: string,
  search?: string,
): Promise<HelpArticleItem[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/support/help/articles${query}`, {
      headers: getAuthHeaders(),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }

    return res.json();
  } catch {
    return [];
  }
}

export async function fetchHelpArticleBySlug(slug: string): Promise<HelpArticleItem> {
  const res = await fetch(`${API_BASE_URL}/api/support/help/articles/${slug}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Help article not found');
  }

  return res.json();
}

/* Owner APIs */

export async function fetchOwnerTicketQueue(filter?: {
  status?: string;
  priority?: string;
  clientId?: string;
}): Promise<TicketItem[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.priority) params.set('priority', filter.priority);
    if (filter?.clientId) params.set('clientId', filter.clientId);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/admin/support/tickets${query}`, {
      headers: getAuthHeaders(),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }

    return res.json();
  } catch {
    return [];
  }
}

export async function triageTicket(
  ticketId: string,
  payload: { status?: string; priority?: string; assignedToId?: string },
): Promise<TicketItem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/support/tickets/${ticketId}/triage`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to triage ticket');
  }

  return res.json();
}

export async function sendOwnerReply(
  ticketId: string,
  content: string,
): Promise<TicketMessageItem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error('Failed to send owner reply');
  }

  return res.json();
}

export async function fetchAdminHelpArticles(categoryId?: string, search?: string): Promise<HelpArticleItem[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/admin/support/help/articles${query}`, {
      headers: getAuthHeaders(),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }

    return res.json();
  } catch {
    return [];
  }
}

export async function createAdminHelpArticle(payload: {
  categoryId: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  isPublished?: boolean;
}): Promise<HelpArticleItem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/support/help/articles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create help article');
  }

  return res.json();
}

export async function updateAdminHelpArticle(
  id: string,
  payload: Partial<HelpArticleItem>,
): Promise<HelpArticleItem> {
  const res = await fetch(`${API_BASE_URL}/api/admin/support/help/articles/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update help article');
  }

  return res.json();
}

export async function deleteAdminHelpArticle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/support/help/articles/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to delete help article');
  }
}

export const supportApi = {
  listClientTickets: async (): Promise<TicketRecord[]> => {
    return fetchMyTickets();
  },
  createTicket: async (payload: { subject: string; message: string; priority?: string }): Promise<TicketRecord> => {
    return createTicket({
      subject: payload.subject,
      description: payload.message,
      priority: payload.priority,
    });
  },
};

