import { useMemo, useState } from 'react';
import { useDisastersList } from '../../api/hooks';
import { useDisasterReport } from '../../api/useCommandCenter';
import styles from '../../components/command-center/CommandCenter.module.css';

function toCSV(report = {}) {
  const rows = [
    ['Metric', 'Value'],
    ['Disaster', report.details?.name ?? '—'],
    ['Status', report.details?.status ?? '—'],
    ['Total Needs', report.metrics?.total_needs ?? 0],
    ['Total Volunteers', report.metrics?.total_volunteers ?? 0],
    ['Avg Response Time (min)', report.metrics?.avg_response_time ?? 0],
    ['Escalation Count', report.metrics?.escalation_count ?? 0],
    ['SLA Compliance (%)', report.metrics?.sla_compliance_pct ?? 0],
    [],
    ['Organizations', 'Committed Resources'],
    ...(report.organizations || []).map(o => [o.name, o.total_committed]),
    [],
    ['Zones', 'Count'],
    ...(report.zones || []).map(z => [z.severity, z.count]),
    [],
    ['Resource Needs', 'Needed', 'Fulfilled'],
    ...(report.needs_breakdown || []).map(n => [n.resource_type, n.needed, n.fulfilled])
  ];
  return rows.map((r) => r.map((v) => `"${String(v || '').replaceAll('"', '""')}"`).join(',')).join('\n');
}

