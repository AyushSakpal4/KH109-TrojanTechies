import { useNavigate } from 'react-router-dom';
import { useZonesSummary } from '../../api/useCommandCenter';
import { useCommandCenterRealtime } from '../../hooks/useCommandCenterRealtime';
import { ZoneCard } from '../../components/command-center/ZoneCard';
import styles from '../../components/command-center/CommandCenter.module.css';

export function ZonesPage() {
  const navigate = useNavigate();
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
          <h1 className={styles.title}>Zone Control Board</h1>
          <p className={styles.subtitle}>Unified operational overview by relief zone with live severity and workload indicators.</p>
        </div>
        <div className={styles.filtersRow}>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={() => navigate('/escalations')}>
            View Escalations
          </button>
          <button className={styles.button} onClick={() => navigate('/map')}>
            Deployment Map
          </button>
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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.skeleton}`} style={{ height: 240 }} />
          ))}
        </div>
      )}

      {error && (
        <div className={styles.card} style={{ color: 'var(--color-danger)' }}>
          Failed to load zone summary: {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <div className={styles.grid}>
          {zones.map((zone) => (
            <ZoneCard
              key={zone.zone_id || zone.id || zone.zone_name}
              zone={zone}
              onClick={() => navigate(`/zones/${zone.zone_id || zone.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
