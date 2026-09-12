import { useState } from 'react';
import { useOrgResources, useCreateOrgResource } from '../../api/useOrg';
import s from './Org.module.css';

export function OrgResources() {
  const { data: resources = [], isLoading } = useOrgResources();
  const createRes = useCreateOrgResource();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: '', quantity: 1, status: 'available' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createRes.mutateAsync(form);
      setForm({ type: '', quantity: 1, status: 'available' });
      setShowAdd(false);
    } catch (err) {
      alert(err.message || 'Failed to add resource');
    }
  };

  const statusColor = { available: '#22c55e', deployed: '#f59e0b', depleted: '#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className={s.pageTitleSm}>Resources</h1>
          <p className={s.pageDesc}>Track and manage your organization's relief resources.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
          background: '#34b27b', color: '#fff', border: 'none', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showAdd ? 'close' : 'add'}</span>
          {showAdd ? 'Cancel' : 'Add Resource'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className={s.formCard} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label className={s.label}>Resource Type *</label>
            <input className={s.input} value={form.type} onChange={set('type')} required placeholder="e.g. Water Bottles, Blankets" />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className={s.label}>Quantity</label>
            <input className={s.input} type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className={s.label}>Status</label>
            <select className={s.input} value={form.status} onChange={set('status')}>
              <option value="available">Available</option>
              <option value="deployed">Deployed</option>
            </select>
          </div>
          <button type="submit" disabled={createRes.isPending} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 24px', height: 42,
            background: '#10b981', color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {createRes.isPending ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      {/* Table */}
      {isLoading ? (
        <p className={s.loadingText}>Loading...</p>
      ) : resources.length === 0 ? (
        <div className={s.empty}>
          <span className={`material-symbols-outlined ${s.emptyIcon}`}>inventory_2</span>
          <p className={s.emptyText}>No resources added yet</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className={s.tableHead}>
                {['Type', 'Quantity', 'Status', 'Disaster', 'Zone', 'Added'].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id} className={s.tr}>
                  <td className={s.td}><span className={s.tdBold}>{r.type}</span></td>
                  <td className={s.td}>{r.quantity}</td>
                  <td className={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: `${statusColor[r.status] || '#94a3b8'}20`, color: statusColor[r.status] || '#64748b' }}>
                      {r.status}
                    </span>
                  </td>
                  <td className={s.td}>{r.disaster_name || '—'}</td>
                  <td className={s.td}>{r.zone_name || '—'}</td>
                  <td className={s.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
