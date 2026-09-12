import { severityBand } from '../../hooks/useSeverityScore';
import styles from './CommandCenter.module.css';

export function SeverityBadge({ score }) {
  const band = severityBand(score);

  const className =
    band.color === 'green'
      ? styles.badgeGreen
      : band.color === 'yellow'
        ? styles.badgeYellow
        : styles.badgeRed;

  return (
    <span className={`${styles.severityBadge} ${className}`}>
      {band.label} · {Number(score || 0).toFixed(1)}
    </span>
  );
}
