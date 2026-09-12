import { useOrgZones } from '../../api/useOrg';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import s from './Org.module.css';

const SEVERITY_COLORS = { red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6' };

export function OrgZones() {
  const { data: zones = [], isLoading } = useOrgZones();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className={s.pageTitleSm}>Assigned Zones</h1>
        <p className={s.pageDesc}>Zones where your organization has active resources or volunteers.</p>
      </div>

      {isLoading ? (
        <p className={s.loadingText}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Global Org Zones Map */}
          <div style={{ height: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <MapContainer center={[19.076, 72.877]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {zones.map(z => {
                if (z.center_lat == null || z.center_lng == null) return null;
                const isAssigned = z.is_assigned;
                const color = isAssigned ? '#10b981' : (SEVERITY_COLORS[z.severity] || '#888'); // Green if assigned, severity otherwise
                return (
                  <Circle key={z.id} center={[z.center_lat, z.center_lng]}
                    radius={z.radius_meters || 500}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: isAssigned ? 0.4 : 0.15, 
                      dashArray: isAssigned ? '' : '8 4', 
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong style={{ color: color }}>{z.name}</strong><br/>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Disaster: {z.disaster_name}</span><br/>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Severity: {z.severity}</span><br/>
                      {isAssigned && (
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Active Volunteers/Resources Here</span>
                      )}
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Active Disaster Zones</h2>

          {zones.length === 0 ? (
            <div className={s.empty}>
              <span className={`material-symbols-outlined ${s.emptyIcon}`}>map</span>
              <p className={s.emptyText}>No active zones</p>
              <p className={s.emptyHint}>There are currently no active disaster zones.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {zones.map(z => (
                <div key={z.id} className={s.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-info-10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3b82f6' }}>location_on</span>
                    </div>
                    <div>
                      <h3 className={s.zoneCardTitle}>{z.name}</h3>
                      <span className={s.zoneCardSub}>{z.code}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <span className={s.zoneCardSub}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{z.disaster_name}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#3b82f6' }}>group</span>
                      <span className={s.zoneStat}>{z.org_volunteers || 0} volunteers</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>inventory_2</span>
                      <span className={s.zoneStat}>{z.org_resources || 0} resources</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {z.is_assigned ? (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'var(--badge-green-bg)',
                        color: 'var(--badge-green-fg)',
                      }}>Assigned Here</span>
                    ) : (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'var(--badge-muted-bg)',
                        color: 'var(--badge-muted-fg)',
                      }}>No Assignment</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
