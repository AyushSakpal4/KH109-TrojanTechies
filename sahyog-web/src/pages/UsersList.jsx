import { useState } from 'react';
import { useUsersList, useUpdateUserRole } from '../api/hooks';
import styles from './DataList.module.css';

const roleOptions = [
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'admin', label: 'Admin' },
];

const roleBadgeMap = {
    admin: 'danger',
    coordinator: 'warning',
    volunteer: 'info',
    organization: 'primary',
};

function RoleBadge({ role }) {
    const variant = roleBadgeMap[role] || 'muted';
    return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{role}</span>;
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function UsersList() {
    const { data: list, isLoading, error } = useUsersList();
    const updateRole = useUpdateUserRole();
    const [filter, setFilter] = useState('All');

    if (isLoading) return <div className={styles.loading}>Loading users…</div>;
    if (error) return <div className={styles.error}>Error: {error.message}</div>;

    const allRows = (Array.isArray(list) ? list : []).filter(r => r.role !== 'organization');
    const rows = filter === 'All' ? allRows : allRows.filter(r => r.role === filter);

    const roleToOrg = {
        volunteer: 'volunteer',
        coordinator: 'coordinator',
        admin: 'admin',
        organization: 'organization'
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                    <h1 className={styles.title}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#34b27b' }}>admin_panel_settings</span>
                        User Management
                    </h1>
                    <p className={styles.subtitle}>{allRows.length} registered users</p>
                </div>
            </div>

            <div className={styles.filterRow}>
                {['All', 'admin', 'coordinator', 'volunteer'].map(f => (
                    <button
                        key={f}
                        className={`${styles.filterPill} ${filter === f ? styles.filterPillActive : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'All' ? 'All' : f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Last Updated</th>
                            <th>Change Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className={styles.emptyState}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3 }}>group_off</span>
                                        <p className={styles.emptyText}>No users found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            rows.map(row => (
                                <tr key={row.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                {row.full_name || '—'}
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                {row.email || row.clerk_user_id?.slice(0, 16) + '…'}
                                            </span>
                                        </div>
                                    </td>
                                    <td><RoleBadge role={row.role} /></td>
                                    <td className={styles.timeCell}>{formatTime(row.created_at)}</td>
                                    <td className={styles.timeCell}>{formatTime(row.updated_at)}</td>
                                    <td>
                                        <select
                                            value={roleToOrg[row.role] || 'volunteer'}
                                            onChange={(e) => updateRole.mutate({ uid: row.clerk_user_id, role: e.target.value })}
                                            disabled={updateRole.isPending}
                                            className={styles.select}
                                        >
                                            {roleOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
