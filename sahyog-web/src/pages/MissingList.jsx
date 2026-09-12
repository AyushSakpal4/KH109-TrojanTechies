import { useState } from 'react';
import { useMissingList, useMarkFound } from '../api/hooks';
import styles from './DataList.module.css';

const filters = ['All', 'missing', 'found'];

function StatusBadge({ status }) {
  const variant = status === 'found' ? 'found' : status === 'missing' ? 'missing' : 'muted';
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{status ?? 'unknown'}</span>;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MissingList() {
  const { data: list, isLoading, error } = useMissingList();
  const markFound = useMarkFound();
  const [activeFilter, setActiveFilter] = useState('All');

  if (isLoading) return <div className={styles.loading}>Loading missing persons…</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;

  const allRows = Array.isArray(list) ? list : [];
  const rows = activeFilter === 'All' ? allRows : allRows.filter(r => r.status === activeFilter);
  const missingCount = allRows.filter(r => r.status === 'missing').length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ef4444' }}>person_search</span>
            Missing Persons
          </h1>
          <p className={styles.subtitle}>{missingCount} currently missing · {allRows.length} total reports</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        {filters.map(f => (
          <button
            key={f}
            className={`${styles.filterPill} ${activeFilter === f ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'All' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Status</th>
              <th>Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3 }}>person_off</span>
                    <p className={styles.emptyText}>No missing person reports found</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: row.status === 'found' ? '#16a34a' : '#ef4444' }}>
                        {row.status === 'found' ? 'check_circle' : 'warning'}
                      </span>
                      {row.name}
                    </span>
                  </td>
                  <td>{row.age ?? '—'}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td className={styles.timeCell}>{formatTime(row.created_at)}</td>
                  <td>
                    {row.status === 'missing' && (
                      <button
                        className={`${styles.actionSmall} ${styles.actionSuccess}`}
                        onClick={() => markFound.mutate(row.id)}
                        disabled={markFound.isPending}
                        title="Mark as found"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        <span style={{ fontSize: 11 }}>Mark Found</span>
                      </button>
                    )}
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
