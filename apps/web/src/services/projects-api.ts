import { API_BASE_URL } from './api-client';

export interface DevPersona {
  id: string;
  name: string;
  role: 'Owner' | 'Client';
  email: string;
  hasMfa?: boolean;
}

export const DEV_PERSONAS: Record<string, DevPersona> = {
  owner: {
    id: 'owner',
    name: 'Stephen Oderinde',
    role: 'Owner',
    email: 'owner@oderindestephen.com',
    hasMfa: true,
  },
  client_a: {
    id: 'client_a',
    name: 'Alpha Client (Project 1)',
    role: 'Client',
    email: 'client_a@example.com',
  },
  client_b: {
    id: 'client_b',
    name: 'Beta Client (Project 2)',
    role: 'Client',
    email: 'client_b@example.com',
  },
  client_c: {
    id: 'client_c',
    name: 'Gamma Client (No Project)',
    role: 'Client',
    email: 'client_c@example.com',
  },
};

export function getActivePersona(): DevPersona {
  const savedKey = localStorage.getItem('portal_dev_user');
  if (savedKey && DEV_PERSONAS[savedKey]) {
    return DEV_PERSONAS[savedKey];
  }
  return DEV_PERSONAS.client_a;
}

export function setActivePersona(key: string) {
  if (DEV_PERSONAS[key]) {
    localStorage.setItem('portal_dev_user', key);
    window.location.reload();
  }
}

export function getAuthHeaders(): HeadersInit {
  const persona = getActivePersona();
  return {
    'Content-Type': 'application/json',
    'x-mock-user-id': persona.id,
    'x-mock-role': persona.role,
    'x-mock-status': 'ACTIVE',
    'x-mock-mfa': persona.hasMfa ? 'true' : 'false',
    'x-mock-billing-contact': persona.id === 'client_c' ? 'false' : 'true',
  };
}

export async function fetchClientOverview() {
  const res = await fetch(`${API_BASE_URL}/api/client/overview`, {
    headers: getAuthHeaders(),
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    throw new Error(`Overview fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: getAuthHeaders(),
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    return [
      { id: 'proj_1', name: 'Brand & Portal Implementation (Client A)' },
      { id: 'proj_2', name: 'Design System & Staging Workspace (Client B)' },
    ];
  }
  return res.json();
}

export async function fetchProjectWorkspace(projectId: string) {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/workspace`, {
    headers: getAuthHeaders(),
  });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    throw new Error(`Workspace fetch failed: ${res.status}`);
  }
  return res.json();
}

export async function approveMilestone(projectId: string, milestoneId: string) {
  const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Approve milestone failed: ${res.status}`);
  return res.json();
}

export async function fetchOnboarding(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/onboarding`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Onboarding fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchQuestionnaire(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/onboarding/questionnaire`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Questionnaire fetch failed: ${res.status}`);
  return res.json();
}

export async function saveQuestionnaireDraft(projectId: string, responses: Record<string, any>) {
  const res = await fetch(`/api/projects/${projectId}/onboarding/questionnaire/draft`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ responses }),
  });
  if (!res.ok) throw new Error(`Autosave draft failed: ${res.status}`);
  return res.json();
}

export async function submitQuestionnaire(projectId: string, responses: Record<string, any>) {
  const res = await fetch(`/api/projects/${projectId}/onboarding/questionnaire/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ responses }),
  });
  if (!res.ok) throw new Error(`Submit questionnaire failed: ${res.status}`);
  return res.json();
}

export async function confirmCredentialShared(projectId: string, data: { platformName: string; method: string; instructions?: string }) {
  const res = await fetch(`/api/projects/${projectId}/onboarding/credentials/confirm-shared`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Credential status update failed: ${res.status}`);
  return res.json();
}

// Owner API Calls
export async function fetchOwnerProjects() {
  const res = await fetch('/api/admin/projects', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Owner projects fetch failed: ${res.status}`);
  return res.json();
}

export async function createOwnerProject(data: { name: string; description?: string; clientId: string; initialWebsites?: any[] }) {
  const res = await fetch('/api/admin/projects', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create project failed: ${res.status}`);
  return res.json();
}

export async function addOwnerWebsite(projectId: string, data: { name: string; url: string; environment?: string; status?: string }) {
  const res = await fetch(`/api/admin/projects/${projectId}/websites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Add website failed: ${res.status}`);
  return res.json();
}

export async function addOwnerMilestone(projectId: string, data: { title: string; description?: string; orderIndex?: number; status?: string; dueDate?: string }) {
  const res = await fetch(`/api/admin/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Add milestone failed: ${res.status}`);
  return res.json();
}

export async function addOwnerDocument(projectId: string, data: { title: string; driveUrl: string; category?: string; sharedStatusNote?: string }) {
  const res = await fetch(`/api/admin/projects/${projectId}/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Add document failed: ${res.status}`);
  return res.json();
}

export async function approveOwnerKickoff(projectId: string, notes?: string) {
  const res = await fetch(`/api/admin/projects/${projectId}/kickoff/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(`Approve kickoff failed: ${res.status}`);
  return res.json();
}
