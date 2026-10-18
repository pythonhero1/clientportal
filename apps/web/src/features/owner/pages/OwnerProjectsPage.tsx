import React, { useState, useEffect } from 'react';
import { PortalHeader } from '../../../components/PortalHeader';
import { DevPersonaSwitcher } from '../../../components/DevPersonaSwitcher';
import { fetchOwnerProjects, createOwnerProject } from '../../../services/projects-api';
import {
  FolderGit2,
  Plus,
  ShieldCheck,
  ArrowRight,
  Globe,
} from 'lucide-react';

export const OwnerProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('client_a');
  const [stagingUrl, setStagingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    fetchOwnerProjects()
      .then((res) => {
        setProjects(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      await createOwnerProject({
        name,
        description,
        clientId,
        initialWebsites: stagingUrl
          ? [{ name: 'Staging Environment', url: stagingUrl, environment: 'STAGING' }]
          : [],
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setStagingUrl('');
      loadProjects();
    } catch (err: any) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <DevPersonaSwitcher />
      <PortalHeader activeTab="owner" />

      <main style={mainContentStyle}>
        <div style={contentInnerStyle}>
          {/* Header & Create Action */}
          <div style={headerRowStyle}>
            <div>
              <div style={badgeStyle}>
                <ShieldCheck size={13} style={{ marginRight: '4px' }} />
                <span>OWNER WORKSPACE MANAGEMENT</span>
              </div>
              <h1 style={titleStyle}>Client Engagements & Projects</h1>
              <p style={subtitleStyle}>
                Create client projects, configure staging websites, manage delivery milestones, and approve technical kickoffs.
              </p>
            </div>

            <button onClick={() => setShowModal(true)} style={createBtnStyle}>
              <Plus size={16} />
              <span>Create New Project</span>
            </button>
          </div>

          {/* Projects Table */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderGit2 size={18} color="var(--primary-link)" />
                <h3 style={cardTitleStyle}>Active & Onboarding Engagements ({projects.length})</h3>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-text)' }}>
                Loading client engagements...
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted-text)' }}>No projects in workspace.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thStyle}>Project Name</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Assigned Client</th>
                      <th style={thStyle}>Websites</th>
                      <th style={thStyle}>Created Date</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const clientMember = p.memberships?.[0]?.user;
                      return (
                        <tr key={p.id} style={tableRowStyle}>
                          <td style={tdStyle}>
                            <strong style={{ color: 'var(--text)' }}>{p.name}</strong>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-text)' }}>ID: {p.id}</p>
                          </td>
                          <td style={tdStyle}>
                            <span style={statusBadgeStyle(p.status)}>{p.status}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ color: 'var(--text)', fontSize: '13px' }}>
                              {clientMember?.name || (p.id === 'proj_1' ? 'Alpha Client' : 'Beta Client')}
                            </span>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted-text)' }}>
                              {clientMember?.email || `${p.id}@example.com`}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                              <Globe size={13} color="var(--primary-link)" />
                              <span>{p.websites?.length || (p.id === 'proj_1' ? 2 : 1)} linked</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <a href={`/owner/projects/${p.id}`} style={manageBtnStyle}>
                              <span>Manage</span>
                              <ArrowRight size={13} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text)' }}>Create Client Project Engagement</h3>
              <button onClick={() => setShowModal(false)} style={closeBtnStyle}>&times;</button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '1.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stephen Showcase Website"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Description / Engagement Scope</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Custom headless digital storefront with responsive dark and light themes."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={textareaStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Assign Client Persona *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={selectStyle}
                >
                  <option value="client_a">Client A (client_a@example.com - Alpha Client)</option>
                  <option value="client_b">Client B (client_b@example.com - Beta Client)</option>
                  <option value="client_c">Client C (client_c@example.com - Gamma Client)</option>
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Initial Staging Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://staging.example.com"
                  value={stagingUrl}
                  onChange={(e) => setStagingUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnStyle}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={submitModalBtnStyle}>
                  {submitting ? 'Creating...' : 'Create & Initialize Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: 'var(--canvas)',
  color: 'var(--text)',
};

const mainContentStyle: React.CSSProperties = {
  padding: '2rem 1.5rem 4rem 1.5rem',
};

const contentInnerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#4F46E5',
  backgroundColor: 'rgba(79, 70, 229, 0.1)',
  padding: '3px 8px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: '0.4rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: 'var(--text)',
  margin: '0 0 0.25rem 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--muted-text)',
  margin: 0,
};

const createBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  overflow: 'hidden',
};

const cardHeaderStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--text)',
  margin: 0,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-raised)',
  borderBottom: '1px solid var(--border)',
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--muted-text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  padding: '1rem 1.25rem',
  fontSize: '13px',
};

const statusBadgeStyle = (status: string): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 700,
  color: status === 'ACTIVE' ? '#10B981' : '#F59E0B',
  backgroundColor: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
});

const manageBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-raised)',
  color: 'var(--primary-link)',
  border: '1px solid var(--border)',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '520px',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--muted-text)',
  fontSize: '20px',
  cursor: 'pointer',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'block',
  marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '1.5rem',
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--muted-text)',
  padding: '0.6rem 1rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

const submitModalBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.6rem 1.25rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};
