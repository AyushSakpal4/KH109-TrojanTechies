import { useCoordinatorMetrics } from '../../api/useCommandCenter';
import { CoordinatorStats } from '../../components/command-center/CoordinatorStats';
import styles from '../../components/command-center/CommandCenter.module.css';

export function CoordinatorAnalyticsPage() {
  const { data, isLoading, error } = useCoordinatorMetrics();
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Coordinator Performance Dashboard</h1>
          <p className={styles.subtitle}>Per-coordinator output, response quality and SLA compliance.</p>
        </div>
      </div>

      {isLoading && <div className={`${styles.card} ${styles.skeleton}`} style={{ height: 300 }} />}
      {error && <div className={styles.card} style={{ color: 'var(--color-danger)' }}>{error.message}</div>}
      {!isLoading && !error && <CoordinatorStats rows={rows} />}
    </div>
  );
}
