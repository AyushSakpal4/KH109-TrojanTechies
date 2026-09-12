import styles from './CommandCenter.module.css';

function pct(value) {
  const n = Number(value) || 0;
  return `${n.toFixed(1)}%`;
}

export function CoordinatorStats({ rows = [] }) {
  const maxResolved = Math.max(
    1,
    ...rows.map((r) => Number(r.total_resolved_tasks ?? r.resolved_tasks ?? 0)),
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Coordinator</th>
            <th>Active Zones</th>
            <th>Active Tasks</th>
            <th>Avg Response (min)</th>
            <th>Total Resolved</th>
            <th>Escalation Rate</th>
            <th>SLA Compliance</th>
            <th>Completed Chart</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '18px' }}>
                No coordinator metrics available.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const resolved = Number(row.total_resolved_tasks ?? row.resolved_tasks ?? 0);
              const barWidth = Math.max(6, (resolved / maxResolved) * 100);
              return (
                <tr key={row.coordinator_id || row.id || row.coordinator_name}>
                  <td>{row.coordinator_name || row.name || '—'}</td>
                  <td>{row.active_zones ?? 0}</td>
                  <td>{row.active_tasks ?? 0}</td>
                  <td>{Number(row.avg_response_time ?? 0).toFixed(1)}</td>
                  <td>{resolved}</td>
                  <td>{pct(row.escalation_rate_pct ?? row.escalation_rate ?? 0)}</td>
                  <td>{pct(row.sla_compliance_pct ?? row.sla_compliance ?? 0)}</td>
                  <td style={{ minWidth: 140 }}>
                    <div className={styles.severityBarTrack}>
                      <div
                        className={styles.severityBarFill}
                        style={{ width: `${barWidth}%`, background: '#3b82f6' }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
