import { useState } from 'react';
import { useOrgTasks } from '../../api/useOrg';
import s from './Org.module.css';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Completed', value: 'completed' },
];

export function OrgTasks() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: tasks = [], isLoading } = useOrgTasks(statusFilter || undefined);

  const statusColor = { pending: '#f59e0b', accepted: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className={s.pageTitleSm}>Task Monitoring</h1>
        <p className={s.pageDesc}>Monitor tasks assigned to your organization's volunteers.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={statusFilter === f.value ? s.filterBtnActive : s.filterBtn}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className={s.loadingText}>Loading...</p>
      ) : tasks.length === 0 ? (
        <div className={s.empty}>
          <span className={`material-symbols-outlined ${s.emptyIcon}`}>assignment</span>
          <p className={s.emptyText}>No tasks found</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className={s.tableHead}>
                {['Title', 'Volunteer', 'Zone', 'Disaster', 'Status', 'Created'].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className={s.tr}>
                  <td className={s.td}>
                    <span className={s.tdBold}>{t.title}</span>
                    {t.description && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{t.description.slice(0, 60)}</p>}
                  </td>
                  <td className={s.td}>{t.volunteer_name || '—'}</td>
                  <td className={s.td}>{t.zone_name || '—'}</td>
                  <td className={s.td}>{t.disaster_name || '—'}</td>
                  <td className={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: `${statusColor[t.status] || '#94a3b8'}20`, color: statusColor[t.status] || '#64748b' }}>
                      {t.status}
                    </span>
                  </td>
                  <td className={s.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
