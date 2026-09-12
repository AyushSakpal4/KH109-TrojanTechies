import { SeverityBadge } from './SeverityBadge';
import styles from './CommandCenter.module.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EscalationTable({ rows = [] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Zone</th>
            <th>Volunteer</th>
            <th>Delay (min)</th>
            <th>Status</th>
            <th>Assigned At</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '18px' }}>
                No escalated tasks found.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.task_id || row.id}>
                <td>{row.task_id || row.id || '—'}</td>
                <td>{row.zone_name || row.zone || '—'}</td>
                <td>{row.volunteer_name || row.volunteer || 'Unassigned'}</td>
                <td>{row.delay_minutes ?? row.delay ?? 0}</td>
                <td>
                  <SeverityBadge
                    score={
                      Number(row.delay_minutes ?? row.delay ?? 0) > 60
                        ? 70
                        : Number(row.delay_minutes ?? row.delay ?? 0) > 30
                          ? 45
                          : 25
                    }
                  />
                </td>
                <td>{formatDate(row.assigned_at)}</td>
                <td>{row.escalation_reason || row.reason || 'SLA breach'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
