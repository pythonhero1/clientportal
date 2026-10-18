import { getActivePersona, setActivePersona } from '../services/projects-api';
import { UserCheck, ShieldCheck, Layers } from 'lucide-react';

export const DevPersonaSwitcher: React.FC = () => {
  const current = getActivePersona();

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <div style={badgeStyle}>
          <Layers size={14} style={{ marginRight: '4px' }} />
          <span>DEV PERSONA:</span>
          <strong>{current.name}</strong>
          <span style={roleBadgeStyle(current.role)}>{current.role}</span>
        </div>

        <div style={switcherButtonsStyle}>
          <button
            onClick={() => setActivePersona('owner')}
            style={btnStyle(current.id === 'owner')}
            title="Switch to Stephen (Owner)"
          >
            <ShieldCheck size={13} style={{ marginRight: '3px' }} />
            Stephen (Owner)
          </button>

          <button
            onClick={() => setActivePersona('client_a')}
            style={btnStyle(current.id === 'client_a')}
            title="Switch to Client A (Project 1)"
          >
            <UserCheck size={13} style={{ marginRight: '3px' }} />
            Client A (Proj 1)
          </button>

          <button
            onClick={() => setActivePersona('client_b')}
            style={btnStyle(current.id === 'client_b')}
            title="Switch to Client B (Proj 2)"
          >
            Client B (Proj 2)
          </button>

          <button
            onClick={() => setActivePersona('client_c')}
            style={btnStyle(current.id === 'client_c')}
            title="Switch to Client C (No Active Project - Screen 18)"
          >
            Client C (No Project)
          </button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#0F172A',
  borderBottom: '1px solid #1E293B',
  padding: '6px 16px',
  color: '#F8FAFC',
  fontSize: '12px',
  position: 'sticky',
  top: 0,
  zIndex: 9999,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

const innerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1280px',
  margin: '0 auto',
  flexWrap: 'wrap',
  gap: '8px',
};

const badgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const roleBadgeStyle = (role: string): React.CSSProperties => ({
  backgroundColor: role === 'Owner' ? '#4F46E5' : '#059669',
  color: '#FFFFFF',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const switcherButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const btnStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? '#2563EB' : '#1E293B',
  color: active ? '#FFFFFF' : '#94A3B8',
  border: active ? '1px solid #3B82F6' : '1px solid #334155',
  borderRadius: '4px',
  padding: '3px 8px',
  fontSize: '11px',
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  transition: 'all 0.15s ease',
});
