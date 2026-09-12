import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import io from 'socket.io-client';
import styles from './UnifiedOrchestratorDashboard.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function useOrchestratorSummary() {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['orchestrator-summary'],
        queryFn: async () => {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/v1/orchestrator/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch summary');
            return res.json();
        },
        refetchInterval: 10000,
    });
}

// ── Source Badge ──────────────────────────────────────────────
function SourceBadge({ source }) {
    const map = {
        app: { label: 'App', cls: styles.sourceApp },
        direct: { label: 'Direct', cls: styles.sourceDirect },
        mesh_relay: { label: 'Mesh Relay', cls: styles.sourceMesh },
        mesh: { label: 'Mesh', cls: styles.sourceMesh },
        beacon: { label: 'Beacon', cls: styles.sourceBeacon },
        ivr: { label: 'IVR', cls: styles.sourceIvr },
    };
    const m = map[source] || { label: source || '?', cls: styles.sourceApp };
    return <span className={`${styles.sourceChip} ${m.cls}`}>{m.label}</span>;
}

// ── Risk Level Badge ─────────────────────────────────────────
function RiskBadge({ level }) {
    const map = {
        critical: { cls: styles.riskCritical, label: 'Critical' },
        high: { cls: styles.riskHigh, label: 'High' },
        medium: { cls: styles.riskMedium, label: 'Medium' },
        low: { cls: styles.riskLow, label: 'Low' },
        pending: { cls: styles.riskPending, label: 'Pending' },
    };
    const m = map[level] || map.pending;
    return <span className={`${styles.riskBadge} ${m.cls}`}>{m.label}</span>;
}

// ── Format Time ──────────────────────────────────────────────
function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

// ── Main Dashboard ───────────────────────────────────────────
export function UnifiedOrchestratorDashboard() {
    const { data: summary, isLoading, error } = useOrchestratorSummary();
    const [liveSignals, setLiveSignals] = useState([]);

    // Socket.io for real-time updates
    useEffect(() => {
        const socketUrl = API_BASE || window.location.origin;
        const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

        socket.on('orchestrator:update', (payload) => {
            setLiveSignals(prev => {
                const updated = [payload, ...prev.filter(s => s.id !== payload.id)];
                return updated.slice(0, 100); // Keep last 100
            });
        });

        return () => socket.disconnect();
    }, []);

    if (isLoading) return <div className={styles.loading}>Loading Orchestrator Dashboard…</div>;
    if (error) return <div className={styles.error}>Error: {error.message}</div>;

    const {
        total_active = 0,
        by_severity = {},
        by_source = {},
        recent_signals = [],
    } = summary || {};

    // Merge real-time signals with historical
    const allSignals = [...liveSignals];
    for (const sig of recent_signals) {
        if (!allSignals.find(s => s.id === sig.id)) {
            allSignals.push(sig);
        }
    }
    allSignals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className={styles.orchestratorPage}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#6366f1' }}>cell_tower</span>
                        Distress Signal Orchestrator
                    </h1>
                    <p>Unified National Emergency Communication — PS8</p>
                </div>
                <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    LIVE
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
                    <div className={styles.cardLabel}>Total Active</div>
                    <div className={styles.cardValue}>{total_active}</div>
                    <div className={styles.cardSubtext}>Across all channels</div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardCritical}`}>
                    <div className={styles.cardLabel}>Critical</div>
                    <div className={styles.cardValue}>{by_severity.critical || 0}</div>
                    <div className={styles.cardSubtext}>National escalation</div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardHigh}`}>
                    <div className={styles.cardLabel}>High</div>
                    <div className={styles.cardValue}>{by_severity.high || 0}</div>
                    <div className={styles.cardSubtext}>Emergency services</div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardMedium}`}>
                    <div className={styles.cardLabel}>Medium</div>
                    <div className={styles.cardValue}>{by_severity.medium || 0}</div>
                    <div className={styles.cardSubtext}>Coordinator alert</div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardLow}`}>
                    <div className={styles.cardLabel}>Low</div>
                    <div className={styles.cardValue}>{by_severity.low || 0}</div>
                    <div className={styles.cardSubtext}>Local volunteers</div>
                </div>

                <div className={`${styles.summaryCard} ${styles.cardSource}`}>
                    <div className={styles.cardLabel}>By Source</div>
                    <div className={styles.sourceChips}>
                        {Object.entries(by_source).map(([src, count]) => (
                            <span key={src}>
                                <SourceBadge source={src} /> {count}
                            </span>
                        ))}
                        {Object.keys(by_source).length === 0 && (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>No active signals</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Signal Feed */}
            <div className={styles.feedSection}>
                <div className={styles.feedTitle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6366f1' }}>stream</span>
                    Orchestrated Signals (24h)
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.feedTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Source</th>
                                <th>Type</th>
                                <th>AI Risk</th>
                                <th>TFLite</th>
                                <th>AI Assessment</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSignals.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className={styles.emptyState}>
                                            <span className="material-symbols-outlined">sensors_off</span>
                                            <p>No orchestrated signals in last 24 hours</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allSignals.map(sig => (
                                    <tr key={sig.id}>
                                        <td><code className={styles.idCode}>#{sig.id?.toString().slice(0, 8)}</code></td>
                                        <td>
                                            <SourceBadge source={sig.source} />
                                            {sig.relayed_via_mesh && (
                                                <span className={`${styles.sourceChip} ${styles.sourceMesh}`} style={{ marginLeft: 4 }}>
                                                    Mesh
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{sig.type || '—'}</td>
                                        <td><RiskBadge level={sig.escalation_level || sig.ai_assessment?.risk_level} /></td>
                                        <td>
                                            {sig.tflite_score != null
                                                ? <span style={{ fontWeight: 700 }}>{(sig.tflite_score * 100).toFixed(0)}%</span>
                                                : '—'}
                                        </td>
                                        <td>
                                            {sig.ai_assessment?.injury_assessment_en ? (
                                                <div className={styles.aiTooltip}>
                                                    <span style={{ fontSize: 12 }}>
                                                        {sig.ai_assessment.injury_assessment_en.substring(0, 60)}
                                                        {sig.ai_assessment.injury_assessment_en.length > 60 ? '…' : ''}
                                                    </span>
                                                    <div className={styles.aiTooltipContent}>
                                                        <strong>🇬🇧 English:</strong><br />
                                                        {sig.ai_assessment.injury_assessment_en}<br /><br />
                                                        {sig.ai_assessment.injury_assessment_hi && (
                                                            <>
                                                                <strong>🇮🇳 Hindi:</strong><br />
                                                                {sig.ai_assessment.injury_assessment_hi}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>Pending</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatTime(sig.created_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
