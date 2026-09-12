import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRegisterOrg } from '../../api/useOrg';
import { useMe } from '../../api/hooks';

export function OrgOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const registerOrg = useRegisterOrg();
  const { data: me } = useMe();
  const [form, setForm] = useState({
    name: '', registration_number: '', primary_phone: '', email: '', state: '', district: '',
  });

  // Already registered → go to org dashboard
  if (me?.role === 'organization' && me?.organization_id) {
    return <Navigate to="/org" replace />;
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerOrg.mutateAsync(form);
      localStorage.removeItem('loginIntent');
      // Invalidate the 'me' query so ProtectedRoute gets the updated role
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      // Small delay to let the refetch settle
      await new Promise(r => setTimeout(r, 500));
      navigate('/org');
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 24, padding: '48px 40px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#3b82f6' }}>apartment</span>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: '#0f172a' }}>Register Your Organization</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
          Fill in the details below to create your organization profile and start managing disaster relief resources.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Organization Name *</label>
            <input style={inputStyle} value={form.name} onChange={set('name')} required placeholder="e.g. Red Cross Chapter" />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Registration Number</label>
            <input style={inputStyle} value={form.registration_number} onChange={set('registration_number')} placeholder="e.g. NGO-MH-2024-001" />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ ...fieldWrap, flex: 1 }}>
              <label style={labelStyle}>Primary Phone</label>
              <input style={inputStyle} value={form.primary_phone} onChange={set('primary_phone')} placeholder="+91 9876543210" />
            </div>
            <div style={{ ...fieldWrap, flex: 1 }}>
              <label style={labelStyle}>Official Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="info@org.com" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ ...fieldWrap, flex: 1 }}>
              <label style={labelStyle}>State</label>
              <input style={inputStyle} value={form.state} onChange={set('state')} placeholder="Maharashtra" />
            </div>
            <div style={{ ...fieldWrap, flex: 1 }}>
              <label style={labelStyle}>District</label>
              <input style={inputStyle} value={form.district} onChange={set('district')} placeholder="Pune" />
            </div>
          </div>
          <button
            type="submit"
            disabled={registerOrg.isPending}
            style={{
              width: '100%', padding: '13px 16px', background: '#3b82f6', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              marginTop: 8, opacity: registerOrg.isPending ? 0.6 : 1,
            }}
          >
            {registerOrg.isPending ? 'Registering...' : 'Register Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}

const fieldWrap = { marginBottom: 16 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10,
  fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};
