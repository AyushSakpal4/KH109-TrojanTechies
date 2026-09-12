import { useServerStats } from '../api/hooks';
import styles from './ServerMonitor.module.css';

function formatUptime(seconds) {
    if (!seconds) return '—';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function getStatusColor(percent) {
    if (percent < 60) return 'green';
    if (percent < 85) return 'amber';
    return 'red';
}

function GaugeCard({ icon, label, value, unit, percent, detail }) {
    const color = getStatusColor(percent ?? 0);
    return (
        <div className={styles.gaugeCard}>
            <div className={styles.gaugeHeader}>
                <div className={`${styles.gaugeIcon} ${styles[`gauge_${color}`]}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
                </div>
                <div className={styles.gaugeInfo}>
                    <span className={styles.gaugeLabel}>{label}</span>
                    <span className={styles.gaugeValue}>
                        {value ?? '—'}<span className={styles.gaugeUnit}>{unit}</span>
                    </span>
                </div>
            </div>
            {percent != null && (
                <div className={styles.progressWrap}>
                    <div className={styles.progressTrack}>
                        <div
                            className={`${styles.progressFill} ${styles[`fill_${color}`]}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                    </div>
                    <span className={`${styles.progressLabel} ${styles[`text_${color}`]}`}>{percent}%</span>
                </div>
            )}
            {detail && <p className={styles.gaugeDetail}>{detail}</p>}
        </div>
    );
}

export function ServerMonitor() {
    const { data: stats, isLoading, error } = useServerStats();

    if (isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.title}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#34b27b' }}>monitor_heart</span>
                        Server Monitor
                    </h1>
                    <p className={styles.subtitle}>Loading server telemetry…</p>
                </div>
                <div className={styles.skeletonGrid}>
                    {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.title}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ef4444' }}>error</span>
                        Server Monitor
                    </h1>
                </div>
                <div className={styles.errorCard}>
                    <p>Failed to load server stats: {error.message}</p>
                </div>
            </div>
        );
    }

    const { cpu, memory, process: proc, system, db, timestamp } = stats || {};

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#34b27b' }}>monitor_heart</span>
                        Server Monitor
                    </h1>
                    <p className={styles.subtitle}>
                        Live system telemetry · Refreshes every 5s
                    </p>
                </div>
                <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    <span>LIVE</span>
                </div>
            </div>

            {/* Main Gauges */}
            <div className={styles.gaugeGrid}>
                <GaugeCard
                    icon="memory"
                    label="CPU Usage"
                    value={cpu?.usagePercent}
                    unit="%"
                    percent={cpu?.usagePercent}
                    detail={`${cpu?.count} cores · ${cpu?.model?.split(' ').slice(0, 3).join(' ')}`}
                />
                <GaugeCard
                    icon="storage"
                    label="Memory"
                    value={memory?.usedMB}
                    unit=" MB"
                    percent={memory?.usagePercent}
                    detail={`${memory?.usedMB} / ${memory?.totalMB} MB`}
                />
                <GaugeCard
                    icon="code"
                    label="Node.js Heap"
                    value={proc?.heapUsedMB}
                    unit=" MB"
                    percent={proc?.heapTotalMB ? Math.round((proc.heapUsedMB / proc.heapTotalMB) * 100) : 0}
                    detail={`${proc?.heapUsedMB} / ${proc?.heapTotalMB} MB heap · ${proc?.rssMB} MB RSS`}
                />
                <GaugeCard
                    icon="schedule"
                    label="System Uptime"
                    value={formatUptime(system?.uptimeSeconds)}
                    unit=""
                    detail={`Process: ${formatUptime(proc?.uptimeSeconds)} · ${system?.platform} ${system?.arch}`}
                />
            </div>

            {/* Info Cards */}
            <div className={styles.infoGrid}>
                {/* Database */}
                <div className={styles.infoCard}>
                    <div className={styles.infoHeader}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>database</span>
                        <h3>Database</h3>
                    </div>
                    <div className={styles.infoBody}>
                        <div className={styles.infoRow}>
                            <span>Status</span>
                            <span className={`${styles.statusPill} ${db?.connected ? styles.statusGreen : styles.statusRed}`}>
                                {db?.connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Total Users</span>
                            <strong>{db?.totalUsers ?? '—'}</strong>
                        </div>
                        {db?.error && (
                            <div className={styles.infoRow}>
                                <span>Error</span>
                                <span className={styles.errorText}>{db.error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Info */}
                <div className={styles.infoCard}>
                    <div className={styles.infoHeader}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>computer</span>
                        <h3>System</h3>
                    </div>
                    <div className={styles.infoBody}>
                        <div className={styles.infoRow}>
                            <span>Platform</span>
                            <strong>{system?.platform} ({system?.arch})</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Hostname</span>
                            <strong>{system?.hostname ?? '—'}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Node.js</span>
                            <strong>{system?.nodeVersion ?? '—'}</strong>
                        </div>
                    </div>
                </div>

                {/* CPU Load */}
                <div className={styles.infoCard}>
                    <div className={styles.infoHeader}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>trending_up</span>
                        <h3>CPU Load Average</h3>
                    </div>
                    <div className={styles.infoBody}>
                        <div className={styles.infoRow}>
                            <span>1 min</span>
                            <strong>{cpu?.loadAvg?.['1m'] ?? '—'}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>5 min</span>
                            <strong>{cpu?.loadAvg?.['5m'] ?? '—'}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>15 min</span>
                            <strong>{cpu?.loadAvg?.['15m'] ?? '—'}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <p className={styles.timestamp}>
                Last updated: {timestamp ? new Date(timestamp).toLocaleTimeString('en-IN') : '—'}
            </p>
        </div>
    );
}
