import { useOrgVolunteers, useUnlinkVolunteer } from '../../api/useOrg';
import s from './Org.module.css';

export function OrgVolunteers() {
  const { data: volunteers = [], isLoading } = useOrgVolunteers();
  const unlinkMut = useUnlinkVolunteer();

  const handleUnlink = async (userId, name) => {
    if (!confirm(`Remove ${name} from your organization?`)) return;
    try {
      await unlinkMut.mutateAsync(userId);
    } catch (err) {
      alert(err.message || 'Failed to remove volunteer');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className={s.pageTitleSm}>Volunteers</h1>
          <p className={s.pageDesc}>Manage volunteers linked to your organization.</p>
        </div>
        <span className={s.countBadge}>
          {volunteers.length} volunteers
        </span>
      </div>

      {isLoading ? (
        <p className={s.loadingText}>Loading...</p>
      ) : volunteers.length === 0 ? (
        <div className={s.empty}>
          <span className={`material-symbols-outlined ${s.emptyIcon}`}>group_off</span>
          <p className={s.emptyText}>No volunteers linked yet</p>
          <p className={s.emptyHint}>Volunteers will appear here once linked to your organization by an admin.</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className={s.tableHead}>
                {['Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {volunteers.map(v => (
                <tr key={v.id} className={s.tr}>
                  <td className={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-info-10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3b82f6' }}>person</span>
                      </div>
                      <span className={s.tdBold}>{v.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className={s.td}>{v.email || '—'}</td>
                  <td className={s.td}>{v.phone || '—'}</td>
                  <td className={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-fg)' }}>{v.role}</span>
                  </td>
                  <td className={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: v.is_active ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', color: v.is_active ? 'var(--badge-green-fg)' : 'var(--badge-red-fg)' }}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={s.td}>
                    <button
                      onClick={() => handleUnlink(v.id, v.full_name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 13, fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
