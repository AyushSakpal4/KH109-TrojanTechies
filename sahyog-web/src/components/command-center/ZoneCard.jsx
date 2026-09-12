import { resolveSeverityScore, severityBand } from '../../hooks/useSeverityScore';
import { SeverityBadge } from './SeverityBadge';
import styles from './CommandCenter.module.css';

export function ZoneCard({ zone, onClick }) {
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
    <article className={`${styles.card} ${onClick ? styles.clickableCard : ''}`} onClick={onClick}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>{zone.zone_name || zone.name || 'Unknown Zone'}</h3>
        <SeverityBadge score={score} />
      </div>

      <div className={styles.statsList}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Active Needs</span>
          <span className={styles.statValue}>{zone.active_needs_count ?? zone.active_needs ?? 0}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Unassigned</span>
          <span className={styles.statValue}>{zone.unassigned_needs_count ?? zone.unassigned_needs ?? 0}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Active Volunteers</span>
          <span className={styles.statValue}>{zone.active_volunteers_count ?? zone.active_volunteers ?? 0}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Escalated Tasks</span>
          <span className={styles.statValue}>{zone.escalated_tasks_count ?? zone.escalated_tasks ?? 0}</span>
        </div>
      </div>

      <div className={styles.severityBarWrap}>
        <div className={styles.cardTitleRow} style={{ marginBottom: 6 }}>
          <span className={styles.statLabel}>Severity Index</span>
          <span className={styles.statValue}>{score.toFixed(2)}</span>
        </div>
        <div className={styles.severityBarTrack}>
          <div className={`${styles.severityBarFill} ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={styles.cardTitleRow} style={{ marginTop: 10, marginBottom: 0 }}>
        <span className={styles.statLabel}>Avg Response Time</span>
        <span className={styles.statValue}>{zone.avg_response_time_minutes ?? zone.avg_response_time ?? 0} min</span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className={styles.button}
          style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '5px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--color-surface, #ffffff)',
            color: 'var(--color-primary, #34b27b)',
            border: '1px solid var(--color-border, #e2e8f0)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <span>Open Zone</span>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
        </button>
      </div>
    </article>
  );
}
