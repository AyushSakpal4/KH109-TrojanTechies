import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOrgRequests, useAcceptOrgRequest, useRejectOrgRequest, useAssignCoordinator, useOrgVolunteers, useOrgProfile, useUpdateAiPreference } from '../../api/useOrg';
import { useRealtime } from '../../components/RealtimeProvider';
import s from './Org.module.css';

const STATUS_COLORS = {
  pending: { bg: 'var(--badge-amber-bg)', fg: 'var(--badge-amber-fg)' },
  accepted: { bg: 'var(--badge-green-bg)', fg: 'var(--badge-green-fg)' },
  rejected: { bg: 'var(--badge-red-bg)', fg: 'var(--badge-red-fg)' },
  cancelled: { bg: 'var(--badge-muted-bg)', fg: 'var(--badge-muted-fg)' },
  active: { bg: '#dbeafe', fg: '#1d4ed8' },
  allocated: { bg: '#dcfce7', fg: '#15803d' },
  skipped: { bg: '#f1f5f9', fg: '#475569' }
};

function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function RequestCard({ req, onAccept, onReject, onAssignCoord, acceptMutation, rejectMutation }) {
  const [showAccept, setShowAccept] = useState(false);
  const [contributions, setContributions] = useState(
    (req.items || []).map(item => ({ item_id: item.id, quantity_committed: Math.min(100, item.quantity_needed), resource_type: item.resource_type }))
  );
  const [showCoord, setShowCoord] = useState(false);
  const [coordId, setCoordId] = useState('');
  const { data: volunteers = [] } = useOrgVolunteers();

  const coordinators = (Array.isArray(volunteers) ? volunteers : []).filter(v => (v.role || '').toLowerCase() === 'coordinator');

  const updateContribution = (idx, val) => {
    const next = [...contributions];
    next[idx].quantity_committed = val;
    setContributions(next);
  };

  const isPending = req.assignment_status === 'pending';
  const isAccepted = req.assignment_status === 'accepted';
  const statusColor = STATUS_COLORS[req.assignment_status] || STATUS_COLORS.pending;

  return (
    <div style={{
      padding: 20, borderRadius: 14, background: 'var(--color-surface)',
      border: '1px solid var(--color-border)', marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ef4444' }}>flood</span>
            {req.disaster_name}
          </h3>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {req.disaster_type} · Severity {req.disaster_severity || '—'} · Requested by {req.requested_by}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {formatTime(req.created_at)}
          </div>
          {req.notes && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>{req.notes}</p>}
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
          background: statusColor.bg, color: statusColor.fg, textTransform: 'uppercase',
        }}>
          {req.assignment_status}
        </span>
      </div>

      {/* Resource items */}
      <div style={{ marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Required Resources</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(req.items || []).map(item => (
            <div key={item.id} style={{
              padding: '8px 14px', borderRadius: 8, background: 'var(--color-bg)',
              border: '1px solid var(--color-border)', fontSize: 13,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.resource_type}</span>
              <span style={{ marginLeft: 8, color: 'var(--color-primary)', fontWeight: 700 }}>{item.quantity_needed}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowAccept(!showAccept)} style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#34b27b', color: '#fff', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            Accept & Commit Resources
          </button>
          <button onClick={() => onReject(req.assignment_id)} disabled={rejectMutation.isPending} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)',
            cursor: 'pointer', background: 'var(--color-surface)', color: '#ef4444',
            fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>
            Reject
          </button>
        </div>
      )}

      {/* Accept form */}
      {showAccept && isPending && (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Commit your stock for each resource:
          </h4>
          {contributions.map((c, idx) => (
            <div key={c.item_id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.resource_type}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{c.quantity_committed}</span>
              </div>
              <input type="range" min={0} max={req.items[idx]?.quantity_needed || 500}
                value={c.quantity_committed} onChange={e => updateContribution(idx, +e.target.value)}
                style={{ width: '100%', accentColor: '#34b27b' }} />
            </div>
          ))}
          <button onClick={() => onAccept(req.assignment_id, contributions)}
            disabled={acceptMutation.isPending}
            style={{
              marginTop: 8, padding: '10px 20px', borderRadius: 8, border: 'none',
              cursor: 'pointer', background: '#34b27b', color: '#fff', fontWeight: 700, fontSize: 13,
            }}>
            {acceptMutation.isPending ? 'Submitting...' : 'Confirm & Accept'}
          </button>
        </div>
      )}

      {/* Assign Coordinator per Zone (after accepting) */}
      {isAccepted && req.zones && req.zones.length > 0 && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>Assign Coordinator to Zones</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {req.zones.map(zone => (
              <div key={zone.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: zone.severity === 'red' ? '#ef4444' : zone.severity === 'yellow' ? '#f59e0b' : '#3b82f6' }} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{zone.name}</span>
                </div>
                
                {zone.assigned_coordinator_name ? (
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--color-info-10)', border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)' }}>check_circle</span>
                    <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{zone.assigned_coordinator_name}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select id={`coord-${zone.id}`} defaultValue=""
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: 12,
                      }}>
                      <option value="">Select coordinator...</option>
                      {coordinators.map(c => (
                        <option key={c.id} value={c.id} disabled={c.is_assigned}>
                          {c.full_name || c.email} {c.is_assigned ? '(Busy)' : ''}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => {
                        const selectEl = document.getElementById(`coord-${zone.id}`);
                        if (selectEl && selectEl.value) {
                          onAssignCoord(req.assignment_id, selectEl.value, zone.id);
                        }
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: '#34b27b', color: '#fff', fontWeight: 600, fontSize: 12,
                      }}>
                      Assign
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {coordinators.length === 0 && (
            <p style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
              No coordinators linked to your organization yet. Add coordinators via your Volunteers page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function OrgRequests() {
  const { data: requests = [], isLoading, error } = useOrgRequests();
  const acceptMutation = useAcceptOrgRequest();
  const rejectMutation = useRejectOrgRequest();
  const coordMutation = useAssignCoordinator();
  const qc = useQueryClient();
  const { socket } = useRealtime();

  const [agentProgress, setAgentProgress] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handleProgress = (data) => {
      // Always update the live status
      setAgentProgress(data);

      // Accumulate milestone events into persistent history
      if (data.stage === 'ALLOCATED' || data.stage === 'SKIPPED') {
        setAllocationHistory(prev => [...prev, {
          org_name: data.org_name || 'Organization',
          stage: data.stage,
          message: data.message,
          contributions: data.contributions,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }]);
        qc.invalidateQueries({ queryKey: ['org-requests'] });
      }

      // On completion, keep modal visible (no auto-dismiss)
      if (data.stage === 'COMPLETED' || data.stage === 'EXHAUSTED') {
        qc.invalidateQueries({ queryKey: ['org-requests'] });
      }
    };
    socket.on('org_agent_progress', handleProgress);
    return () => socket.off('org_agent_progress', handleProgress);
  }, [socket, qc]);


  const handleAccept = (assignmentId, contributions) => {
    acceptMutation.mutate({ assignmentId, contributions });
  };
  const handleReject = (assignmentId) => {
    if (confirm('Are you sure you want to reject this request?')) {
      rejectMutation.mutate(assignmentId);
    }
  };
  const handleAssignCoord = (assignmentId, coordinator_id, zone_id) => {
    coordMutation.mutate({ assignmentId, coordinator_id, zone_id });
  };

  const { data: orgProfile, isLoading: isProfileLoading } = useOrgProfile();
  const updateAiPreferenceMutation = useUpdateAiPreference();

  const handleAiPreferenceChange = (mode) => {
    updateAiPreferenceMutation.mutate(mode);
  };

  const allReqs = Array.isArray(requests) ? requests : [];
  const pendingCount = allReqs.filter(r => r.assignment_status === 'pending').length;

  if (isLoading || isProfileLoading) return <div className={s.pageTitle} style={{ padding: 40 }}>Loading requests...</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error.message}</div>;

  const currentPreference = orgProfile?.ai_allocation_preference || 'full';

  return (
    <div style={{ padding: '28px 32px', position: 'relative' }}>
      <h2 className={s.pageTitleSm} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-primary)' }}>assignment_ind</span>
        Disaster Requests
        {pendingCount > 0 && (
          <span style={{
            padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: '#fef3c7', color: '#92400e', marginLeft: 8,
          }}>
            {pendingCount} pending
          </span>
        )}
      </h2>
      <p className={s.pageDesc}>Review and respond to disaster relief requests from the admin. Accept to commit resources, then assign a coordinator.</p>

      {/* AI Allocation Preference Toggle Banner */}
      <div style={{
        marginTop: 20, marginBottom: 24, padding: 16, borderRadius: 12,
        background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8b5cf6' }}>smart_toy</span>
            AI Auto-Allocation Preference
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            Set how the AI Orchestrator should allocate your resources when automated requests arrive.
          </p>
        </div>
        
        <div style={{ display: 'flex', background: '#e2e8f0', padding: 4, borderRadius: 8, gap: 4 }}>
          {[
            { id: 'full', label: 'Send All', icon: 'done_all' },
            { id: 'partial', label: 'Send Partial', icon: 'pie_chart' },
            { id: 'none', label: 'No Send', icon: 'block' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleAiPreferenceChange(opt.id)}
              disabled={updateAiPreferenceMutation.isPending}
              style={{
                padding: '8px 16px', borderRadius: 6, border: 'none',
                background: currentPreference === opt.id ? '#fff' : 'transparent',
                color: currentPreference === opt.id ? '#0f172a' : '#64748b',
                fontWeight: currentPreference === opt.id ? 700 : 600,
                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: currentPreference === opt.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: currentPreference === opt.id ? '#8b5cf6' : 'inherit' }}>
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {allReqs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3 }}>inbox</span>
          <p style={{ marginTop: 8 }}>No requests received yet</p>
        </div>
      ) : (
        allReqs.map(req => (
          <RequestCard key={req.assignment_id} req={req}
            onAccept={handleAccept} onReject={handleReject} onAssignCoord={handleAssignCoord}
            acceptMutation={acceptMutation} rejectMutation={rejectMutation}
          />
        ))
      )}

      {/* AI Agent Allocation Tracker (Organization Side) */}
      {agentProgress && (
        <div style={{
          position: 'fixed', top: 32, right: 32, width: 380, zIndex: 9999,
          background: '#fff', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0', overflow: 'hidden',
          animation: 'orgAgentSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px',
            background: agentProgress.stage === 'COMPLETED' ? '#f0fdf4' : agentProgress.stage === 'EXHAUSTED' ? '#fffbeb' : '#f8fafc',
            borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: agentProgress.stage === 'COMPLETED' ? '#10b981' : agentProgress.stage === 'EXHAUSTED' ? '#f59e0b' : '#8b5cf6',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {agentProgress.stage === 'COMPLETED' ? 'verified' : agentProgress.stage === 'EXHAUSTED' ? 'warning' : 'smart_toy'}
                </span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                  {agentProgress.stage === 'COMPLETED' ? 'Allocation Complete' : agentProgress.stage === 'EXHAUSTED' ? 'Partially Fulfilled' : 'AI Allocation Agent'}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  {agentProgress.stage === 'COMPLETED' || agentProgress.stage === 'EXHAUSTED' ? 'Sequence finished' : 'Automating resource allocation...'}
                </p>
              </div>
            </div>
            <button onClick={() => { setAgentProgress(null); setAllocationHistory([]); }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8',
              padding: 4, borderRadius: 6, display: 'flex'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
          
          <div style={{ padding: 16, maxHeight: 380, overflowY: 'auto' }}>
            {/* Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              {agentProgress.stage === 'PROCESSING' || agentProgress.stage === 'ACTIVE' ? (
                <div style={{ width: 14, height: 14, border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'orgAgentSpin 1s linear infinite', flexShrink: 0 }} />
              ) : agentProgress.stage === 'COMPLETED' ? (
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 18, flexShrink: 0 }}>check_circle</span>
              ) : agentProgress.stage === 'EXHAUSTED' ? (
                <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 18, flexShrink: 0 }}>info</span>
              ) : (
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 18, flexShrink: 0 }}>check_circle</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{agentProgress.message}</span>
            </div>

            {/* Current Allocation Details */}
            {agentProgress.contributions && agentProgress.contributions.length > 0 && agentProgress.stage === 'ALLOCATED' && (
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #bbf7d0' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 11, textTransform: 'uppercase', color: '#15803d', letterSpacing: 0.5 }}>Resources Allocated to Your Org</h5>
                {agentProgress.contributions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: i !== agentProgress.contributions.length - 1 ? 6 : 0 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{c.resource_type}</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>+{c.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Allocation History (persistent log of all events) */}
            {allocationHistory.length > 0 && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Allocation Log</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {allocationHistory.map((entry, i) => (
                    <div key={i} style={{
                      padding: 10, borderRadius: 8,
                      background: entry.stage === 'SKIPPED' ? '#f1f5f9' : '#f0fdf4',
                      border: `1px solid ${entry.stage === 'SKIPPED' ? '#e2e8f0' : '#bbf7d0'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{entry.org_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>{entry.timestamp}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: entry.stage === 'SKIPPED' ? '#64748b' : '#15803d', padding: '1px 6px', borderRadius: 4, background: entry.stage === 'SKIPPED' ? '#e2e8f0' : '#dcfce7' }}>
                            {entry.stage}
                          </span>
                        </div>
                      </div>
                      {entry.contributions && entry.contributions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {entry.contributions.map((c, j) => (
                            <span key={j} style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              {c.quantity}x {c.resource_type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes orgAgentSlideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes orgAgentSpin { 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}
    </div>
  );
}
