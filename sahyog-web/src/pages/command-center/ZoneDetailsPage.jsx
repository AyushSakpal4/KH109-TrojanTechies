import { Link, useParams } from 'react-router-dom';
import { useZonesSummary, useEscalatedTasks } from '../../api/useCommandCenter';
import { ZoneCard } from '../../components/command-center/ZoneCard';
import { EscalationTable } from '../../components/command-center/EscalationTable';
import styles from '../../components/command-center/CommandCenter.module.css';

export function ZoneDetailsPage() {
  const { id } = useParams();
  const { data: zonesData, isLoading, error } = useZonesSummary();
  const zone = (Array.isArray(zonesData) ? zonesData : []).find(
    (z) => String(z.zone_id || z.id) === String(id),
  );

  const { data: escalatedData } = useEscalatedTasks({ zone: id, sort: 'delay_desc' });
  const escalated = Array.isArray(escalatedData) ? escalatedData : [];

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Zone Details</h1>
          <p className={styles.subtitle}>Detailed command metrics for selected zone.</p>
        </div>
        <Link className={styles.button} to="/zones">Back to Zones</Link>
      </div>

      {isLoading && <div className={`${styles.card} ${styles.skeleton}`} style={{ height: 230 }} />}
      {error && <div className={styles.card} style={{ color: 'var(--color-danger)' }}>{error.message}</div>}
      {!isLoading && !error && !zone && <div className={styles.card}>Zone not found.</div>}

      {zone && (
        <>
          <ZoneCard zone={zone} />
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Escalated Tasks in This Zone</h3>
            <div style={{ marginTop: 10 }}>
              <EscalationTable rows={escalated} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
