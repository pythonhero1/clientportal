import React, { useState, useEffect } from 'react';
import {
  fetchProjectWorkspace,
  addOwnerWebsite,
  addOwnerMilestone,
  addOwnerDocument,
  approveOwnerKickoff,
} from '../../../services/projects-api';
import {
  Globe,
  Clock,
  FileText,
  ShieldCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const OwnerProjectDetailPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWebModal, setShowWebModal] = useState(false);
  const [webName, setWebName] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webEnv, setWebEnv] = useState('STAGING');

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');

  const [showDocModal, setShowDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docCat, setDocCat] = useState('BRIEF');

  const [kickoffNotes] = useState('');
  const [kickoffSubmitting, setKickoffSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const pathParts = window.location.pathname.split('/');
  const projectId = pathParts[3] || 'proj_1';

  const loadData = () => {
    fetchProjectWorkspace(projectId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOwnerWebsite(projectId, { name: webName, url: webUrl, environment: webEnv });
      setShowWebModal(false);
      setWebName('');
      setWebUrl('');
      setActionNotice('Website linked successfully.');
      loadData();
    } catch (err: any) {
      alert(`Add website failed: ${err.message}`);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOwnerMilestone(projectId, { title: msTitle, description: msDesc });
      setShowMilestoneModal(false);
      setMsTitle('');
      setMsDesc('');
      setActionNotice('Milestone created.');
      loadData();
    } catch (err: any) {
      alert(`Add milestone failed: ${err.message}`);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addOwnerDocument(projectId, { title: docTitle, driveUrl: docUrl, category: docCat });
      setShowDocModal(false);
      setDocTitle('');
      setDocUrl('');
      setActionNotice('Drive document linked.');
      loadData();
    } catch (err: any) {
      alert(`Add document failed: ${err.message}`);
    }
  };

  const handleKickoffApproval = async () => {
    if (!window.confirm('Confirm Technical Kickoff for this client engagement? Project status will transition to ACTIVE.')) {
      return;
    }

    setKickoffSubmitting(true);
    try {
      await approveOwnerKickoff(projectId, kickoffNotes || 'Kickoff confirmed by Stephen.');
      setActionNotice('Technical Kickoff confirmed! Project is now ACTIVE.');
      loadData();
    } catch (err: any) {
      alert(`Kickoff approval failed: ${err.message}`);
    } finally {
      setKickoffSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={pageContainerStyle}>
        <div style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--muted-text)' }}>
          Loading admin workspace detail...
        </div>
      </div>
    );
  }

  const { project, websites, milestones, documents } = data;
  const isKickoffActive = project.status === 'ACTIVE';

  return (
    <div style={pageContainerStyle}>
      <main style={mainContentStyle}>
        <div style={contentInnerStyle}>
          {/* Breadcrumb */}
          <div style={breadcrumbRowStyle}>
            <a href="/admin/projects" style={breadcrumbLinkStyle}>
              <ArrowLeft size={14} />
              <span>Admin Workspace</span>
            </a>
            <span style={{ color: 'var(--muted-text)' }}>/</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{project.name}</span>
          </div>

          {actionNotice && (
            <div style={noticeBannerStyle}>
              <CheckCircle2 size={16} />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Header Card */}
          <div style={headerCardStyle}>
            <div>
              <div style={tagRowStyle}>
                <span style={badgeStyle}>
                  <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                  OWNER PROJECT CONTROL
                </span>
                <span style={statusBadgeStyle(project.status)}>{project.status}</span>
              </div>
              <h1 style={titleStyle}>{project.name}</h1>
              <p style={subtitleStyle}>{project.description || 'Client engagement management.'}</p>
            </div>

            {/* Kickoff Approval Button */}
            {!isKickoffActive ? (
              <div style={kickoffBoxStyle}>
                <button
                  onClick={handleKickoffApproval}
                  disabled={kickoffSubmitting}
                  style={kickoffBtnStyle}
                >
                  <Sparkles size={16} />
                  <span>{kickoffSubmitting ? 'Confirming...' : 'Approve Technical Kickoff'}</span>
                </button>
              </div>
            ) : (
              <div style={kickoffConfirmedBadgeStyle}>
                <CheckCircle2 size={16} />
                <span>Kickoff Active & Confirmed</span>
              </div>
            )}
          </div>

          {/* 3-Section Management Grid */}
          <div style={gridStyle}>
            {/* 1. Websites & Environments */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--primary-link)" />
                  <h3 style={cardTitleStyle}>Websites ({websites?.length || 0})</h3>
                </div>
                <button onClick={() => setShowWebModal(true)} style={addSmallBtnStyle}>
                  <Plus size={13} />
                  <span>Add URL</span>
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                {websites && websites.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {websites.map((w: any) => (
                      <div key={w.id} style={listItemStyle}>
                        <div>
                          <strong>{w.name}</strong>
                          <span style={envMiniPill(w.environment)}>{w.environment}</span>
                          <a href={w.url} target="_blank" rel="noopener noreferrer" style={urlLinkStyle}>
                            {w.url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={emptyTextStyle}>No website environments linked yet.</p>
                )}
              </div>
            </div>

            {/* 2. Milestones */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--primary-link)" />
                  <h3 style={cardTitleStyle}>Milestones ({milestones?.length || 0})</h3>
                </div>
                <button onClick={() => setShowMilestoneModal(true)} style={addSmallBtnStyle}>
                  <Plus size={13} />
                  <span>Add Milestone</span>
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                {milestones && milestones.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {milestones.map((m: any, idx: number) => (
                      <div key={m.id || idx} style={listItemStyle}>
                        <div>
                          <strong>{idx + 1}. {m.title}</strong>
                          <span style={milestoneStatusMiniPill(m.status)}>{m.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={emptyTextStyle}>No milestones configured.</p>
                )}
              </div>
            </div>

            {/* 3. Google Drive Documents */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--primary-link)" />
                  <h3 style={cardTitleStyle}>Drive Documents ({documents?.length || 0})</h3>
                </div>
                <button onClick={() => setShowDocModal(true)} style={addSmallBtnStyle}>
                  <Plus size={13} />
                  <span>Add Drive Link</span>
                </button>
              </div>

              <div style={{ padding: '1rem' }}>
                {documents && documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documents.map((d: any) => (
                      <div key={d.id} style={listItemStyle}>
                        <div>
                          <strong>{d.title}</strong>
                          <span style={categoryMiniPill}>{d.category}</span>
                          <a href={d.driveUrl} target="_blank" rel="noopener noreferrer" style={urlLinkStyle}>
                            Open in Drive
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={emptyTextStyle}>No Drive document links attached.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Website Modal */}
      {showWebModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Add Website URL</h3>
              <button onClick={() => setShowWebModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <form onSubmit={handleAddWebsite} style={{ padding: '1.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Environment Name</label>
                <input
                  type="text"
                  required
                  value={webName}
                  onChange={(e) => setWebName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Website URL</label>
                <input
                  type="url"
                  required
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Environment Type</label>
                <select value={webEnv} onChange={(e) => setWebEnv(e.target.value)} style={selectStyle}>
                  <option value="STAGING">STAGING</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                </select>
              </div>
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowWebModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={saveBtnStyle}>Save Website</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Add Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <form onSubmit={handleAddMilestone} style={{ padding: '1.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Milestone Title</label>
                <input
                  type="text"
                  required
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  style={textareaStyle}
                />
              </div>
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowMilestoneModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={saveBtnStyle}>Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Drive Document Modal */}
      {showDocModal && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Add Google Drive Document</h3>
              <button onClick={() => setShowDocModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <form onSubmit={handleAddDocument} style={{ padding: '1.5rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Google Drive URL (docs.google.com or drive.google.com)</label>
                <input
                  type="url"
                  required
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select value={docCat} onChange={(e) => setDocCat(e.target.value)} style={selectStyle}>
                  <option value="BRIEF">BRIEF</option>
                  <option value="SPECIFICATION">SPECIFICATION</option>
                  <option value="BRAND_GUIDELINES">BRAND_GUIDELINES</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowDocModal(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" style={saveBtnStyle}>Link Document</button>
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
  padding: '1.5rem 1.5rem 4rem 1.5rem',
};

const contentInnerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
};

const breadcrumbRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.8125rem',
  marginBottom: '1.25rem',
};

const breadcrumbLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--muted-text)',
  textDecoration: 'none',
};

const noticeBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  border: '1px solid #10B981',
  color: '#10B981',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '1.5rem',
};

const headerCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1.5rem',
  marginBottom: '1.5rem',
};

const tagRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '0.5rem',
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

const titleStyle: React.CSSProperties = {
  fontSize: '1.875rem',
  fontWeight: 700,
  color: 'var(--text)',
  margin: '0.25rem 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--muted-text)',
  margin: 0,
};

const kickoffBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const kickoffBtnStyle: React.CSSProperties = {
  backgroundColor: '#10B981',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.85rem 1.5rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const kickoffConfirmedBadgeStyle: React.CSSProperties = {
  backgroundColor: 'rgba(16, 185, 129, 0.15)',
  border: '1px solid #10B981',
  color: '#10B981',
  padding: '0.65rem 1.25rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: '1.5rem',
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

const addSmallBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-raised)',
  color: 'var(--primary-link)',
  border: '1px solid var(--border)',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

const listItemStyle: React.CSSProperties = {
  padding: '0.75rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
};

const envMiniPill = (env: string): React.CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  color: env === 'PRODUCTION' ? '#10B981' : '#3B82F6',
  backgroundColor: env === 'PRODUCTION' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
  padding: '1px 5px',
  borderRadius: '3px',
  marginLeft: '6px',
});

const milestoneStatusMiniPill = (status: string): React.CSSProperties => ({
  fontSize: '9px',
  fontWeight: 700,
  color: status === 'APPROVED' ? '#10B981' : '#F59E0B',
  backgroundColor: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
  padding: '1px 5px',
  borderRadius: '3px',
  marginLeft: '6px',
});

const categoryMiniPill: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  color: 'var(--muted-text)',
  backgroundColor: 'var(--surface)',
  padding: '1px 5px',
  borderRadius: '3px',
  marginLeft: '6px',
};

const urlLinkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--primary-link)',
  textDecoration: 'none',
  marginTop: '2px',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  margin: 0,
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
  maxWidth: '480px',
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
  marginBottom: '1rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'block',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem',
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem',
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

const saveBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  padding: '0.6rem 1.25rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
};
