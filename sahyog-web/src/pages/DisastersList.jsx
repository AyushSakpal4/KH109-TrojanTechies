import { useState, Fragment } from 'react';
import { useDisastersList, useCreateDisaster, useActivateDisaster, useResolveDisaster, useDisasterTasks } from '../api/hooks';
import styles from './DataList.module.css';

const filters = ['All', 'active', 'contained', 'resolved'];

function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles[`badge_${status}`] || styles.badge_muted}`}>{status}</span>;
}

function SeverityBadge({ severity }) {
  let variant = 'muted';
  let label = severity;
  
  const num = parseInt(severity, 10);
  if (!isNaN(num)) {
    if (num >= 8) { variant = 'critical'; label = 'Critical'; }
    else if (num >= 6) { variant = 'warning'; label = 'High'; }
    else if (num >= 4) { variant = 'info'; label = 'Medium'; }
    else { variant = 'muted'; label = 'Low'; }
  } else {
    const map = { critical: 'critical', high: 'warning', medium: 'info', low: 'muted' };
    const sev = severity != null ? String(severity).toLowerCase() : null;
    variant = map[sev] || 'muted';
  }
  
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{label ?? '—'}</span>;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function CreateDisasterModal({ onClose }) {
  const createDisaster = useCreateDisaster();
  const [form, setForm] = useState({ name: '', type: '', severity: 7, description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName) return;

    const payload = {
      name: cleanName,
      severity: form.severity,
    };
    if (form.type.trim()) payload.type = form.type.trim();

    createDisaster.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
      onError: (err) => {
        alert(err.message || 'Failed to create disaster');
      }
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Create Disaster Zone</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <label className={styles.formLabel}>Disaster Name*</label>
          <input
            type="text"
            placeholder="e.g. Major Flood 2026"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className={styles.formInput}
            style={{ width: '100%', marginBottom: 12 }}
            required
          />
          
          <label className={styles.formLabel}>Type</label>
          <input
            type="text"
            placeholder="e.g. flood, fire, earthquake"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            className={styles.formInput}
            style={{ width: '100%', marginBottom: 12 }}
          />
          
          <label className={styles.formLabel}>Severity</label>
          <select
            value={form.severity}
            onChange={e => setForm({ ...form, severity: parseInt(e.target.value, 10) })}
            className={styles.select}
            style={{ width: '100%', marginBottom: 16 }}
          >
            <option value={9}>Critical</option>
            <option value={7}>High</option>
            <option value={5}>Medium</option>
            <option value={3}>Low</option>
          </select>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={createDisaster.isPending || !form.name}>
              {createDisaster.isPending ? 'Creating…' : 'Create Disaster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmResolveModal({ disaster, onClose, onConfirm }) {
  const [confirmName, setConfirmName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirmName === disaster.name) {
      onConfirm(disaster.id);
    }
  };

  const isMatch = confirmName === disaster.name;

  return (
    <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex: 1100 }}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Confirm Resolution</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Are you sure you want to resolve the disaster <strong>{disaster.name}</strong>? 
            Please type <code style={{ userSelect: 'none', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4 }}>{disaster.name}</code> to confirm.
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            className={styles.formInput}
            style={{ width: '100%', marginBottom: 20 }}
            autoFocus
          />
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={`${styles.submitBtn} ${isMatch ? '' : styles.disabledBtn}`} disabled={!isMatch} style={{ background: isMatch ? 'var(--color-danger)' : undefined }}>
              Resolve Disaster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpandableDetailsRow({ disaster, onCancel }) {
  const { data: tasks, isLoading } = useDisasterTasks(disaster.id);
  const resolveDisaster = useResolveDisaster();
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // Count active tasks and SOS from the tasks data
  const activeTasks = tasks?.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status))?.length || 0;
  const hasActiveItems = activeTasks > 0 || (disaster.active_sos > 0);

  const handleResolveConfirm = (id) => {
    setResolveError(null);
    resolveDisaster.mutate(id, {
      onSuccess: () => {
        setShowConfirm(false);
        onCancel();
      },
      onError: (error) => {
        setResolveError(error.message);
      }
    });
  };

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        {showConfirm && (
          <ConfirmResolveModal 
            disaster={disaster} 
            onClose={() => setShowConfirm(false)} 
            onConfirm={handleResolveConfirm} 
          />
        )}
        <div className={styles.expandableRowContainer}>
          <div className={styles.expandableSection}>
            <h4 className={styles.modalSectionTitle}>Disaster Info</h4>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0' }}>
              <strong>Name:</strong> {disaster.name} <br/>
              <strong>Type:</strong> {disaster.type || 'N/A'} <br/>
              <strong>Status:</strong> {disaster.status} <br/>
              <strong>Activated:</strong> {formatTime(disaster.activated_at)}
            </p>
          </div>

          <div className={styles.expandableSection}>
            <h4 className={styles.modalSectionTitle}>Assigned Volunteers & Proofs</h4>
            {isLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading associated tasks...</p>
            ) : (!tasks || tasks.length === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No volunteers have been assigned tasks for this disaster yet.</p>
            ) : (
              <div className={styles.volunteerList}>
                {tasks.map(task => (
                  <div key={task.id} className={styles.volunteerItem}>
                    <div className={styles.volunteerHeader}>
                      <div className={styles.volunteerInfo}>
                        <span className={styles.volunteerName}>{task.volunteer_name || 'Unknown'}</span>
                        <span className={styles.volunteerTaskDesc}>Task: {task.instructions || 'N/A'}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>Status: <StatusBadge status={task.status} /></span>
                      </div>
                    </div>
                    {task.proof_images && task.proof_images.length > 0 && (
                      <div className={styles.proofImageGrid}>
                        {task.proof_images.map((url, i) => (
                          <img key={i} src={url} alt="Proof" className={styles.proofImage} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Items Warning */}
          {hasActiveItems && (
            <div style={{ 
              margin: '16px 0', 
              padding: '12px 16px', 
              background: 'var(--badge-amber-bg)', 
              borderRadius: 8,
              border: '1px solid var(--color-warning)',
              color: 'var(--badge-amber-fg)',
              fontSize: 13
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 8 }}>warning</span>
              <strong>Cannot resolve:</strong> {activeTasks} active task(s), {disaster.active_sos || 0} active SOS alert(s)
            </div>
          )}

          {/* Resolution Error */}
          {resolveError && (
            <div style={{ 
              margin: '16px 0', 
              padding: '12px 16px', 
              background: 'var(--badge-red-bg)', 
              borderRadius: 8,
              border: '1px solid var(--color-danger)',
              color: 'var(--badge-red-fg)',
              fontSize: 13
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 8 }}>error</span>
              {resolveError}
            </div>
          )}

          <div className={styles.modalActions} style={{ marginTop: 20 }}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>Close Panel</button>
            <button 
              type="button" 
              className={styles.submitBtn} 
              style={{ 
                background: hasActiveItems ? 'var(--color-text-muted)' : 'var(--color-danger)',
                cursor: hasActiveItems ? 'not-allowed' : 'pointer'
              }}
              onClick={() => !hasActiveItems && setShowConfirm(true)}
              disabled={hasActiveItems}
              title={hasActiveItems ? 'Cannot resolve with active tasks or SOS alerts' : 'Verify & Resolve Disaster'}
            >
              Verify & Resolve Disaster
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function DisastersList() {
  const { data: list, isLoading, error } = useDisastersList();
  const activateDisaster = useActivateDisaster();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedResolveId, setExpandedResolveId] = useState(null);

  if (isLoading) return <div className={styles.loading}>Loading disaster zones…</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;

  const allRows = Array.isArray(list) ? list : [];
  const rows = activeFilter === 'All' ? allRows : allRows.filter(r => r.status === activeFilter);
  const activeCount = allRows.filter(d => d.status === 'active').length;

  return (
    <div className={styles.page}>
      {showCreateModal && <CreateDisasterModal onClose={() => setShowCreateModal(false)} />}

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#f59e0b' }}>flood</span>
            Disaster Zones
          </h1>
          <p className={styles.subtitle}>{activeCount} active zones · {allRows.length} total</p>
        </div>
        <button className={styles.actionBtn} onClick={() => setShowCreateModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Create Disaster
        </button>
      </div>

      <div className={styles.filterRow}>
        {filters.map(f => (
          <button
            key={f}
            className={`${styles.filterPill} ${activeFilter === f ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'All' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Severity</th>
              <th>Activated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3 }}>landscape</span>
                    <p className={styles.emptyText}>No disaster zones found</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <Fragment key={row.id}>
                  <tr style={{ background: expandedResolveId === row.id ? 'var(--color-surface-hover)' : '' }}>
                    <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.name}</td>
                    <td>{row.type ?? '—'}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td><SeverityBadge severity={row.severity} /></td>
                    <td className={styles.timeCell}>{formatTime(row.activated_at)}</td>
                    <td>
                      <div className={styles.actionGroup}>
                        {row.status !== 'active' && (
                          <button
                            className={styles.actionSmall}
                            onClick={() => activateDisaster.mutate(row.id)}
                            disabled={activateDisaster.isPending || expandedResolveId === row.id}
                            title="Activate"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                          </button>
                        )}
                        {row.status !== 'resolved' && (
                          <button
                            className={`${styles.actionSmall} ${styles.actionDanger}`}
                            onClick={() => setExpandedResolveId(expandedResolveId === row.id ? null : row.id)}
                            title={expandedResolveId === row.id ? "Cancel Resolve" : "Resolve"}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              {expandedResolveId === row.id ? 'close' : 'check_circle'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {expandedResolveId === row.id && (
                    <ExpandableDetailsRow 
                      disaster={row} 
                      onCancel={() => setExpandedResolveId(null)} 
                    />
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
