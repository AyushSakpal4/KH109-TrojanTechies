import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMe, useBackendHealth, useNeedsList, useDisastersList, useUsersList, useResourcesList, useServerStats, useMyAssignments, useRespondAssignment } from '../api/hooks';
import { selectProfile } from '../store/slices/authSlice';
import { SituationMonitor } from '../components/situation-monitor/SituationMonitor';
import styles from './Dashboard.module.css';

function StatCard({ icon, label, value, sub, accent = 'primary' }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${accent}`]}`}>
      <div className={styles.statIconWrap}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className={styles.statBody}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    pending: 'amber',
    in_progress: 'blue',
    resolved: 'green',
    cancelled: 'muted',
    active: 'red',
    contained: 'amber',
    critical: 'red',
  };
  const variant = colorMap[status] || 'muted';
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{status?.replace('_', ' ')}</span>;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function GaugeBar({ label, value, max, unit, color, icon }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : color || '#34b27b';
  return (
    <div className={styles.gaugeRow}>
      <div className={styles.gaugeHeader}>
        <span className={styles.gaugeLabel}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
          {label}
        </span>
        <span className={styles.gaugeValue}>{value}{unit} <span className={styles.gaugeMuted}>/ {max}{unit}</span></span>
      </div>
      <div className={styles.gaugeTrack}>
        <div
          className={styles.gaugeFill}
          style={{ width: `${pct}%`, background: barColor, transition: 'width 0.6s ease' }}
        />
      </div>
      <span className={styles.gaugePct} style={{ color: barColor }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function ActiveDisastersPanel({ disasters }) {
  const list = Array.isArray(disasters) ? disasters.filter(d => d.status === 'active' || d.status === 'contained') : [];
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flood</span>
          Active Disaster Zones
        </h3>
        <a href="/disasters" className={styles.viewAll}>Manage →</a>
      </div>
      <div className={styles.zoneList}>
        {list.length === 0 ? (
          <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, opacity: 0.4, display: 'block', margin: '0 auto 6px' }}>verified_user</span>
            All monitored sectors nominal. Zero active disasters.
          </div>
        ) : (
          list.slice(0, 4).map(d => (
            <div key={d.id} className={styles.zoneItem}>
              <div className={styles.zoneIcon}>
                <span className="material-symbols-outlined">{d.type === 'flood' ? 'flood' : d.type === 'earthquake' ? 'landslide' : d.type === 'fire' ? 'local_fire_department' : 'warning'}</span>
              </div>
              <div className={styles.zoneInfo}>
                <div className={styles.zoneTitle}>{d.name || `${d.type} Sector`}</div>
                <div className={styles.zoneMeta}>
                  <span>{d.type || 'Hazard'}</span>
                  <span>•</span>
                  <span>{d.status || 'active'}</span>
                </div>
              </div>
              <span className={`${styles.zoneSeverity} ${
                (d.severity >= 8) ? styles.zoneSevCritical :
                (d.severity >= 5) ? styles.zoneSevElevated : styles.zoneSevNormal
              }`}>
                {d.severity ? `Sev ${d.severity}` : 'Active'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmergencyReadinessPanel({ resources, users }) {
  const resList = Array.isArray(resources) ? resources : [];
  const userList = Array.isArray(users) ? users : [];
  const volTotal = userList.filter(u => u.role === 'volunteer').length;
  const volActive = userList.filter(u => u.role === 'volunteer' && (u.is_active || u.isActive)).length;
  const volPct = volTotal > 0 ? Math.round((volActive / volTotal) * 100) : 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>health_and_safety</span>
          Emergency Readiness
        </h3>
        <span className={styles.badge} style={{ background: 'var(--color-primary-10)', color: 'var(--color-primary)' }}>OPERATIONAL</span>
      </div>
      <div className={styles.readinessBody}>
        <div className={styles.readinessItem}>
          <div className={styles.readinessHeader}>
            <span className={styles.readinessLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)' }}>group</span>
              Volunteer Squad Readiness
            </span>
            <span className={styles.readinessVal}>{volActive}/{volTotal} Ready</span>
          </div>
          <div className={styles.readinessTrack}>
            <div className={styles.readinessFill} style={{ width: `${Math.max(volPct, 15)}%`, background: 'var(--color-primary)' }} />
          </div>
        </div>

        <div className={styles.readinessItem}>
          <div className={styles.readinessHeader}>
            <span className={styles.readinessLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-info)' }}>inventory_2</span>
              Relief Supply Hubs
            </span>
            <span className={styles.readinessVal}>{resList.length} Deployed</span>
          </div>
          <div className={styles.readinessTrack}>
            <div className={styles.readinessFill} style={{ width: `${Math.min(resList.length * 20, 100)}%`, background: 'var(--color-info)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmergencyHelplinesPanel() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>emergency</span>
          Rapid Dispatch & Helplines
        </h3>
      </div>
      <div className={styles.helplineBanner}>
        <div className={styles.helplineLeft}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-danger)', fontSize: 20 }}>call</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--color-danger)' }}>NATIONAL DISASTER HOTLINE</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>24x7 Emergency Services</div>
          </div>
        </div>
        <a href="tel:112" className={styles.helplineCallBtn}>
          Dial 112
        </a>
      </div>
      <div className={styles.quickActions} style={{ padding: '0 16px 16px' }}>
        <a href="/orchestrator" className={styles.quickBtn}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>cell_tower</span>
          <span>AI Orchestrator</span>
        </a>
        <a href="/map" className={styles.quickBtn}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-info)' }}>map</span>
          <span>2D/3D Live Map</span>
        </a>
        <a href="/needs" className={styles.quickBtn}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-danger)' }}>sos</span>
          <span>Needs & SOS</span>
        </a>
        <a href="/relief" className={styles.quickBtn}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-warning)' }}>volunteer_activism</span>
          <span>NGO Requests</span>
        </a>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: me, isLoading, error } = useMe();
  const { data: backendReachable, isLoading: healthLoading } = useBackendHealth();
  const { data: needsList } = useNeedsList();
  const { data: disastersList } = useDisastersList();
  const { data: usersList } = useUsersList();
  const { data: resourcesList } = useResourcesList();
  const { data: assignments } = useMyAssignments();
  const respondAssignment = useRespondAssignment();
  const profile = useSelector(selectProfile);

  const needsArr = Array.isArray(needsList) ? needsList : [];
  const disArr = Array.isArray(disastersList) ? disastersList : [];
  const usersArr = Array.isArray(usersList) ? usersList : [];
  const resArr = Array.isArray(resourcesList) ? resourcesList : [];

  const activeNeeds = needsArr.filter(s => s.status !== 'resolved' && s.status !== 'cancelled').length;
  const activeDisasters = disArr.filter(d => d.status === 'active').length;
  const availableVol = usersArr.filter(v => v.role === 'volunteer').length;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
        <div className={styles.skeletonTable} />
      </div>
    );
  }

  if (error) {
    const is401 = error.status === 401;
    const is500 = error.status === 500;
    const serverDetail = error.detail || error.details?.detail;
    return (
      <div className={styles.page}>
        <div className={styles.errorCard}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ef4444' }}>error</span>
          <h2 className={styles.errorTitle}>Failed to load dashboard</h2>
          <p className={styles.errorMsg}>{error.message}</p>
          {!healthLoading && (
            <p className={styles.errorConnect}>
              Backend: <strong style={{ color: backendReachable ? '#16a34a' : '#ef4444' }}>{backendReachable ? 'Reachable' : 'Unreachable'}</strong>
              {!backendReachable && <span className={styles.errorHint}>Run <code>npm run dev</code> in the project root and refresh.</span>}
            </p>
          )}
          {serverDetail && <p className={styles.errorDetail}>Server: {serverDetail}</p>}
          {is401 && <p className={styles.errorHint}>No valid token. Complete sign-in and refresh.</p>}
          {is500 && <p className={styles.errorHint}>Check backend terminal for the full error stack.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Unified Situation & Command Monitor ── */}
      <SituationMonitor />

      {/* ── High Level Stats Overview ── */}
      <div className={styles.statsGrid}>
        <StatCard icon="sos" label="Active Needs" value={activeNeeds} sub={`${needsArr.length} total`} accent="danger" />
        <StatCard icon="flood" label="Active Zones" value={activeDisasters} sub={activeDisasters > 0 ? 'Monitoring' : 'All clear'} accent="warning" />
        <StatCard icon="group" label="Volunteers" value={usersArr.length} sub={`${availableVol} volunteers`} accent="primary" />
        <StatCard icon="night_shelter" label="Resources" value={resArr.length} sub="Registered resources" accent="info" />
      </div>

      {/* Main Grid */}
      <div className={styles.contentGrid}>

        {/* Volunteer Assignments (Visible only if there are assignments or if user is a volunteer with assignments) */}
        {assignments && assignments.length > 0 && (
          <div className={styles.card} style={{ gridColumn: '1 / -1', background: 'var(--color-primary-10)', borderColor: 'var(--color-primary)' }}>
            <div className={styles.cardHeader}>
              <h3 className={styles.sectionTitle} style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>assignment_ind</span>
                My Disaster Assignments
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '0 20px 20px' }}>
              {assignments.map(a => (
                <div key={a.id} style={{ background: 'var(--color-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border)', flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-text-primary)' }}>{a.disaster_name}</h4>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    Assigned around {formatTime(a.created_at)}
                    {a.coordinator_name && <><br />Coordinator: {a.coordinator_name} ({a.coordinator_phone || 'N/A'})</>}
                  </div>
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => respondAssignment.mutate({ id: a.id, status: 'accepted' })}
                        disabled={respondAssignment.isPending}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#34b27b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                      >Accept</button>
                      <button
                        onClick={() => respondAssignment.mutate({ id: a.id, status: 'rejected' })}
                        disabled={respondAssignment.isPending}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                      >Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent SOS Alerts */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.sectionTitle}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sos</span>
              Recent Needs & Distress Signals
            </h3>
            <a href="/needs" className={styles.viewAll}>View All →</a>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Urgency</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {needsArr.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.3 }}>inbox</span>
                      <p>No Needs reported yet</p>
                    </td>
                  </tr>
                ) : (
                  needsArr.slice(0, 6).map(row => (
                    <tr key={row.id}>
                      <td><code className={styles.mono}>#{row.id?.slice(0, 8)}</code></td>
                      <td><StatusBadge status={row.status} /></td>
                      <td>{row.type ?? '—'}</td>
                      <td>{row.urgency ?? 'medium'}</td>
                      <td className={styles.timeCell}>{formatTime(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Active Zones, Readiness, and Helplines */}
        <div className={styles.sidePanel}>
          {/* Active Disaster Zones */}
          <ActiveDisastersPanel disasters={disArr} />

          {/* Emergency Readiness */}
          <EmergencyReadinessPanel resources={resArr} users={usersArr} />

          {/* Helplines & Fast Actions */}
          <EmergencyHelplinesPanel />
        </div>
      </div>
    </div>
  );
}
