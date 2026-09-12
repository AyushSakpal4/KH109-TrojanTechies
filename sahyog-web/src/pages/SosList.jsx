import { useState } from 'react';
import { useSosList, useUsersList, useCreateTask, useSosTasks, useDeleteSos } from '../api/hooks';
import styles from './DataList.module.css';

const filters = ['All', 'triggered', 'acknowledged', 'resolved'];

function StatusBadge({ status }) {
  const map = {
    resolved: 'found',
    triggered: 'missing',
    acknowledged: 'warning',
  };
  const variant = map[status] || status || 'muted';
  return <span className={`${styles.badge} ${styles[`badge_${variant}`] || styles.badge_muted}`}>{status?.replace('_', ' ')}</span>;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function VolunteerActionsModal({ sosId, onClose }) {
  const { data: volunteers } = useUsersList();
  const { data: assignedTasks, isLoading: tasksLoading } = useSosTasks(sosId);
  const createTask = useCreateTask();

  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [instructions, setInstructions] = useState('');

  const allVols = Array.isArray(volunteers) ? volunteers : [];
  const validTasks = Array.isArray(assignedTasks) ? assignedTasks : [];

  // Filter out volunteers who are busy with any other task
  const freeVols = allVols.filter(v => v.role === 'volunteer' && v.is_active !== false && !v.is_assigned);

  const handleAssignClick = (volId) => {
    if (selectedVolunteerId === volId) {
      setSelectedVolunteerId(null);
      setInstructions('');
    } else {
      setSelectedVolunteerId(volId);
      setInstructions('');
    }
  };

  const handleSubmitAssign = (e, volunteerId) => {
    e.preventDefault();
    createTask.mutate(
      { sosId, volunteer_id: volunteerId, type: 'sos_response', title: 'Respond to SOS Alert', description: instructions || undefined },
      {
        onSuccess: () => {
          setSelectedVolunteerId(null);
          setInstructions('');
        }
      }
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Actions & Assignments</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <div className={styles.modalSplitBody}>
          {/* Assigned Volunteers Section */}
          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Assigned Volunteers</h4>
            {tasksLoading ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading...</div>
            ) : validTasks.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No volunteers assigned yet.</div>
            ) : (
              <div className={styles.volunteerList}>
                {validTasks.map(task => (
                  <div key={task.id} className={styles.volunteerItem}>
                    <div className={styles.volunteerHeader}>
                      <div className={styles.volunteerInfo}>
                        <span className={styles.volunteerName}>{task.volunteer_name || 'Unknown'}</span>
                        <span className={styles.volunteerTaskDesc}>
                          {task.description ? `Task: ${task.description}` : 'No specific description provided'}
                        </span>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Free / Unassigned Volunteers Section */}
          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Free Volunteers</h4>
            {freeVols.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No free verified volunteers available.</div>
            ) : (
              <div className={styles.volunteerList}>
                {freeVols.map(v => {
                  const isSelected = selectedVolunteerId === v.id;
                  return (
                    <div key={v.id} className={styles.volunteerItem}>
                      <div className={styles.volunteerHeader}>
                        <div className={styles.volunteerInfo}>
                          <span className={styles.volunteerName}>{v.full_name || v.email || v.id.slice(0, 8)}</span>
                          <span className={styles.volunteerTaskDesc}>Skills: {v.skills?.join(', ') || 'None listed'}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.actionSmall}
                          onClick={() => handleAssignClick(v.id)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {isSelected ? 'close' : 'person_add'}
                          </span>
                          <span style={{ fontSize: 11 }}>{isSelected ? 'Cancel' : 'Assign'}</span>
                        </button>
                      </div>

                      {/* Animated Slide-Down Assignment Form */}
                      <form
                        className={`${styles.assignForm} ${isSelected ? styles.open : ''}`}
                        onSubmit={(e) => handleSubmitAssign(e, v.id)}
                      >
                        <label className={styles.formLabel}>Task Description</label>
                        <textarea
                          value={isSelected ? instructions : ''}
                          onChange={e => setInstructions(e.target.value)}
                          className={styles.formTextarea}
                          rows={2}
                          placeholder="Describe the task to be completed..."
                          required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={createTask.isPending}
                            style={{ padding: '6px 14px', fontSize: 12 }}
                          >
                            {createTask.isPending ? 'Assigning…' : 'Confirm Assignment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SosList() {
  const { data: list, isLoading, error } = useSosList();
  const deleteSos = useDeleteSos();
  const [activeFilter, setActiveFilter] = useState('All');
  const [assigningSos, setAssigningSos] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this SOS alert?')) {
      deleteSos.mutate(id);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading SOS alerts…</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;

  const allRows = Array.isArray(list) ? list : [];
  const rows = activeFilter === 'All' ? allRows : allRows.filter(r => r.status === activeFilter);
  const activeCount = allRows.filter(s => s.status !== 'resolved' && s.status !== 'cancelled').length;

  return (
    <div className={styles.page}>
      {assigningSos && <VolunteerActionsModal sosId={assigningSos} onClose={() => setAssigningSos(null)} />}

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#34b27b' }}>sos</span>
            SOS Alerts
          </h1>
          <p className={styles.subtitle}>{activeCount} active · {allRows.length} total reports</p>
        </div>
      </div>

      <div className={styles.filterRow}>
        {filters.map(f => (
          <button
            key={f}
            className={`${styles.filterPill} ${activeFilter === f ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'All' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reporter / Incident</th>
              <th>Status</th>
              <th>Volunteer</th>
              <th>Disaster</th>
              <th>Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3 }}>inbox</span>
                    <p className={styles.emptyText}>No SOS alerts found</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: row.status === 'resolved' ? '#16a34a' : '#ef4444' }}>
                        {row.status === 'resolved' ? 'check_circle' : 'warning'}
                      </span>
                      <span>
                        {row.reporter_name || row.type || `Alert #${row.id?.slice(0, 8)}`}
                        {row.phone && <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{row.phone}</span>}
                      </span>
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                    {row.relayed_via_mesh && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginLeft: '6px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff',
                        letterSpacing: '0.3px',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>cell_tower</span> Mesh
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.volunteer_name ?? '—'}</td>
                  <td>{row.disaster_name ?? '—'}</td>
                  <td className={styles.timeCell}>{formatTime(row.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={styles.actionSmall}
                        onClick={() => setAssigningSos(row.id)}
                        title="Manage Actions & Assignments"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>manage_accounts</span>
                        <span style={{ fontSize: 11 }}>Actions</span>
                      </button>
                      <button
                        className={styles.actionSmall}
                        onClick={() => handleDelete(row.id)}
                        style={{ color: '#ef4444' }}
                        title="Delete SOS Alert"
                        disabled={deleteSos.isPending}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        <span style={{ fontSize: 11 }}>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
