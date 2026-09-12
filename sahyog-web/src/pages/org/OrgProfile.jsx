import { useState, useEffect } from 'react';
import { useOrgProfile, useUpdateOrg } from '../../api/useOrg';
import s from './Org.module.css';

export function OrgProfile() {
  const { data: org, isLoading } = useOrgProfile();
  const updateOrg = useUpdateOrg();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (org) setForm({
      name: org.name || '',
      registration_number: org.registration_number || '',
      primary_phone: org.primary_phone || '',
      email: org.email || '',
      state: org.state || '',
      district: org.district || '',
    });
  }, [org]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateOrg.mutateAsync(form);
      setEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to update');
    }
  };

  if (isLoading) return <p className={s.loadingText} style={{ padding: 32 }}>Loading profile...</p>;

  const fields = [
    { key: 'name', label: 'Organization Name', icon: 'apartment' },
    { key: 'registration_number', label: 'Registration Number', icon: 'badge' },
    { key: 'primary_phone', label: 'Primary Phone', icon: 'phone' },
    { key: 'email', label: 'Email', icon: 'email' },
    { key: 'state', label: 'State', icon: 'location_on' },
    { key: 'district', label: 'District', icon: 'pin_drop' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className={s.pageTitleSm}>Organization Profile</h1>
          <p className={s.pageDesc}>View and update your organization details.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              background: editing ? '#64748b' : '#34b27b', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', height: 'fit-content'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{editing ? 'close' : 'edit'}</span>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      <div className={s.formCard} style={{ padding: 32 }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label className={s.labelRow}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{f.icon}</span>
                  {f.label}
                </label>
                {editing ? (
                  <input className={s.input} value={form[f.key] || ''} onChange={set(f.key)} />
                ) : (
                  <p className={s.fieldValue}>{org?.[f.key] || '—'}</p>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <button type="submit" disabled={updateOrg.isPending} style={{
                padding: '11px 24px', background: '#10b981', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {org?.created_at && (
        <p className={s.loadingText} style={{ marginTop: 16, fontSize: 12 }}>
          Organization created on {new Date(org.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