function downloadFile(content, type, fileName) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [disasterId, setDisasterId] = useState('');
  const { data: disasters } = useDisastersList();
  const { data: report, isLoading, error } = useDisasterReport(disasterId || undefined);

  const selectedDisaster = useMemo(
    () => (Array.isArray(disasters) ? disasters.find((d) => String(d.id) === String(disasterId)) : null),
    [disasters, disasterId],
  );

  const onExportCSV = () => {
    if (!report) return;
    downloadFile(toCSV(report), 'text/csv;charset=utf-8', `after-action-${disasterId || 'report'}.csv`);
  };

  const onExportPDF = () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) return;
    
    const html = `
      <html>
        <head>
          <title>After Action Report</title>
          <style>
            @page { margin: 15mm; size: A4; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; background: white; }
            * { box-sizing: border-box; }
            .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        </head>
        <body>
          ${reportElement.outerHTML}
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print(); 
                window.close();
              }, 200);
            }
          </script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className={`report-container ${styles.page}`}>

      {/* Header Controls (No Print) */}
      <div className={`no-print ${styles.headerRow}`} style={{ marginBottom: 20 }}>
        <div>
          <h1 className={styles.title}>After-Action Reports</h1>
          <p className={styles.subtitle}>Generate comprehensive summary metrics and export report outputs.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none' }}
            value={disasterId} 
            onChange={(e) => setDisasterId(e.target.value)}
          >
            <option value="">Select Disaster</option>
            {(Array.isArray(disasters) ? disasters : []).map((d) => (
              <option key={d.id} value={d.id}>{d.name || d.id}</option>
            ))}
          </select>

          <button 
            onClick={onExportPDF} disabled={!report}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: report ? 'pointer' : 'not-allowed', opacity: report ? 1 : 0.5 }}
          >
            Export PDF
          </button>
          <button 
            onClick={onExportCSV} disabled={!report}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: report ? 'pointer' : 'not-allowed', opacity: report ? 1 : 0.5 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {isLoading && disasterId && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12, display: 'block', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          Compiling report data...
        </div>
      )}

      {error && <div style={{ padding: 20, background: '#fee2e2', color: '#b91c1c', borderRadius: 12 }}>Failed to load report: {error.message}</div>}

      {!disasterId && !isLoading && (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>summarize</span>
          <h3>Select a disaster</h3>
          <p>Choose a disaster from the dropdown above to generate the After-Action Report.</p>
        </div>
      )}

      {/* Actual Report Dashboard */}
      {report && report.details && (
        <div id="printable-report" style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'white', padding: '24px 32px', borderRadius: 16, border: '1px solid var(--color-border)' }} className="print-card">
          
          {/* Report Header */}
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{report.details.name}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 15, color: '#64748b' }}>After-Action Report & Operational Summary</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, 
                  background: report.details.status === 'resolved' ? '#dcfce7' : '#e0f2fe',
                  color: report.details.status === 'resolved' ? '#166534' : '#0369a1',
                  marginBottom: 8, textTransform: 'uppercase'
                }}>
                  Status: {report.details.status}
                </span>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <strong>Activated:</strong> {new Date(report.details.activated_at).toLocaleDateString()}
                  {report.details.resolved_at && <span><br/><strong>Resolved:</strong> {new Date(report.details.resolved_at).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#334155' }}>Executive Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Needs', val: report.metrics.total_needs || 0, bg: '#f8fafc', fg: '#0f172a', border: '#cbd5e1' },
                { label: 'Volunteers', val: report.metrics.total_volunteers || 0, bg: '#f0fdf4', fg: '#166534', border: '#bbf7d0' },
                { label: 'Avg Response Time', val: `${Number(report.metrics.avg_response_time || 0).toFixed(1)}m`, bg: '#eff6ff', fg: '#1e40af', border: '#bfdbfe' },
                { label: 'Escalations', val: report.metrics.escalation_count || 0, bg: '#fef2f2', fg: '#991b1b', border: '#fecaca' },
                { label: 'SLA Compliance', val: `${Number(report.metrics.sla_compliance_pct || 0).toFixed(1)}%`, bg: '#fdf4ff', fg: '#86198f', border: '#f5d0fe' }
              ].map((k, i) => (
                <div key={i} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 24, color: k.fg, fontWeight: 800 }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 2-Column Grid for Details */}
          <div className="print-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
            
            {/* Organizations */}
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>apartment</span>
                Partner Organizations
              </h3>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Organization</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Resources Committed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.organizations?.length > 0 ? report.organizations : [{name: 'No organizations participated', total_committed: '-'}]).map((org, i) => (
                      <tr key={i} style={{ borderBottom: i === (report.organizations?.length || 1) - 1 ? 'none' : '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 500 }}>{org.name}</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a', textAlign: 'right', fontWeight: 700 }}>{org.total_committed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resources Breakdown */}
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                Resource Utilization
              </h3>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Resource Type</th>
                      <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Fulfilled / Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.needs_breakdown?.length > 0 ? report.needs_breakdown : [{resource_type: 'No specific resources requested', needed: 0, fulfilled: 0}]).map((res, i) => {
                      const pct = res.needed > 0 ? Math.min(100, Math.round((res.fulfilled / res.needed) * 100)) : 100;
                      return (
                        <tr key={i} style={{ borderBottom: i === (report.needs_breakdown?.length || 1) - 1 ? 'none' : '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 500, textTransform: 'capitalize' }}>{res.resource_type.replace('_', ' ')}</td>
                          <td style={{ padding: '8px 12px', color: '#0f172a', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                              <span style={{ fontWeight: 700 }}>{res.fulfilled || 0} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {res.needed}</span></span>
                              <div style={{ width: 50, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zones Impact */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>map</span>
                Operational Zones
              </h3>
              <div style={{ display: 'flex', gap: 12 }}>
                {['red', 'yellow', 'blue'].map(sev => {
                  const zoneData = report.zones?.find(z => z.severity === sev) || { count: 0 };
                  const styles = {
                    red: { bg: '#fef2f2', border: '#fca5a5', fg: '#b91c1c', icon: 'local_fire_department', label: 'Critical Zones' },
                    yellow: { bg: '#fffbeb', border: '#fcd34d', fg: '#b45309', icon: 'warning', label: 'Warning Zones' },
                    blue: { bg: '#eff6ff', border: '#93c5fd', fg: '#1d4ed8', icon: 'info', label: 'Info Zones' }
                  }[sev];
                  
                  return (
                    <div key={sev} style={{ flex: 1, background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.fg, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{styles.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: styles.fg, fontWeight: 600, opacity: 0.8 }}>{styles.label}</div>
                        <div style={{ fontSize: 20, color: styles.fg, fontWeight: 800 }}>{zoneData.count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
          
          <div className="no-print" style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 11 }}>
            Report generated by Sahyog Emergency Response System
          </div>
        </div>
      )}
    </div>
  );
}
