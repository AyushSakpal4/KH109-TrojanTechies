import { useState } from 'react';
import { useOrgLogs } from '../../api/useLogs';
import s from './Org.module.css';

const ACTION_STYLE = {
  INFO:    { bg: '#e0f2fe', fg: '#0369a1', icon: 'info', label: 'Info' },
  SUCCESS: { bg: '#dcfce7', fg: '#15803d', icon: 'check_circle', label: 'Success' },
  WARNING: { bg: '#fef3c7', fg: '#92400e', icon: 'warning', label: 'Warning' },
  DANGER:  { bg: '#fee2e2', fg: '#b91c1c', icon: 'error', label: 'Danger' },
};

const ENTITY_STYLE = {
  ZONE:         { bg: '#ede9fe', fg: '#6d28d9', icon: 'map' },
  AGENT:        { bg: '#fce7f3', fg: '#be185d', icon: 'smart_toy' },
  ORGANIZATION: { bg: '#d1fae5', fg: '#065f46', icon: 'apartment' },
  SYSTEM:       { bg: '#f1f5f9', fg: '#475569', icon: 'settings' },
};

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function formatRelative(d) {
  if (!d) return '';
  const now = new Date();
  const then = new Date(d);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function OrgActivityLog() {
  const { data: logs = [], isLoading, error } = useOrgLogs();
  const [filter, setFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');

  const filtered = logs.filter(log => {
    if (filter !== 'ALL' && log.action_type !== filter) return false;
    if (searchText && !log.description.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 className={s.pageTitleSm} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>history</span>
          Activity Log
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 6 }}>
            ({filtered.length})
          </span>
        </h2>
        <p className={s.pageDesc}>
          Timeline of actions performed by your organization and requests received from the admin.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--color-text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search your logs..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 38px', borderRadius: 10, border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: 13,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'INFO', 'SUCCESS', 'WARNING', 'DANGER'].map(type => {
            const isActive = filter === type;
            const style_obj = type === 'ALL' ? { bg: '#f1f5f9', fg: '#475569' } : ACTION_STYLE[type];
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: isActive ? `2px solid ${style_obj.fg}` : '1px solid var(--color-border)',
                  background: isActive ? style_obj.bg : 'var(--color-surface)', color: style_obj.fg,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {type === 'ALL' ? 'All' : ACTION_STYLE[type].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12, display: 'block', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          Loading activity log...
        </div>
      )}

      {error && (
        <div style={{ padding: 24, background: '#fee2e2', borderRadius: 12, color: '#b91c1c', textAlign: 'center' }}>
          Failed to load activity log: {error.message}
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12, display: 'block', opacity: 0.4 }}>event_note</span>
          <p style={{ fontSize: 15, fontWeight: 600 }}>No activity yet</p>
          <p style={{ fontSize: 13 }}>Your organization's activities will appear here.</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && !error && filtered.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--color-border)', borderRadius: 1 }} />

          {filtered.map((log) => {
            const actionStyle = ACTION_STYLE[log.action_type] || ACTION_STYLE.INFO;
            const entityStyle = ENTITY_STYLE[log.entity_type] || ENTITY_STYLE.SYSTEM;
            return (
              <div key={log.id} style={{ display: 'flex', gap: 16, marginBottom: 4, position: 'relative', paddingLeft: 48 }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: 14, top: 18, width: 14, height: 14, borderRadius: '50%',
                  background: actionStyle.fg, border: '3px solid var(--color-bg)', zIndex: 2,
                  boxShadow: `0 0 0 2px ${actionStyle.fg}30`,
                }} />

                {/* Card */}
                <div style={{
                  flex: 1, padding: '14px 18px', borderRadius: 12,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  transition: 'all 0.15s', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: actionStyle.bg, color: actionStyle.fg,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{actionStyle.icon}</span>
                        {actionStyle.label}
                      </span>

                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: entityStyle.bg, color: entityStyle.fg,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{entityStyle.icon}</span>
                        {log.entity_type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{formatRelative(log.created_at)}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.7 }}>{formatDate(log.created_at)}</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                    {log.description}
                  </p>

                  {log.user_name && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                      By: {log.user_name}
                    </div>
                  )}

                  {log.metadata && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace', maxHeight: 100, overflowY: 'auto' }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
