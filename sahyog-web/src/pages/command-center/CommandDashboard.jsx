import { Link } from 'react-router-dom';
import { useZonesSummary } from '../../api/useCommandCenter';
import { useCommandCenterRealtime } from '../../hooks/useCommandCenterRealtime';
import { resolveSeverityScore, severityBand } from '../../hooks/useSeverityScore';
import { SeverityBadge } from '../../components/command-center/SeverityBadge';
import styles from '../../components/command-center/CommandCenter.module.css';

function ZoneSeverityRow({ zone }) {
  const score = resolveSeverityScore(zone);
  const band = severityBand(score);
  const fillClass =
    band.color === 'green'
      ? styles.fillGreen
      : band.color === 'yellow'
        ? styles.fillYellow
        : styles.fillRed;
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className={styles.card}>
      <div className={styles.cardTitleRow}>
        <div>
          <h3 className={styles.cardTitle}>{zone.zone_name || zone.name || 'Unknown Zone'}</h3>
          <p className={styles.subtitle} style={{ marginTop: 2 }}>
            Needs: {zone.active_needs_count ?? zone.active_needs ?? 0} · Avg delay: {zone.avg_delay_minutes ?? 0}m
          </p>
        </div>
        <SeverityBadge score={score} />
      </div>
      <div className={styles.severityBarTrack}>
        <div className={`${styles.severityBarFill} ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.cardTitleRow} style={{ marginTop: 8, marginBottom: 0 }}>
        <span className={styles.statLabel}>Severity Formula</span>
        <code>{score.toFixed(2)}</code>
      </div>
    </div>
  );
}

export function CommandDashboard() {
  useCommandCenterRealtime(true);
  const { data, isLoading, error } = useZonesSummary();
  const zones = Array.isArray(data) ? data : [];

  const totals = zones.reduce(
    (acc, zone) => {
      acc.zones += 1;
      acc.activeNeeds += Number(zone.active_needs_count ?? zone.active_needs ?? 0);
      acc.escalated += Number(zone.escalated_tasks_count ?? zone.escalated_tasks ?? 0);
      acc.activeVolunteers += Number(zone.active_volunteers_count ?? zone.active_volunteers ?? 0);
      return acc;
    },
    { zones: 0, activeNeeds: 0, escalated: 0, activeVolunteers: 0 },
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Disaster Command Dashboard</h1>
          <p className={styles.subtitle}>Live severity index and zone command health.</p>
        </div>
        <div className={styles.filtersRow}>
          <Link className={`${styles.button} ${styles.primaryButton}`} to="/zones">Open Zone Control Board</Link>
          <Link className={styles.button} to="/escalations">View Escalations</Link>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Total Zones</span><div className={styles.kpiValue}>{totals.zones}</div></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Active Needs</span><div className={styles.kpiValue}>{totals.activeNeeds}</div></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Escalated Tasks</span><div className={styles.kpiValue}>{totals.escalated}</div></div>
        <div className={styles.kpiCard}><span className={styles.kpiLabel}>Active Volunteers</span><div className={styles.kpiValue}>{totals.activeVolunteers}</div></div>
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${styles.skeleton} ${styles.card}`} style={{ height: 132 }} />
          ))}
        </div>
      )}

      {error && (
        <div className={styles.card} style={{ color: 'var(--color-danger)' }}>
          Failed to load zones summary: {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <div className={styles.grid}>
          {zones.map((zone) => (
            <ZoneSeverityRow key={zone.zone_id || zone.id || zone.zone_name} zone={zone} />
          ))}
        </div>
      )}
    </div>
  );
}
