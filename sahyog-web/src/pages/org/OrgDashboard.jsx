import { useOrgStats, useOrgProfile } from '../../api/useOrg';
import s from './Org.module.css';

export function OrgDashboard() {
  const { data: stats, isLoading } = useOrgStats();
  const { data: org } = useOrgProfile();

  const cards = [
    { label: 'Volunteers', value: stats?.totalVolunteers ?? '—', icon: 'group', color: '#34b27b' },
    { label: 'Resources', value: stats?.totalResources ?? '—', icon: 'inventory_2', color: '#10b981' },
    { label: 'Active Tasks', value: stats?.activeTasks ?? '—', icon: 'task_alt', color: '#f59e0b' },
    { label: 'Completed Tasks', value: stats?.completedTasks ?? '—', icon: 'check_circle', color: '#22c55e' },
    { label: 'Total Tasks', value: stats?.totalTasks ?? '—', icon: 'assignment', color: '#8b5cf6' },
    { label: 'Active Disasters', value: stats?.activeDisasters ?? '—', icon: 'warning', color: '#ef4444' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className={s.pageTitle}>
          {org?.name || 'Organization'} Dashboard
        </h1>
        <p className={s.pageDesc}>
          Operational overview of your organization's disaster relief efforts.
        </p>
      </div>

      {isLoading ? (
        <p className={s.loadingText}>Loading stats...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {cards.map(c => (
            <div key={c.label} className={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: c.color }}>{c.icon}</span>
                </div>
                <span className={s.cardLabel}>{c.label}</span>
              </div>
              <span className={s.cardValue}>{c.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginTop: 36 }}>
        <h3 className={s.sectionTitle}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Add Volunteer', icon: 'person_add', href: '/org/volunteers', color: '#34b27b' },
            { label: 'Add Resource', icon: 'add_box', href: '/org/resources', color: '#34b27b' },
            { label: 'View Tasks', icon: 'assignment', href: '/org/tasks', color: '#34b27b' },
          ].map(a => (
            <a key={a.label} href={a.href} className={s.actionBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: a.color }}>{a.icon}</span>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
