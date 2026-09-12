import { useMemo, useState } from 'react';
import { useEscalatedTasks } from '../../api/useCommandCenter';
import { EscalationTable } from '../../components/command-center/EscalationTable';
import styles from '../../components/command-center/CommandCenter.module.css';

export function EscalationsPage() {
  const [zone, setZone] = useState('');
  const [coordinator, setCoordinator] = useState('');

  const { data, isLoading, error } = useEscalatedTasks({
    zone: zone || undefined,
    coordinator: coordinator || undefined,
    sort: 'delay_desc',
  });

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort(
      (a, b) => Number(b.delay_minutes ?? b.delay ?? 0) - Number(a.delay_minutes ?? a.delay ?? 0),
    );
  }, [data]);

  const zoneOptions = [...new Set(rows.map((r) => r.zone || r.zone_name).filter(Boolean))];
  const coordinatorOptions = [...new Set(rows.map((r) => r.coordinator || r.coordinator_name).filter(Boolean))];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Escalation Monitor Panel</h1>
          <p className={styles.subtitle}>Monitor delayed or blocked tasks sorted by delay.</p>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <select className={styles.select} value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="">All Zones</option>
          {zoneOptions.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        <select className={styles.select} value={coordinator} onChange={(e) => setCoordinator(e.target.value)}>
          <option value="">All Coordinators</option>
          {coordinatorOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className={`${styles.card} ${styles.skeleton}`} style={{ height: 260 }} />}
      {error && <div className={styles.card} style={{ color: 'var(--color-danger)' }}>{error.message}</div>}
      {!isLoading && !error && <EscalationTable rows={rows} />}
    </div>
  );
}
