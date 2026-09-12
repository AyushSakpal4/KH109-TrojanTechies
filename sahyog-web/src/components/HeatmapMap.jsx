import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

const shelterIcon = L.divIcon({
  className: 'heatmap-shelter-marker',
  html: '<div style="width:14px;height:14px;border-radius:999px;background:#2563eb;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePoint(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const lat = asNumber(raw.lat ?? raw.latitude ?? raw.location?.coordinates?.[1]);
  const lng = asNumber(raw.lng ?? raw.longitude ?? raw.location?.coordinates?.[0]);
  if (lat === null || lng === null) return null;

  const count = Math.max(1, asNumber(raw.count) ?? 1);
  const severity = Math.max(1, Math.min(10, asNumber(raw.severity) ?? 1));

  return { lat, lng, count, severity };
}

function normalizeShelter(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const lat = asNumber(raw.lat ?? raw.latitude ?? raw.location?.coordinates?.[1]);
  const lng = asNumber(raw.lng ?? raw.longitude ?? raw.location?.coordinates?.[0]);
  if (lat === null || lng === null) return null;

  return {
    id: raw.id || `${lat}-${lng}`,
    name: raw.name || 'Shelter',
    lat,
    lng,
    occupancy: raw.occupancy,
    capacity: raw.capacity,
  };
}

function severityColor(severity) {
  if (severity >= 8) return '#ef4444';
  if (severity >= 5) return '#f97316';
  return '#22c55e';
}

function LeafletHeatLayer({ points, viewMode }) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof L.heatLayer !== 'function') return undefined;

    const weighted = points.map((point) => {
      const severityWeight = point.severity / 10;
      const countBoost = Math.min(point.count, 10) / 20;
      const intensity = Math.min(1, severityWeight * 0.7 + countBoost);
      return [point.lat, point.lng, intensity];
    });

    if (!weighted.length) return undefined;

    const layer = L.heatLayer(weighted, {
      radius: viewMode === 'public' ? 28 : 34,
      blur: viewMode === 'public' ? 24 : 30,
      maxZoom: 17,
      minOpacity: viewMode === 'public' ? 0.45 : 0.55,
      gradient: {
        0.2: 'rgba(255, 240, 100, 0.40)',
        0.4: 'rgba(255, 160, 50, 0.70)',
        0.6: 'rgba(255, 80, 30, 0.85)',
        0.8: 'rgba(220, 0, 30, 0.95)',
        1.0: 'rgba(180, 0, 40, 1.00)',
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, viewMode]);

  return null;
}

export function HeatmapMap({ viewMode = 'public', height = '66vh' }) {
  const [points, setPoints] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('heatmap:update', (payload = {}) => {
      const incomingPoints = Array.isArray(payload.points)
        ? payload.points.map(normalizePoint).filter(Boolean)
        : [];

      const incomingShelters = Array.isArray(payload.shelters)
        ? payload.shelters.map(normalizeShelter).filter(Boolean)
        : [];

      setPoints(incomingPoints);
      setShelters(incomingShelters);
      setLastUpdated(payload.updatedAt || new Date().toISOString());
    });

    return () => {
      socket.off('heatmap:update');
      if (socket.connected) socket.disconnect();
    };
  }, []);

  const center = useMemo(() => {
    if (points.length > 0) {
      return [points[0].lat, points[0].lng];
    }
    if (shelters.length > 0) {
      return [shelters[0].lat, shelters[0].lng];
    }
    return [18.5204, 73.8567];
  }, [points, shelters]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <MapContainer
        center={center}
        zoom={11}
        minZoom={3.5}
        maxZoom={18}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        style={{ height: '100%', width: '100%', borderRadius: 16 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletHeatLayer points={points} viewMode={viewMode} />

        {viewMode === 'admin' &&
          points.map((point, index) => {
            if (point.severity < 8) return null;
            const color = severityColor(point.severity);
            return (
              <CircleMarker
                key={`detail-${index}-${point.lat}-${point.lng}`}
                center={[point.lat, point.lng]}
                radius={7}
                pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.9 }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong>Critical Heat Zone</strong>
                    <br />
                    Count: {point.count}
                    <br />
                    Severity: {point.severity}
                    <br />
                    Band: Red (8-10)
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {shelters.map((shelter) => (
          <Marker key={shelter.id} position={[shelter.lat, shelter.lng]} icon={shelterIcon}>
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong>{shelter.name}</strong>
                {shelter.occupancy != null && shelter.capacity != null && (
                  <div>Occupancy: {shelter.occupancy}/{shelter.capacity}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 12,
          color: 'var(--color-text-primary)',
          lineHeight: 1.45,
          zIndex: 1000,
        }}
      >
        <strong>{viewMode === 'admin' ? 'Detailed Live Heatmap' : 'Public Live Heatmap'}</strong>
        <div>Updates every 3 seconds</div>
        {lastUpdated && <div>Updated: {new Date(lastUpdated).toLocaleTimeString()}</div>}
      </div>

      {viewMode === 'admin' && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 12,
            color: 'var(--color-text-primary)',
            lineHeight: 1.45,
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: 10, display: 'inline-block' }} /> Red: 8-10</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, background: '#f97316', borderRadius: 10, display: 'inline-block' }} /> Orange: 5-7</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 10, display: 'inline-block' }} /> Green: &lt;5</div>
        </div>
      )}
    </div>
  );
}

export default HeatmapMap;
