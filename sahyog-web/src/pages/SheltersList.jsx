import { useState } from 'react';
import { useResourcesList } from '../api/hooks';
import styles from './DataList.module.css';

export function SheltersList() {
  const { data: list, isLoading, error } = useResourcesList();
  const createShelter = { mutate: () => {}, isPending: false };
  const updateShelter = { mutate: () => {}, isPending: false };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', lat: '', lng: '', capacity: '', facilities: '' });
  const [editId, setEditId] = useState(null);
  const [editCap, setEditCap] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createShelter.mutate(
      {
        name: form.name,
        lat: parseFloat(form.lat) || 0,
        lng: parseFloat(form.lng) || 0,
        capacity: parseInt(form.capacity) || null,
        facilities: form.facilities ? form.facilities.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
      {
        onSuccess: () => {
          setForm({ name: '', lat: '', lng: '', capacity: '', facilities: '' });
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdateCapacity = (id) => {
    updateShelter.mutate({ id, capacity: parseInt(editCap) || null }, {
      onSuccess: () => { setEditId(null); setEditCap(''); },
    });
  };

  if (isLoading) return <div className={styles.loading}>Loading shelters…</div>;
  if (error) return <div className={styles.error}>Error: {error.message}</div>;

  const rows = Array.isArray(list) ? list : [];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.title}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#3b82f6' }}>night_shelter</span>
            Shelters
          </h1>
          <p className={styles.subtitle}>{rows.length} registered shelter locations</p>
        </div>
        <button className={styles.actionBtn} onClick={() => setShowForm(!showForm)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'Add Shelter'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form className={styles.inlineForm} onSubmit={handleCreate}>
          <input type="text" placeholder="Shelter name*" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={styles.formInput} required />
          <input type="number" step="any" placeholder="Latitude" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className={styles.formInput} />
          <input type="number" step="any" placeholder="Longitude" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className={styles.formInput} />
          <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className={styles.formInput} />
          <input type="text" placeholder="Facilities (comma separated)" value={form.facilities} onChange={e => setForm({ ...form, facilities: e.target.value })} className={styles.formInput} style={{ minWidth: 200 }} />
          <button type="submit" className={styles.submitBtn} disabled={createShelter.isPending}>
            {createShelter.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Occupancy</th>
              <th>Facilities</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyState}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3 }}>home_work</span>
                    <p className={styles.emptyText}>No shelters registered</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#34b27b' }}>location_on</span>
                      {row.name}
                    </span>
                  </td>
                  <td>
                    {editId === row.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editCap}
                          onChange={e => setEditCap(e.target.value)}
                          className={styles.formInput}
                          style={{ width: 80, padding: '4px 8px' }}
                          autoFocus
                        />
                        <button className={styles.actionSmall} onClick={() => handleUpdateCapacity(row.id)} disabled={updateShelter.isPending}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                        </button>
                        <button className={`${styles.actionSmall} ${styles.actionDanger}`} onClick={() => setEditId(null)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ) : (
                      <span>
                        <strong>{row.capacity ?? '—'}</strong>
                        {row.capacity && <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>people</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{row.current_occupancy ?? 0}</strong>
                    {row.capacity && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                        / {row.capacity}
                      </span>
                    )}
                  </td>
                  <td>
                    {Array.isArray(row.facilities) && row.facilities.length > 0 ? (
                      <div className={styles.tagList}>
                        {row.facilities.map((f, i) => (
                          <span key={i} className={styles.tag}>{f}</span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <button
                      className={styles.actionSmall}
                      onClick={() => { setEditId(row.id); setEditCap(row.capacity || ''); }}
                      title="Edit capacity"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
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
